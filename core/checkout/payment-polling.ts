import { isWaitingOrder } from "./payment-policy";

export const PAYMENT_WATCH_MS = 30 * 60 * 1000;

export const getPaymentPollInterval = (
  status: string | undefined,
  startedAt: number,
  now = Date.now(),
): number | false => {
  const elapsed = now - startedAt;
  if (!isWaitingOrder(status) || elapsed >= PAYMENT_WATCH_MS) return false;
  if (elapsed < 2 * 60 * 1000) return 10000;
  if (elapsed < 5 * 60 * 1000) return 30000;
  return 60000;
};
