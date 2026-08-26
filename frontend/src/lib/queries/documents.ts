import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDocuments, fetchDocumentsList, deleteDocument, uploadFile, ingestUrl, ingestText, fetchSummary, resetDocuments,
  type DocumentRecord, type DocumentListParams, type DocumentListResult, type UploadJobResponse, type SummaryResult, type ResetResponse,
} from "@/lib/api";

export const documentsQueryKey = ["documents"] as const;

export function useDocuments(options?: { refetchInterval?: number | false; refetchIntervalInBackground?: boolean }) {
  return useQuery<DocumentRecord[]>({
    queryKey: documentsQueryKey,
    queryFn: fetchDocuments,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: options?.refetchIntervalInBackground,
  });
}

export function documentsListQueryKey(params: DocumentListParams) {
  return [...documentsQueryKey, "list", params] as const;
}

export function useDocumentsList(params: DocumentListParams, options?: { enabled?: boolean }) {
  return useQuery<DocumentListResult>({
    queryKey: documentsListQueryKey(params),
    queryFn: () => fetchDocumentsList(params),
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation<{ status: string; document_id: string }, Error, string>({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
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

export function useResetDocuments() {
  const queryClient = useQueryClient();
  return useMutation<ResetResponse, Error, void>({
    mutationFn: () => resetDocuments(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
  });
}
