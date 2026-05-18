-- ============================================================
-- GoalOps Enterprise — Supabase BRD Compliance Migration
-- ============================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Start Transaction
BEGIN;

-- ==========================================
-- 1. Migrate Unit of Measurement (UoM) Enums
-- ==========================================

-- 1. Migrate Unit of Measurement (UoM) Enums (Idempotent Check)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'uom_type' AND e.enumlabel = 'numeric_min'
  ) THEN
    RAISE NOTICE 'UoM enum already migrated. Skipping...';
  ELSE
    -- Create the new BRD-compliant UoM enum type
    CREATE TYPE uom_type_new AS ENUM ('numeric_min', 'numeric_max', 'timeline', 'zero_based');

    -- Remove default constraint from goals table temporarily
    ALTER TABLE goals ALTER COLUMN uom_type DROP DEFAULT;

    -- Alter goals to map the old values to the new ENUM values safely
    ALTER TABLE goals 
      ALTER COLUMN uom_type TYPE uom_type_new 
      USING (
        CASE uom_type::text
          WHEN 'percentage' THEN 'numeric_min'::uom_type_new
          WHEN 'number' THEN 'numeric_min'::uom_type_new
          WHEN 'currency' THEN 'numeric_max'::uom_type_new
          WHEN 'boolean' THEN 'zero_based'::uom_type_new
          WHEN 'rating' THEN 'numeric_min'::uom_type_new
          ELSE 'numeric_min'::uom_type_new
        END
      );

    -- Drop the old enum type safely
    DROP TYPE IF EXISTS uom_type CASCADE;

    -- Rename the new type to the official uom_type name
    ALTER TYPE uom_type_new RENAME TO uom_type;

    -- Re-apply default constraint to goals table
    ALTER TABLE goals ALTER COLUMN uom_type SET DEFAULT 'numeric_min'::uom_type;
  END IF;
END $$;


-- ==========================================
-- 2. Migrate Quarterly Checkins Schema (Idempotent Check)
-- ==========================================
DO $$
BEGIN
  -- Check if progress_percentage is generated and drop it if so
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='quarterly_checkins' 
      AND column_name='progress_percentage' 
      AND is_generated='ALWAYS'
  ) THEN
    ALTER TABLE quarterly_checkins DROP COLUMN progress_percentage;
  END IF;

  -- Check if progress_percentage exists at all as a column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='quarterly_checkins' AND column_name='progress_percentage'
  ) THEN
    ALTER TABLE quarterly_checkins ADD COLUMN progress_percentage SMALLINT NOT NULL DEFAULT 0;
  END IF;

  -- Create progress status enum type if missing
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'goal_progress_status') THEN
    CREATE TYPE goal_progress_status AS ENUM ('Not Started', 'On Track', 'Completed');
  END IF;

  -- Add progress_status column if it does not exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='quarterly_checkins' AND column_name='progress_status'
  ) THEN
    ALTER TABLE quarterly_checkins ADD COLUMN progress_status goal_progress_status NOT NULL DEFAULT 'Not Started';
  END IF;
END $$;


-- ==========================================
-- 3. Automated Progress Math Trigger
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_progress_percentage()
RETURNS TRIGGER AS $$
DECLARE
  v_uom uom_type;
BEGIN
  -- Fetch the UoM Type from the related goal
  SELECT uom_type INTO v_uom
  FROM goals
  WHERE id = NEW.goal_id;

  -- Compute progress based on UoM Type
  IF v_uom = 'zero_based' THEN
    -- Zero-based: 0 means 100% success, any other value is 0% progress
    IF NEW.actual_value = 0 THEN
      NEW.progress_percentage := 100;
    ELSE
      NEW.progress_percentage := 0;
    END IF;
  ELSIF v_uom = 'numeric_max' THEN
    -- Max-based (cost/timeline/defect rate - lower is better)
    -- Formula: Target ÷ Achievement (capped at 100%)
    IF NEW.actual_value <= 0 THEN
      -- Handle division by zero or negative values safely
      IF NEW.planned_value = 0 THEN
        NEW.progress_percentage := 100;
      ELSE
        NEW.progress_percentage := 0;
      END IF;
    ELSE
      NEW.progress_percentage := LEAST(ROUND((NEW.planned_value / NEW.actual_value) * 100)::INT, 100);
    END IF;
  ELSE
    -- Min-based & Timeline-based (higher is better - achievement / target)
    -- Formula: Achievement ÷ Target (capped at 100%)
    IF NEW.planned_value = 0 THEN
      IF NEW.actual_value >= 0 THEN
        NEW.progress_percentage := 100;
      ELSE
        NEW.progress_percentage := 0;
      END IF;
    ELSE
      NEW.progress_percentage := LEAST(ROUND((NEW.actual_value / NEW.planned_value) * 100)::INT, 100);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the progress calculation trigger to quarterly_checkins
