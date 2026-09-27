// presentation/hooks/useTicketValidation.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import {
  getTicketStatus,
  validateTicket,
  TicketStatus,
  TicketValidationResponse,
} from "@/core/actions/ticket-validation.actions";
import { getOrderByIdAction } from "@/core/actions/order.actions";
import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import {
  isServerUnreachableError,
  useConnectivityStore,
} from "@/core/offline/connectivity";
import {
  enqueueValidation,
  getTicketByQr,
  incrementLocalUsage,
} from "@/core/offline/ticket-db";
import { useTicketSyncStore } from "@/presentation/hooks/useTicketSync";

// En puerta no podemos esperar el timeout default de 15 s: si el backend no
// responde rápido, caemos al espejo local.
const SCAN_STATUS_TIMEOUT_MS = 4000;

const localTicketStatus = (
  hash: string,
  eventId: string,
): TicketStatus | null => {
  const local = getTicketByQr(`${hash}/${eventId}`);
  if (!local) return null;
  return {
    orderId: local.orderId,
    eventId: local.eventId,
    usageCount: local.usageCount,
    maxUsages: local.maxUsages,
    remainingUsages: local.maxUsages - local.usageCount,
    revoked: local.revoked,
    usageHistory: [],
    source: "local",
    customerName: local.customerName,
  };
};

export const useTicketValidation = (qrCode?: string, eventId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Verificar si el usuario es administrador
  const isAdmin =
    user?.role === "administrator" || user?.role === "shop_manager";

  // Procesar el QR para asegurar el formato correcto
  const processedQrCode = useMemo(() => {
    if (!qrCode) return undefined;

    if (qrCode.includes("/")) {
      const [hash] = qrCode.split("/");
      return hash;
    }

    return qrCode;
  }, [qrCode]);

  // Query para el estado del ticket
  // staleTime=0 + refetchOnMount='always' → every screen re-entry re-checks
  // status, so an admin-validated ticket shows "Usado" as soon as user reopens
  // the order. Cost: 1 request per ticket per screen mount (cheap GET).
  // networkMode 'always': sin él TanStack pausa la query cuando NetInfo dice
  // offline y nunca llegaríamos al fallback local.
  const ticketStatusQuery = useQuery({
    queryKey: ["ticket-status", processedQrCode, eventId],
    queryFn: async (): Promise<TicketStatus> => {
      if (!processedQrCode || !eventId) {
        throw new Error("QR code and eventId are required");
      }

      const isOnline = useConnectivityStore.getState().isOnline;

      if (isOnline) {
        try {
          return await getTicketStatus(processedQrCode, eventId, {
            timeoutMs: SCAN_STATUS_TIMEOUT_MS,
          });
        } catch (error) {
          // Backend caído/saturado: probar el espejo local antes de fallar
          if (!isServerUnreachableError(error)) throw error;
        }
      }

      const local = localTicketStatus(processedQrCode, eventId);
      if (!local) {
        throw new Error(
          "Ticket no encontrado (sin conexión). Sincroniza cuando vuelva la conexión.",
        );
      }
      if (local.revoked) throw new Error("Entrada revocada. No se puede validar.");
      return local;
    },
    enabled: !!processedQrCode && !!eventId,
    staleTime: 0,
    refetchOnMount: "always",
    networkMode: "always",
    retry: false,
    gcTime: 60000,
  });

  const statusFromLocal = ticketStatusQuery.data?.source === "local";

  // Query para los detalles de la orden (solo cuando el estado vino del
  // servidor; offline el nombre del cliente viene del espejo local)
  const orderDetailsQuery = useQuery({
    queryKey: ["order", ticketStatusQuery.data?.orderId],
    queryFn: () => {
      if (!ticketStatusQuery.data?.orderId) {
        throw new Error("Order ID is required");
      }
      return getOrderByIdAction(ticketStatusQuery.data.orderId);
    },
    enabled: !!ticketStatusQuery.data?.orderId && !statusFromLocal,
    staleTime: 30000,
    gcTime: 60000,
    retry: false,
  });

  // Mutación para validar el ticket. Online: validación normal. Offline o
  // backend inaccesible: se encola en SQLite y se sincroniza después.
  const validateTicketMutation = useMutation({
    mutationFn: async (params: {
      qrCode: string;
      eventId: string;
    }): Promise<TicketValidationResponse> => {
      if (!isAdmin) {
        throw new Error("No tienes permisos para validar tickets");
      }

      const isOnline = useConnectivityStore.getState().isOnline;

      if (isOnline) {
        try {
          return await validateTicket(params);
        } catch (error) {
          if (!isServerUnreachableError(error)) throw error;
        }
      }

      const local = getTicketByQr(params.qrCode);
      if (!local) {
        throw new Error(
          "Ticket no encontrado (sin conexión). No se puede validar.",
        );
      }

      enqueueValidation({
        localId: Crypto.randomUUID(),
        qrCode: params.qrCode,
        eventId: params.eventId,
        validatedAt: new Date().toISOString(),
      });
      incrementLocalUsage(params.qrCode);
      useTicketSyncStore.getState().refreshCounts();

      return {
        message: "Ticket validado sin conexión",
        orderId: local.orderId,
        eventId: local.eventId,
        usageCount: local.usageCount + 1,
        remainingUsages: local.maxUsages - (local.usageCount + 1),
        offline: true,
      };
    },
    networkMode: "always",
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-status", processedQrCode, eventId],
      });
    },
  });

  // Función para refrescar los datos manualmente
  const refreshData = useCallback(async () => {
    await Promise.all([
      ticketStatusQuery.refetch(),
      orderDetailsQuery.refetch(),
    ]);
  }, [ticketStatusQuery, orderDetailsQuery]);

  return {
    ticketStatusQuery,
    orderDetailsQuery,
    validateTicketMutation,
    processedQrCode,
    refreshData,
    isAdmin,
    statusFromLocal,
  };
};
