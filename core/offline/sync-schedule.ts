export const SYNC_INTERVAL_MS = 5 * 60 * 1000;
export const SYNC_RETRY_MIN_MS = 60 * 1000;
export const SYNC_JITTER_MS = 10 * 1000;

export const canSyncTickets = (status: string, role?: string) =>
  status === "authenticated" &&
  (role === "administrator" || role === "shop_manager");

export const nextSyncDelay = (
  lastAttemptAt: number | null,
  failures: number,
  now = Date.now(),
) => {
  if (lastAttemptAt === null) return 0;
  const interval = failures
    ? Math.min(
        SYNC_INTERVAL_MS,
        SYNC_RETRY_MIN_MS * 2 ** Math.min(failures - 1, 3),
      )
    : SYNC_INTERVAL_MS;
  return Math.max(0, lastAttemptAt + interval - now);
};
