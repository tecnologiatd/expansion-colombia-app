import { useQuery } from "@tanstack/react-query";
import { useScreenActive } from "./useScreenActive";
import { getTicketUsageStatuses } from "@/core/actions/ticket-validation.actions";
import { useConnectivityStore } from "@/core/offline/connectivity";

const TICKET_STATUS_POLL_MS = 30000;

export const useTicketUsageStatuses = (qrCodes: string[]) => {
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const active = useScreenActive();

  return useQuery({
    queryKey: ["ticket-status", "usage", qrCodes],
    queryFn: ({ signal }) => getTicketUsageStatuses(qrCodes, signal),
    enabled: qrCodes.length > 0 && isOnline && active,
    staleTime: 0,
    refetchInterval: (query) => {
      const statusesByCode = new Map(
        query.state.data?.map((status) => [status.qrCode, status]),
      );
      // También cubre una sola entrada. Si falta algún estado o quedan usos,
      // mantener el sondeo hasta conocer que todas las entradas fueron usadas.
      const allTicketsUsed =
        qrCodes.length > 0 &&
        qrCodes.every((code) => {
          const status = statusesByCode.get(code);
          return !!status && status.usageCount >= status.maxUsages;
        });
      return allTicketsUsed ? false : TICKET_STATUS_POLL_MS;
    },
    refetchIntervalInBackground: false,
    retry: false,
  });
};
