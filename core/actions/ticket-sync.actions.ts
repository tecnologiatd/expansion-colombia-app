// core/actions/ticket-sync.actions.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { backendApi } from "@/core/api/wordpress-api";
import { LocalTicket, PendingValidation } from "@/core/offline/ticket-db";

const DEVICE_ID_KEY = "scanner-device-id";

export interface TicketSyncPage {
  nextCursor?: string | null;
  snapshotUntil?: string;
  serverTime: string;
  page: number;
  totalPages: number;
  total: number;
  activeEventIds: string[];
  tickets: LocalTicket[];
}

export type BatchValidationStatus =
  "applied" | "applied_conflict" | "duplicate" | "not_found";

export interface BatchValidationResult {
  localId: string;
  status: BatchValidationStatus;
  usageCount?: number;
  maxUsages?: number;
}

export interface BatchValidateResponse {
  serverTime: string;
  results: BatchValidationResult[];
}

export const getDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const fetchTicketSyncPage = async (
  since: string | null,
  page: number,
  cursor?: string,
  until?: string,
  signal?: AbortSignal,
): Promise<TicketSyncPage> => {
  const { data } = await backendApi.get<TicketSyncPage>("/tickets/sync", {
    signal,
    params: {
      page,
      mode: "cursor",
      ...(cursor ? { cursor } : {}),
      ...(until ? { until } : {}),
      ...(since ? { since } : {}),
    },
  });
  return data;
};

export const pushValidationBatch = async (
  deviceId: string,
  validations: PendingValidation[],
  signal?: AbortSignal,
): Promise<BatchValidateResponse> => {
  const { data } = await backendApi.post<BatchValidateResponse>(
    "/tickets/validate/batch",
    { deviceId, validations },
    { signal },
  );
  return data;
};
