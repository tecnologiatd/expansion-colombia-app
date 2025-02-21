// presentation/hooks/useTicketValidation.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTicketStatus,
  validateTicket,
} from "@/core/actions/ticket-validation.actions";
import { getOrderByIdAction } from "@/core/actions/order.actions";
import { useCallback, useMemo } from "react";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

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
  const ticketStatusQuery = useQuery({
    queryKey: ["ticket-status", processedQrCode, eventId],
    queryFn: () => {
      if (!processedQrCode || !eventId) {
        throw new Error("QR code and eventId are required");
      }
      return getTicketStatus(processedQrCode, eventId);
    },
    enabled: !!processedQrCode && !!eventId,
    staleTime: 30000, // Datos considerados frescos por 30 segundos
    cacheTime: 60000, // Mantener en caché por 1 minuto
  });

  // Query para los detalles de la orden
  const orderDetailsQuery = useQuery({
    queryKey: ["order", ticketStatusQuery.data?.orderId],
    queryFn: () => {
      if (!ticketStatusQuery.data?.orderId) {
        throw new Error("Order ID is required");
      }
      return getOrderByIdAction(ticketStatusQuery.data.orderId);
    },
    enabled: !!ticketStatusQuery.data?.orderId,
    staleTime: 30000,
    cacheTime: 60000,
    retry: false,
  });

  // Mutación para validar el ticket
  const validateTicketMutation = useMutation({
    mutationFn: async (params: { qrCode: string; eventId: string }) => {
      if (!isAdmin) {
        throw new Error("No tienes permisos para validar tickets");
      }
      return validateTicket(params);
    },
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
  };
};
