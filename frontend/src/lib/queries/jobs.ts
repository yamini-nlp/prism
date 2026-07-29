import { useQuery } from "@tanstack/react-query";
import { fetchJobStatus, type JobStatus } from "@/lib/api";

export function jobQueryKey(jobId: string | null) {
  return ["job", jobId] as const;
}

export function useJob(jobId: string | null, options?: { enabled?: boolean }) {
  return useQuery<JobStatus>({
    queryKey: jobQueryKey(jobId),
    queryFn: () => fetchJobStatus(jobId as string),
    enabled: Boolean(jobId) && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "complete" || status === "failed") return false;
      return 1200;
    },
    refetchOnWindowFocus: false,
  });
}