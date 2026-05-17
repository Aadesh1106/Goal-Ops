-- ============================================================
-- GoalOps Enterprise — Production PostgreSQL Schema
-- Supabase / PostgreSQL 15+
-- ============================================================

-- ─── Cleanup ────────────────────────────────────────────────
DROP TABLE IF EXISTS shared_goals CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS escalations CASCADE;
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS quarterly_checkins CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS checkin_status CASCADE;
DROP TYPE IF EXISTS escalation_status CASCADE;
DROP TYPE IF EXISTS escalation_level CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS quarter_type CASCADE;
DROP TYPE IF EXISTS uom_type CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM Types ───────────────────────────────────────────────
CREATE TYPE user_role         AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE goal_status       AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'locked');
CREATE TYPE uom_type          AS ENUM ('percentage', 'number', 'currency', 'boolean', 'rating');
CREATE TYPE quarter_type      AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');
CREATE TYPE approval_status   AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE escalation_level  AS ENUM ('reminder', 'manager', 'admin');
CREATE TYPE escalation_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE checkin_status    AS ENUM ('pending', 'submitted', 'reviewed');
CREATE TYPE audit_action      AS ENUM (
  'goal_created', 'goal_updated', 'goal_submitted',
  'goal_approved', 'goal_rejected', 'goal_locked', 'goal_reopened',
  'checkin_created', 'checkin_updated',
  'escalation_created', 'escalation_resolved',
  'user_created', 'cycle_opened', 'cycle_closed'
);

-- ─── Timestamps helper function ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- Extends Supabase auth.users
-- ============================================================
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL UNIQUE,
  full_name        TEXT NOT NULL,
  role             user_role NOT NULL DEFAULT 'employee',
  department       TEXT NOT NULL,
  designation      TEXT NOT NULL DEFAULT '',
  manager_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  employee_code    TEXT NOT NULL UNIQUE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role       ON profiles(role);
CREATE INDEX idx_profiles_manager_id ON profiles(manager_id);
CREATE INDEX idx_profiles_department ON profiles(department);
CREATE INDEX idx_profiles_is_active  ON profiles(is_active);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: goals
-- Core entity — one row per employee goal per cycle year
-- ============================================================
CREATE TABLE goals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  thrust_area      TEXT NOT NULL,
  title            TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description      TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  uom_type         uom_type NOT NULL,
  target_value     NUMERIC(15,2) NOT NULL CHECK (target_value > 0),
  weightage        SMALLINT NOT NULL CHECK (weightage BETWEEN 10 AND 50),
  status           goal_status NOT NULL DEFAULT 'draft',
  cycle_year       SMALLINT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  manager_comment  TEXT,
  approved_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  locked_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Business constraint: max 8 goals per employee per cycle (enforced via trigger below)
  -- Business constraint: total weightage = 100 (enforced via trigger below)
  CONSTRAINT chk_cycle_year CHECK (cycle_year BETWEEN 2020 AND 2100)
);

CREATE INDEX idx_goals_employee_id  ON goals(employee_id);
CREATE INDEX idx_goals_status       ON goals(status);
CREATE INDEX idx_goals_cycle_year   ON goals(cycle_year);
CREATE INDEX idx_goals_approved_by  ON goals(approved_by);
CREATE INDEX idx_goals_thrust_area  ON goals(thrust_area);

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: lock approved_at / locked_at automatically
CREATE OR REPLACE FUNCTION handle_goal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  END IF;
  IF NEW.status = 'locked' AND OLD.status != 'locked' THEN
    NEW.locked_at = NOW();
  END IF;
  -- Prevent editing locked goals (only admin can unlock via direct update)
  IF OLD.status = 'locked' AND NEW.status = 'locked'
     AND (NEW.title != OLD.title OR NEW.weightage != OLD.weightage OR NEW.target_value != OLD.target_value) THEN
    RAISE EXCEPTION 'Cannot modify a locked goal';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_goal_status_change
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION handle_goal_status_change();

