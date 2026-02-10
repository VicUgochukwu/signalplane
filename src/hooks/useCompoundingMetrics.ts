import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDemo } from '@/contexts/DemoContext';

export interface CompoundingMetrics {
  weeks_of_data: number;
  velocity_baselines_active: number;
  source_calibrations_active: number;
  prediction_accuracy_trend: number[];
  recommendations_adopted: number;
  recommendations_total: number;
  recommendations_with_outcomes: number;
  artifact_edits_total: number;
  calibration_adjustments_total: number;
  compounding_score: number;
}

/** Per-sector demo compounding data — simulates 12–20 weeks of compounding */
const DEMO_COMPOUNDING: Record<string, CompoundingMetrics> = {
  cybersecurity: {
    weeks_of_data: 18,
    velocity_baselines_active: 6,
    source_calibrations_active: 4,
    prediction_accuracy_trend: [52, 55, 58, 61, 64, 68, 71, 73],
    recommendations_adopted: 14,
    recommendations_total: 22,
    recommendations_with_outcomes: 8,
    artifact_edits_total: 11,
    calibration_adjustments_total: 24,
    compounding_score: 72,
  },
  'product-analytics': {
    weeks_of_data: 14,
    velocity_baselines_active: 5,
    source_calibrations_active: 3,
    prediction_accuracy_trend: [48, 52, 56, 59, 62, 65, 67, 69],
    recommendations_adopted: 11,
    recommendations_total: 18,
    recommendations_with_outcomes: 5,
    artifact_edits_total: 8,
    calibration_adjustments_total: 18,
    compounding_score: 61,
  },
  'developer-tools': {
    weeks_of_data: 16,
    velocity_baselines_active: 7,
    source_calibrations_active: 5,
    prediction_accuracy_trend: [50, 54, 57, 62, 65, 69, 72, 74],
    recommendations_adopted: 16,
    recommendations_total: 24,
    recommendations_with_outcomes: 10,
    artifact_edits_total: 14,
    calibration_adjustments_total: 28,
    compounding_score: 76,
  },
  'sales-engagement': {
    weeks_of_data: 12,
    velocity_baselines_active: 4,
    source_calibrations_active: 3,
    prediction_accuracy_trend: [45, 50, 54, 58, 61, 64, 66, 68],
    recommendations_adopted: 9,
    recommendations_total: 16,
    recommendations_with_outcomes: 4,
    artifact_edits_total: 6,
    calibration_adjustments_total: 14,
    compounding_score: 55,
  },
  'customer-success': {
    weeks_of_data: 13,
    velocity_baselines_active: 4,
    source_calibrations_active: 2,
    prediction_accuracy_trend: [47, 51, 55, 58, 62, 64, 67, 69],
    recommendations_adopted: 10,
    recommendations_total: 17,
    recommendations_with_outcomes: 5,
    artifact_edits_total: 7,
    calibration_adjustments_total: 16,
    compounding_score: 58,
  },
  'marketing-automation': {
    weeks_of_data: 15,
    velocity_baselines_active: 5,
    source_calibrations_active: 4,
    prediction_accuracy_trend: [49, 53, 57, 60, 64, 67, 70, 72],
    recommendations_adopted: 13,
    recommendations_total: 20,
    recommendations_with_outcomes: 7,
    artifact_edits_total: 10,
    calibration_adjustments_total: 22,
    compounding_score: 67,
  },
  'data-infrastructure': {
    weeks_of_data: 17,
    velocity_baselines_active: 6,
    source_calibrations_active: 4,
    prediction_accuracy_trend: [51, 55, 59, 63, 66, 70, 73, 75],
    recommendations_adopted: 15,
    recommendations_total: 23,
    recommendations_with_outcomes: 9,
    artifact_edits_total: 12,
    calibration_adjustments_total: 26,
    compounding_score: 74,
  },
  'fintech-infrastructure': {
    weeks_of_data: 14,
    velocity_baselines_active: 5,
    source_calibrations_active: 3,
    prediction_accuracy_trend: [46, 50, 54, 58, 61, 65, 68, 70],
    recommendations_adopted: 12,
    recommendations_total: 19,
    recommendations_with_outcomes: 6,
    artifact_edits_total: 9,
    calibration_adjustments_total: 20,
    compounding_score: 63,
  },
  'hr-tech': {
    weeks_of_data: 11,
    velocity_baselines_active: 3,
    source_calibrations_active: 2,
    prediction_accuracy_trend: [44, 48, 52, 56, 59, 62, 65, 67],
    recommendations_adopted: 8,
    recommendations_total: 14,
    recommendations_with_outcomes: 3,
    artifact_edits_total: 5,
    calibration_adjustments_total: 12,
    compounding_score: 50,
  },
  collaboration: {
    weeks_of_data: 12,
    velocity_baselines_active: 4,
    source_calibrations_active: 3,
    prediction_accuracy_trend: [47, 51, 55, 59, 62, 65, 68, 70],
    recommendations_adopted: 10,
    recommendations_total: 16,
    recommendations_with_outcomes: 5,
    artifact_edits_total: 7,
    calibration_adjustments_total: 15,
    compounding_score: 56,
  },
  'cloud-infrastructure': {
    weeks_of_data: 19,
    velocity_baselines_active: 8,
    source_calibrations_active: 5,
    prediction_accuracy_trend: [53, 57, 61, 64, 68, 71, 74, 76],
    recommendations_adopted: 17,
    recommendations_total: 25,
    recommendations_with_outcomes: 11,
    artifact_edits_total: 15,
    calibration_adjustments_total: 30,
    compounding_score: 79,
  },
  'ai-ml-platforms': {
    weeks_of_data: 16,
    velocity_baselines_active: 6,
    source_calibrations_active: 4,
    prediction_accuracy_trend: [50, 54, 58, 62, 66, 69, 72, 75],
    recommendations_adopted: 14,
    recommendations_total: 21,
    recommendations_with_outcomes: 8,
    artifact_edits_total: 12,
    calibration_adjustments_total: 25,
    compounding_score: 71,
  },
  'devops-observability': {
    weeks_of_data: 15,
    velocity_baselines_active: 5,
    source_calibrations_active: 4,
    prediction_accuracy_trend: [49, 53, 57, 61, 64, 68, 71, 73],
    recommendations_adopted: 13,
    recommendations_total: 20,
    recommendations_with_outcomes: 7,
    artifact_edits_total: 10,
    calibration_adjustments_total: 22,
    compounding_score: 68,
  },
  'ecommerce-platforms': {
    weeks_of_data: 13,
    velocity_baselines_active: 4,
    source_calibrations_active: 3,
    prediction_accuracy_trend: [46, 50, 54, 58, 61, 64, 67, 69],
    recommendations_adopted: 10,
    recommendations_total: 17,
    recommendations_with_outcomes: 5,
    artifact_edits_total: 7,
    calibration_adjustments_total: 16,
    compounding_score: 59,
  },
  'nocode-lowcode': {
    weeks_of_data: 11,
    velocity_baselines_active: 3,
    source_calibrations_active: 2,
    prediction_accuracy_trend: [44, 48, 52, 56, 60, 63, 66, 68],
    recommendations_adopted: 8,
    recommendations_total: 14,
    recommendations_with_outcomes: 3,
    artifact_edits_total: 5,
    calibration_adjustments_total: 12,
    compounding_score: 51,
  },
};

/**
 * Fetch Compounding Intelligence metrics for the current user.
 * In demo mode, returns sector-specific synthetic data.
 */
export function useCompoundingMetrics() {
  const { user } = useAuth();
  const demo = useDemo();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: demo?.isDemo
      ? ['demo-compounding-metrics', demo.sectorSlug]
      : ['compounding-metrics', user?.id],
    queryFn: async (): Promise<CompoundingMetrics | null> => {
      // Demo mode: return sector-specific synthetic data
      if (demo?.isDemo) {
        return DEMO_COMPOUNDING[demo.sectorSlug] || DEMO_COMPOUNDING['cybersecurity'];
      }

      if (!user) return null;

      const { data: result, error: rpcError } = await supabase
        .rpc('get_compounding_metrics', { p_user_id: user.id });

      if (rpcError) {
        console.error('Error fetching compounding metrics:', rpcError);
        return null;
      }

      const row = Array.isArray(result) ? result[0] : result;
      return row ? (row as CompoundingMetrics) : null;
    },
    enabled: !!user || !!demo?.isDemo,
    staleTime: 5 * 60 * 1000,
  });

  return {
    metrics: data,
    isLoading,
    error,
    refetch,
  };
}
