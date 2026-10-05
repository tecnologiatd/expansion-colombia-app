import * as Sentry from "@sentry/react-native";
import { isAxiosError, isCancel } from "axios";
import { useConnectivityStore } from "@/core/offline/connectivity";

export type AppErrorOperation =
  | "orders.create"
  | "orders.details"
  | "checkout.payment"
  | "tickets.recover"
  | "tickets.generate"
  | "tickets.usage"
  | "offline.sync";

const reportedErrors = new WeakSet<object>();
const recentFailures = new Map<string, number>();
const REPORT_WINDOW_MS = 5 * 60 * 1000;

// Do not send order IDs, QR codes, query strings or payment links.
const requestRoute = (url: string): string => {
  const path = url.replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0];
  if (/^\/orders(?:\/|$)/.test(path)) {
    return path === "/orders"
      ? "/orders"
      : path.endsWith("/checkout")
        ? "/orders/:id/checkout"
        : "/orders/:id";
  }
  if (/^\/tickets\/order\//.test(path)) return "/tickets/order/:id";
  if (/^\/tickets\/(generate|usage-status|sync|validate\/batch)$/.test(path))
    return path;
  if (/^\/tickets(?:\/|$)/.test(path)) return "/tickets/:code";
  return "[request]";
};

export const initMonitoring = () => {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN && !__DEV__,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || "production",
    sendDefaultPii: false,
    tracesSampleRate: 0.2,
    beforeBreadcrumb: (breadcrumb) => {
      // Existing console calls can contain entire Axios errors, buyers or QR.
      if (breadcrumb.category === "console") return null;
      if (
        breadcrumb.type === "http" ||
        breadcrumb.category === "xhr" ||
        breadcrumb.category === "fetch"
      ) {
        return {
          ...breadcrumb,
          message: undefined,
          data: {
            method: breadcrumb.data?.method,
            status_code: breadcrumb.data?.status_code,
            url: requestRoute(String(breadcrumb.data?.url ?? "")),
          },
        };
      }
      // Keep automatic navigation out: route params can include billing data.
      if (breadcrumb.category === "navigation") return null;
      return breadcrumb;
    },
    beforeSend: (event) => {
      event.user = undefined;
      event.extra = undefined;
      if (event.request) {
        event.request = {
          method: event.request.method,
          url: requestRoute(event.request.url ?? ""),
        };
      }
      return event;
    },
    beforeSendTransaction: (event) => {
      // HTTP spans can otherwise expose QR codes in URLs even without errors.
      for (const span of event.spans ?? []) {
        if (span.op?.startsWith("http")) {
          const method = String(span.data?.["http.request.method"] ?? "");
          const status = span.data?.["http.response.status_code"];
          span.description = `${method} [request]`.trim();
          span.data = {
            "http.request.method": method,
            "http.response.status_code": status,
          };
        }
      }
      event.request = undefined;
      event.user = undefined;
      event.extra = undefined;
      return event;
    },
  });
};

export const reportAppError = (
  error: unknown,
  operation: AppErrorOperation,
  stage?: "prepare" | "push" | "pull",
) => {
  if (__DEV__ || !process.env.EXPO_PUBLIC_SENTRY_DSN) return;
  // Expected maintenance, logout/cancellation and offline operation are normal.
  if (error instanceof Error && error.message.startsWith("MAINTENANCE:"))
    return;
  let source = error;
  for (let depth = 0; depth < 3; depth++) {
    if (source instanceof Error && "cause" in source && source.cause) {
      source = source.cause;
    } else break;
  }
  if (isCancel(source) || !useConnectivityStore.getState().isOnline) return;
  const status = isAxiosError(source) ? source.response?.status : undefined;
  // Validation, authorization, expired/revoked tickets and rate limits are
  // already handled by the UI; reporting them would flood Sentry.
  if (status && [400, 401, 403, 409, 410, 422, 429].includes(status)) return;
  if (source instanceof Error && source.name === "AbortError") return;
  if (source && typeof source === "object" && reportedErrors.has(source))
    return;

  const code = isAxiosError(source) ? source.code : undefined;
  const safeCode = code && /^[A-Z_]{2,40}$/.test(code) ? code : "unexpected";
  const safeName =
    source instanceof TypeError
      ? "TypeError"
      : source instanceof RangeError
        ? "RangeError"
        : "Error";
  const frames =
    source instanceof Error && source.stack
      ? source.stack.split("\n").filter((line) => /^\s*at /.test(line))
      : [];
  const key = `${operation}:${stage ?? ""}:${status ?? 0}:${safeCode}:${safeName}:${frames[0] ?? ""}`;
  const now = Date.now();
  if (source && typeof source === "object") reportedErrors.add(source);
  if (now - (recentFailures.get(key) ?? 0) < REPORT_WINDOW_MS) return;
  recentFailures.set(key, now);
  // Bounded even if many different call sites fail during a long session.
  if (recentFailures.size > 100) {
    const oldest = recentFailures.keys().next().value;
    if (oldest !== undefined) recentFailures.delete(oldest);
  }

  // A fresh error omits Axios config/body/headers and server/customer messages.
  // Retain only JS stack frames so uploaded source maps locate the actual call.
  const safeError = new Error(`Unexpected failure: ${operation}`);
  safeError.name = safeName;
  if (frames.length)
    safeError.stack = `${safeName}: ${safeError.message}\n${frames.join("\n")}`;
  try {
    Sentry.captureException(safeError, {
      tags: {
        operation,
        ...(stage ? { sync_stage: stage } : {}),
        ...(status ? { http_status: String(status) } : {}),
        error_code: safeCode,
      },
      fingerprint: [
        "{{ default }}",
        operation,
        stage ?? "",
        String(status ?? 0),
        safeCode,
      ],
    });
  } catch {
    // Monitoring must never interrupt checkout or the persistent sync queue.
  }
};