-- Trigger: enforce max 8 goals per employee per cycle
CREATE OR REPLACE FUNCTION enforce_goal_count()
RETURNS TRIGGER AS $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM goals
  WHERE employee_id = NEW.employee_id AND cycle_year = NEW.cycle_year;
  IF v_count >= 8 THEN
    RAISE EXCEPTION 'Employee cannot have more than 8 goals per cycle';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_goal_count
  BEFORE INSERT ON goals
  FOR EACH ROW EXECUTE FUNCTION enforce_goal_count();

-- ============================================================
-- TABLE: quarterly_checkins
-- Progress updates per goal per quarter
-- ============================================================
CREATE TABLE quarterly_checkins (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id           UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  employee_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quarter           quarter_type NOT NULL,
  cycle_year        SMALLINT NOT NULL,
  planned_value     NUMERIC(15,2) NOT NULL DEFAULT 0,
  actual_value      NUMERIC(15,2) NOT NULL DEFAULT 0,
  progress_percentage SMALLINT GENERATED ALWAYS AS (
    CASE WHEN planned_value = 0 THEN 0
         ELSE LEAST(ROUND((actual_value / planned_value * 100))::INT, 100)
    END
  ) STORED,
  employee_remarks  TEXT CHECK (char_length(employee_remarks) <= 500),
  manager_remarks   TEXT CHECK (char_length(manager_remarks) <= 500),
  status            checkin_status NOT NULL DEFAULT 'pending',
  submitted_at      TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (goal_id, quarter, cycle_year)
);

CREATE INDEX idx_checkins_goal_id     ON quarterly_checkins(goal_id);
CREATE INDEX idx_checkins_employee_id ON quarterly_checkins(employee_id);
CREATE INDEX idx_checkins_quarter     ON quarterly_checkins(quarter, cycle_year);
CREATE INDEX idx_checkins_status      ON quarterly_checkins(status);

CREATE TRIGGER trg_checkins_updated_at
  BEFORE UPDATE ON quarterly_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: approvals
-- One approval record per goal submission cycle
-- ============================================================
CREATE TABLE approvals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id       UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  manager_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        approval_status NOT NULL DEFAULT 'pending',
  comment       TEXT CHECK (char_length(comment) <= 500),
  acted_at      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approvals_goal_id    ON approvals(goal_id);
CREATE INDEX idx_approvals_manager_id ON approvals(manager_id);
CREATE INDEX idx_approvals_status     ON approvals(status);

CREATE TRIGGER trg_approvals_updated_at
  BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: escalations
-- Auto-generated escalation records
-- ============================================================
CREATE TABLE escalations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id           UUID REFERENCES goals(id) ON DELETE SET NULL,
  escalation_level  escalation_level NOT NULL DEFAULT 'reminder',
  reason            TEXT NOT NULL,
  status            escalation_status NOT NULL DEFAULT 'open',
  triggered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sla_deadline      TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escalations_employee_id ON escalations(employee_id);
CREATE INDEX idx_escalations_status      ON escalations(status);
CREATE INDEX idx_escalations_level       ON escalations(escalation_level);
CREATE INDEX idx_escalations_sla         ON escalations(sla_deadline);

CREATE TRIGGER trg_escalations_updated_at
  BEFORE UPDATE ON escalations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: audit_logs
-- Immutable event log — never update or delete
-- ============================================================
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,               -- 'goal', 'checkin', 'approval', etc.
  entity_id     UUID NOT NULL,
  action        audit_action NOT NULL,
  before_state  JSONB,
  after_state   JSONB,
  metadata      JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_id    ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity      ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action      ON audit_logs(action);
CREATE INDEX idx_audit_created_at  ON audit_logs(created_at DESC);

-- ============================================================
-- TABLE: shared_goals
-- Goals shared across employees (contribution model)
-- ============================================================
CREATE TABLE shared_goals (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_goal_id             UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  shared_with_employee_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contribution_weightage      SMALLINT NOT NULL CHECK (contribution_weightage BETWEEN 1 AND 100),
  status                      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (primary_goal_id, shared_with_employee_id)
);