DROP TRIGGER IF EXISTS trg_calculate_progress_percentage ON quarterly_checkins;
CREATE TRIGGER trg_calculate_progress_percentage
  BEFORE INSERT OR UPDATE ON quarterly_checkins
  FOR EACH ROW EXECUTE FUNCTION calculate_progress_percentage();


-- ==========================================
-- 4. Enforce 100% Total Weightage on Submission
-- ==========================================

CREATE OR REPLACE FUNCTION verify_submission_weightage()
RETURNS TRIGGER AS $$
DECLARE
  v_total_weightage INT;
BEGIN
  -- Run check only when an employee submits their goal sheet for review
  IF NEW.status = 'submitted' AND OLD.status != 'submitted' THEN
    SELECT COALESCE(SUM(weightage), 0) INTO v_total_weightage
    FROM goals
    WHERE employee_id = NEW.employee_id 
      AND cycle_year = NEW.cycle_year 
      AND status != 'rejected';

    -- Since the current row update is in flight, its new status is being committed.
    -- If total is not 100%, raise an exception and rollback.
    IF v_total_weightage != 100 THEN
      RAISE EXCEPTION 'Cannot submit goal sheet. Total weightage of active goals must equal exactly 100%%. Current total: % %%', v_total_weightage;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the weightage verification trigger to goals
DROP TRIGGER IF EXISTS trg_verify_submission_weightage ON goals;
CREATE TRIGGER trg_verify_submission_weightage
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION verify_submission_weightage();


-- ==========================================
-- 5. Cascade Synchronization for Shared Goals
-- ==========================================

