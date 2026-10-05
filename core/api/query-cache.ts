import { QueryClient } from "@tanstack/react-query";
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
