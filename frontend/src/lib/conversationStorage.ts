export function conversationStorageKey(userId: string | null | undefined): string {
  return userId ? `prism_workspace_conversation:${userId}` : "prism_workspace_conversation:anonymous";
}

export function queryLogStorageKey(userId: string | null | undefined): string {
  return userId ? `prism_query_log:${userId}` : "prism_query_log:anonymous";
}