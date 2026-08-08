import { useMutation, useQuery } from "@tanstack/react-query";
import { streamGenerate, fetchEvalReport, runEvalReport, type GenerateRequestBody, type EvalReportResponse, type UploadJobResponse } from "@/lib/api";

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

export function useRunEvalReport() {
  return useMutation<UploadJobResponse, Error, void>({
    mutationFn: () => runEvalReport(),
  });
}