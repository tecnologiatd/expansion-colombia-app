import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getOrderTickets } from "@/core/actions/order-tickets.action";
import { isPaidOrder } from "@/core/checkout/payment-policy";
import { useTicketCodesStore } from "@/core/stores/ticket-codes.store";
import { useConnectivityStore } from "@/core/offline/connectivity";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useGenerateTicket } from "./useGenerateTicket";
import { useScreenActive } from "./useScreenActive";

const EMPTY_CODES: string[] = [];

export const useTicketCodes = (
  orderId: string,
  eventId: string,
  orderStatus: string,
  quantity: number,
) => {
  const username = useAuthStore((state) => state.user?.username);
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const active = useScreenActive();
  const cachedCodes = useTicketCodesStore((state) =>
    state.getCodes(orderId, eventId),
  );
  const [hydrated, setHydrated] = useState(
    useTicketCodesStore.persist.hasHydrated(),
  );
  const attempted = useRef<string | null>(null);
  const { generateTicketMutation } = useGenerateTicket();
  const { mutate } = generateTicketMutation;
  const paid = isPaidOrder(orderStatus?.toLowerCase());
  const eventAvailable =
    Number.isSafeInteger(Number(eventId)) && Number(eventId) > 0;
  const hasCodes = !!cachedCodes?.qrCodes.length;

  useEffect(() => {
    const unsubscribe = useTicketCodesStore.persist.onFinishHydration(() =>
      setHydrated(true),
    );
    // Cubre hidratación terminada entre render y suscripción.
    setHydrated(useTicketCodesStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  // Todas las secciones del pedido comparten esta consulta. Esperar a que
  // termine la hidratación evita recuperar/generar códigos que ya están guardados.
  const orderTicketsQuery = useQuery({
    queryKey: ["tickets", "order", orderId, username],
    queryFn: ({ signal }) => getOrderTickets(orderId, signal),
    enabled:
      hydrated &&
      paid &&
      !!orderId &&
      !!username &&
      !hasCodes &&
      isOnline &&
      active,
    // Una respuesta vacía puede cambiar si otra app genera las entradas.
    // Con códigos persistidos esta consulta queda desactivada.
    staleTime: 60000,
    retry: false,
  });

  useEffect(() => {
    if (
      !orderTicketsQuery.data ||
      useAuthStore.getState().user?.username !== username
    )
      return;
    for (const [event, tickets] of Object.entries(orderTicketsQuery.data)) {
      if (
        tickets.length &&
        !useTicketCodesStore.getState().getCodes(orderId, event)?.qrCodes.length
      ) {
        useTicketCodesStore.getState().saveCodes(
          orderId,
          event,
          tickets.map((ticket) => ticket.qrCode),
        );
      }
    }
  }, [orderTicketsQuery.data, orderId, username]);

  const recoveredCodes = orderTicketsQuery.data?.[eventId]?.map(
    (ticket) => ticket.qrCode,
  );
  const codes = cachedCodes?.qrCodes.length
    ? cachedCodes.qrCodes
    : recoveredCodes?.length
      ? recoveredCodes
      : EMPTY_CODES;

  useEffect(() => {
    const key = `${username}:${orderId}:${eventId}`;
    if (
      !hydrated ||
      !paid ||
      !eventAvailable ||
      !isOnline ||
      !active ||
      codes.length ||
      !orderTicketsQuery.isSuccess ||
      orderTicketsQuery.isFetching ||
      attempted.current === key
    )
      return;
    attempted.current = key;
    mutate({ orderId, eventId, quantity, usagesPerTicket: 1 });
  }, [
    hydrated,
    paid,
    eventAvailable,
    isOnline,
    active,
    codes.length,
    orderTicketsQuery.isSuccess,
    orderTicketsQuery.isFetching,
    username,
    orderId,
    eventId,
    quantity,
    mutate,
  ]);

  const retry = () => {
    if (!isOnline || !active) return;
    // Nunca generar si la recuperación falló: el pedido puede tener QR históricos.
    if (orderTicketsQuery.isError || !orderTicketsQuery.isSuccess) {
      void orderTicketsQuery.refetch();
    } else if (!codes.length && paid && eventAvailable) {
      mutate({ orderId, eventId, quantity, usagesPerTicket: 1 });
    }
  };

  return {
    codes,
    cachedCodes,
    eventAvailable,
    retry,
    loading:
      !hydrated ||
      orderTicketsQuery.isLoading ||
      generateTicketMutation.isPending,
    failed: orderTicketsQuery.isError || generateTicketMutation.isError,
  };
};
