import { useMutation } from "@tanstack/react-query";
import { verifyClaims, type VerificationResponse } from "@/lib/api";

export function useVerification() {
  return useMutation<VerificationResponse, Error, { answer: string; topK?: number }>({
    mutationFn: ({ answer, topK }) => verifyClaims(answer, topK),
  });
}