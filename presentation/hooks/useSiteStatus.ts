import { useQuery } from "@tanstack/react-query";
import { getSiteStatusAction } from "@/core/actions/site-status.actions";

// Estado global del modo mantenimiento de compras.
// Se revalida cada 60s para reaccionar cuando se activa/quita en WordPress.
// Los eventos/productos SIEMPRE se muestran; solo se bloquea crear el pedido.
export const useSiteStatus = () => {
  const siteStatusQuery = useQuery({
    queryKey: ["site-status"],
    queryFn: getSiteStatusAction,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // revalidar cada minuto
    retry: 1,
  });

  return {
    siteStatusQuery,
    isMaintenance: siteStatusQuery.data?.maintenance ?? false,
    maintenanceMessage: siteStatusQuery.data?.message ?? null,
  };
};
