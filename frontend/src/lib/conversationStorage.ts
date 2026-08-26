export function conversationStorageKey(userId: string | null | undefined, docFingerprint: string | null | undefined): string {
  const user = userId || "anonymous";
  const docs = docFingerprint || "empty";
  return `prism_workspace_conversation:${user}:${docs}`;
}

export function conversationStorageKeyPrefix(userId: string | null | undefined): string {
  const user = userId || "anonymous";
  return `prism_workspace_conversation:${user}:`;
}

export function queryLogStorageKey(userId: string | null | undefined): string {
  return userId ? `prism_query_log:${userId}` : "prism_query_log:anonymous";
}

export function hashDocumentIds(ids: string[]): string {
  const sorted = [...ids].sort();
  const joined = sorted.join(",");
  let hash = 5381;
  for (let i = 0; i < joined.length; i++) {
    hash = ((hash << 5) + hash + joined.charCodeAt(i)) | 0;
  }
  return `${sorted.length}-${(hash >>> 0).toString(36)}`;
}
