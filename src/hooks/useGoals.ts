'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Goal } from '@/types';
import { GOAL_CONSTRAINTS } from '@/types';

interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: (employeeId: string) => Promise<void>;
  totalWeightage: number;
  remainingWeightage: number;
  canAddGoal: boolean;
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async (employeeId: string) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGoals((data as Goal[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const remainingWeightage = GOAL_CONSTRAINTS.TOTAL_WEIGHTAGE - totalWeightage;
  const canAddGoal = goals.length < GOAL_CONSTRAINTS.MAX_GOALS && totalWeightage < GOAL_CONSTRAINTS.TOTAL_WEIGHTAGE;

  return { goals, loading, error, fetchGoals, totalWeightage, remainingWeightage, canAddGoal };
}
