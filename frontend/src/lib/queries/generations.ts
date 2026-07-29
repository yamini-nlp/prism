import { useMutation, useQuery } from "@tanstack/react-query";
import { streamGenerate, fetchEvalReport, type GenerateRequestBody, type EvalReportResponse } from "@/lib/api";

export interface GenerateVariables extends GenerateRequestBody {
  onEvent: (event: string, data: any) => void;
  signal?: AbortSignal;
}

export function useGenerate() {
  return useMutation<void, Error, GenerateVariables>({
    mutationFn: ({ onEvent, signal, ...body }) => streamGenerate(body, onEvent, signal),
  });
}

export const evalReportQueryKey = ["eval-report"] as const;

export function useEvalReport() {
  return useQuery<EvalReportResponse>({
    queryKey: evalReportQueryKey,
    queryFn: fetchEvalReport,
    staleTime: 15_000,
  });
}