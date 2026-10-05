import { QueryCache, MutationCache, QueryClient } from "@tanstack/react-query";
import { reportAppError } from "@/core/monitoring/sentry";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
export const PERSISTED_QUERY_PREFIXES = [
  "profile",
  "order",
  "ticket-status",
  "tickets",
  "products",
  "product",
  "events",
];

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Runs once per failed query after its retries, shared across observers.
    onError: (error, query) => {
      const [resource, kind] = query.queryKey;
      if (resource === "order") reportAppError(error, "orders.details");
      if (resource === "tickets" && kind === "order")
        reportAppError(error, "tickets.recover");
      if (resource === "ticket-status" && kind === "usage")
        reportAppError(error, "tickets.usage");
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.errorOperation === "orders.create")
        reportAppError(error, "orders.create");
      if (mutation.meta?.errorOperation === "tickets.generate")
        reportAppError(error, "tickets.generate");
    },
  }),
  defaultOptions: { queries: { gcTime: CACHE_MAX_AGE, retry: 1 } },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "rq-cache",
});

export async function clearPrivateQueryCache() {
  queryClient.clear();
  await asyncStoragePersister.removeClient();
}