CREATE INDEX idx_shared_goals_primary  ON shared_goals(primary_goal_id);
CREATE INDEX idx_shared_goals_employee ON shared_goals(shared_with_employee_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_checkins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_goals        ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: get current user's manager_id
CREATE OR REPLACE FUNCTION current_user_manager()
RETURNS UUID AS $$
  SELECT manager_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ─── profiles ────────────────────────────────────────────────
-- Users can read their own profile; managers can read their reports; admins can read all
CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: manager reads team"
  ON profiles FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "profiles: admin reads all"
  ON profiles FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ─── goals ───────────────────────────────────────────────────
CREATE POLICY "goals: employee reads own"
  ON goals FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "goals: manager reads team goals"
  ON goals FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM profiles WHERE manager_id = auth.uid()
    )
  );

CREATE POLICY "goals: admin reads all"
  ON goals FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "goals: employee creates own"
  ON goals FOR INSERT
  WITH CHECK (employee_id = auth.uid() AND current_user_role() = 'employee');

CREATE POLICY "goals: employee updates draft own"
  ON goals FOR UPDATE
  USING (employee_id = auth.uid() AND status IN ('draft', 'rejected'));

CREATE POLICY "goals: manager updates for approval"
  ON goals FOR UPDATE
  USING (
    employee_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
    AND status = 'submitted'
  );

CREATE POLICY "goals: admin updates all"
  ON goals FOR UPDATE
  USING (current_user_role() = 'admin');

CREATE POLICY "goals: employee deletes own draft"
  ON goals FOR DELETE
  USING (employee_id = auth.uid() AND status = 'draft');

-- ─── quarterly_checkins ──────────────────────────────────────
CREATE POLICY "checkins: employee reads own"
  ON quarterly_checkins FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "checkins: manager reads team"
  ON quarterly_checkins FOR SELECT
  USING (
    employee_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
  );

CREATE POLICY "checkins: admin reads all"
  ON quarterly_checkins FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "checkins: employee creates own"
  ON quarterly_checkins FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "checkins: employee updates own pending"
  ON quarterly_checkins FOR UPDATE
  USING (employee_id = auth.uid() AND status IN ('pending', 'submitted'));

CREATE POLICY "checkins: manager updates remarks"
  ON quarterly_checkins FOR UPDATE
  USING (
    employee_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
  );

-- ─── approvals ───────────────────────────────────────────────
CREATE POLICY "approvals: manager reads own"
  ON approvals FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "approvals: employee reads own"
  ON approvals FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "approvals: admin reads all"
  ON approvals FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "approvals: manager creates"
  ON approvals FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "approvals: manager updates own"
  ON approvals FOR UPDATE
  USING (manager_id = auth.uid());

-- ─── escalations ─────────────────────────────────────────────
CREATE POLICY "escalations: employee reads own"
  ON escalations FOR SELECT
  USING (employee_id = auth.uid());

CREATE POLICY "escalations: manager reads team"
  ON escalations FOR SELECT
  USING (
    employee_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
    OR escalation_level = 'manager'
  );

CREATE POLICY "escalations: admin reads all"
  ON escalations FOR SELECT
  USING (current_user_role() = 'admin');

-- ─── audit_logs ──────────────────────────────────────────────
CREATE POLICY "audit: actor reads own"
  ON audit_logs FOR SELECT
  USING (actor_id = auth.uid());

CREATE POLICY "audit: admin reads all"
  ON audit_logs FOR SELECT
  USING (current_user_role() = 'admin');

CREATE POLICY "audit: insert authenticated"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── shared_goals ────────────────────────────────────────────
CREATE POLICY "shared_goals: participants read"
  ON shared_goals FOR SELECT
  USING (
    shared_with_employee_id = auth.uid()
    OR primary_goal_id IN (SELECT id FROM goals WHERE employee_id = auth.uid())
  );

CREATE POLICY "shared_goals: admin reads all"
  ON shared_goals FOR SELECT
  USING (current_user_role() = 'admin');

-- ============================================================
-- SAMPLE DEMO DATA
-- ============================================================
-- Demo data removed: profiles require real auth.users UUIDs.
-- Create users via the app signup flow or Supabase Auth dashboard,
-- then data will be populated automatically.
