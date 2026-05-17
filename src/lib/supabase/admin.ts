// ============================================================
// GoalOps Enterprise — Supabase Admin Client (Server Only)
// ============================================================
import { createClient } from '@supabase/supabase-js';

// Bypasses RLS — use only in trusted server-side contexts
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
