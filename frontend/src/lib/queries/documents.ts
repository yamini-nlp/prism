import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDocuments, uploadFile, ingestUrl, ingestText, fetchSummary, type DocumentRecord, type UploadJobResponse, type SummaryResult } from "@/lib/api";

export const documentsQueryKey = ["documents"] as const;

export function useDocuments() {
  return useQuery<DocumentRecord[]>({
    queryKey: documentsQueryKey,
    queryFn: fetchDocuments,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation<UploadJobResponse, Error, File>({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
  });
}

export function useIngestUrl() {
  const queryClient = useQueryClient();
  return useMutation<UploadJobResponse, Error, string>({
    mutationFn: (url: string) => ingestUrl(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
  });
}

export function useIngestText() {
  const queryClient = useQueryClient();
  return useMutation<UploadJobResponse, Error, { text: string; source: string }>({
    mutationFn: ({ text, source }) => ingestText(text, source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
  });
}

export function useGenerateSummary() {
  return useMutation<{ summary: SummaryResult }, Error, { text: string; source: string }>({
    mutationFn: ({ text, source }) => fetchSummary(text, source),
  });
}