CREATE OR REPLACE FUNCTION sync_shared_goal_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_shared_title TEXT;
BEGIN
  -- Get the title of the goal being updated
  SELECT title INTO v_title FROM goals WHERE id = NEW.goal_id;

  -- Only synchronize if this is a primary manager goal
  IF v_title LIKE '[Manager KPI]%' THEN
    v_shared_title := replace(v_title, '[Manager KPI]', '[Shared]');

    -- Check if metrics changed
    IF (TG_OP = 'INSERT') OR (OLD.actual_value IS DISTINCT FROM NEW.actual_value) OR (OLD.planned_value IS DISTINCT FROM NEW.planned_value) THEN
      
      -- 1. Perform update on existing check-ins of the shared recipient goals
      UPDATE quarterly_checkins
      SET 
        actual_value = NEW.actual_value,
        planned_value = NEW.planned_value,
        progress_status = NEW.progress_status,
        updated_at = NOW()
      WHERE quarter = NEW.quarter 
        AND cycle_year = NEW.cycle_year
        AND goal_id IN (
          SELECT g.id 
          FROM goals g
          JOIN shared_goals sg ON sg.shared_with_employee_id = g.employee_id
          WHERE sg.primary_goal_id = NEW.goal_id
            AND g.title = v_shared_title
        );

      -- 2. If any recipient does not have a check-in record for this quarter yet, automatically insert it
      INSERT INTO quarterly_checkins (goal_id, employee_id, quarter, cycle_year, planned_value, actual_value, progress_status, status)
      SELECT g.id, g.employee_id, NEW.quarter, NEW.cycle_year, NEW.planned_value, NEW.actual_value, NEW.progress_status, 'submitted'
      FROM goals g
      JOIN shared_goals sg ON sg.shared_with_employee_id = g.employee_id
      WHERE sg.primary_goal_id = NEW.goal_id
        AND g.title = v_shared_title
        AND NOT EXISTS (
          SELECT 1 FROM quarterly_checkins qc 
          WHERE qc.goal_id = g.id AND qc.quarter = NEW.quarter AND qc.cycle_year = NEW.cycle_year
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the shared goals sync trigger to quarterly_checkins
DROP TRIGGER IF EXISTS trg_sync_shared_goals ON quarterly_checkins;
CREATE TRIGGER trg_sync_shared_goals
  AFTER INSERT OR UPDATE ON quarterly_checkins
  FOR EACH ROW EXECUTE FUNCTION sync_shared_goal_achievements();

-- ==========================================
-- 6. Check-in Scheduler Table & Default Settings
-- ==========================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable RLS and establish enterprise security policies (resolves Supabase critical security warnings)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on app_settings" ON public.app_settings;
CREATE POLICY "Allow public select on app_settings" 
  ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin to manage app_settings" ON public.app_settings;
CREATE POLICY "Allow admin to manage app_settings" 
  ON public.app_settings FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT ALL ON TABLE public.app_settings TO postgres, service_role, authenticated, anon;

INSERT INTO app_settings (key, value) 
VALUES ('window_override', '{"active_window": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 7. Automated Audit Log Triggers
-- ==========================================
CREATE OR REPLACE FUNCTION audit_goal_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID;
  v_action audit_action;
BEGIN
  -- Determine who is making the change (fallback to system or employee if auth.uid() is null)
  v_actor := COALESCE(auth.uid(), NEW.employee_id, OLD.employee_id);
  
  -- Determine the action
  IF TG_OP = 'INSERT' THEN
    v_action := 'goal_created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      CASE NEW.status
        WHEN 'submitted' THEN v_action := 'goal_submitted';
        WHEN 'approved' THEN v_action := 'goal_approved';
        WHEN 'rejected' THEN v_action := 'goal_rejected';
        WHEN 'locked' THEN v_action := 'goal_locked';
        ELSE v_action := 'goal_updated';
      END CASE;
    ELSE
      v_action := 'goal_updated';
    END IF;
  ELSE
    -- DELETE
    v_action := 'goal_updated'; -- fallback or general
  END IF;

  INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, before_state, after_state, metadata)
  VALUES (
    v_actor,
    'goal',
    COALESCE(NEW.id, OLD.id),
    v_action,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    jsonb_build_object('operation', TG_OP, 'timestamp', NOW())
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_goal_changes ON goals;
CREATE TRIGGER trg_audit_goal_changes
  AFTER INSERT OR UPDATE OR DELETE ON goals
  FOR EACH ROW EXECUTE FUNCTION audit_goal_changes();


CREATE OR REPLACE FUNCTION audit_checkin_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor UUID;
  v_action audit_action;
BEGIN
  v_actor := COALESCE(auth.uid(), NEW.employee_id, OLD.employee_id);
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'checkin_created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'checkin_updated';
  ELSE
    v_action := 'checkin_updated';
  END IF;

  INSERT INTO audit_logs (actor_id, entity_type, entity_id, action, before_state, after_state, metadata)
  VALUES (
    v_actor,
    'checkin',
    COALESCE(NEW.id, OLD.id),
    v_action,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    jsonb_build_object('operation', TG_OP, 'quarter', COALESCE(NEW.quarter, OLD.quarter))
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_checkin_changes ON quarterly_checkins;
CREATE TRIGGER trg_audit_checkin_changes
  AFTER INSERT OR UPDATE OR DELETE ON quarterly_checkins
  FOR EACH ROW EXECUTE FUNCTION audit_checkin_changes();

-- ==========================================
-- 8. High-Performance Database Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals (status);
CREATE INDEX IF NOT EXISTS idx_goals_employee_cycle ON public.goals (employee_id, cycle_year);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles (department) WHERE is_active = true;

-- ==========================================
-- 9. Fix Approvals Table RLS Policy
-- ==========================================
DO $$
BEGIN
  -- Drop the incorrect policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'approvals' AND policyname = 'approvals: manager creates'
  ) THEN
    DROP POLICY "approvals: manager creates" ON public.approvals;
  END IF;

  -- Create the correct policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'approvals' AND policyname = 'approvals: employee creates'
  ) THEN
    CREATE POLICY "approvals: employee creates"
      ON public.approvals FOR INSERT
      WITH CHECK (employee_id = auth.uid());
  END IF;
END $$;

-- ==========================================
-- 10. Auto-Fix Existing Employee-Manager Assignments
-- ==========================================
-- This fixes the issue where employees from Engineering/Finance were incorrectly assigned to a General manager during registration.
DO $$
DECLARE
  emp RECORD;
  mgr_id UUID;
BEGIN
  FOR emp IN SELECT id, department FROM public.profiles WHERE role = 'employee'
  LOOP
    -- Try to find a manager in the exact same department
    SELECT id INTO mgr_id FROM public.profiles 
    WHERE role = 'manager' AND department = emp.department 
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      -- 1. Reassign the employee to the correct manager
      UPDATE public.profiles SET manager_id = mgr_id WHERE id = emp.id;
      
      -- 2. Migrate any pending approval requests to the correct manager
      UPDATE public.approvals SET manager_id = mgr_id WHERE employee_id = emp.id;
    END IF;
  END LOOP;
END $$;

-- Commit transaction
COMMIT;
