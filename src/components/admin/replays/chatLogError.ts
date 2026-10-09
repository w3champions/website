export type ChatLogFailure =
  | { kind: "session-expired"; message: string }
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string };

function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

/**
 * Maps a failed chat-log load to what the moderator should see. The backend answers
 * 404 when the game or its replay is not found and 410 when the replay is archived;
 * both are ordinary outcomes for old games rather than faults.
 */
export function describeChatLogFailure(error: unknown): ChatLogFailure {
  switch (statusOf(error)) {
    case 401:
      return { kind: "session-expired", message: "Your session expired while loading the chat log. Please log in again." };
    case 404:
      return { kind: "unavailable", message: "No chat log available for this game." };
    case 410:
      return { kind: "unavailable", message: "The replay for this game has been archived, so its chat log is no longer available." };
    default:
      return { kind: "error", message: "We could not load the chat log right now. Please try again." };
  }
}
