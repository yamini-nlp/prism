import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsSummary, type AnalyticsSummary } from "@/lib/api";

export const analyticsSummaryQueryKey = ["analytics-summary"] as const;

export function useAnalyticsSummary() {
  return useQuery<AnalyticsSummary>({
    queryKey: analyticsSummaryQueryKey,
    queryFn: fetchAnalyticsSummary,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
}
