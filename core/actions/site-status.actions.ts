import { backendApi } from "@/core/api/wordpress-api";

export interface SiteStatus {
  maintenance: boolean;
  message: string | null;
  source: string;
  checkedAt: string;
}

export const getSiteStatusAction = async (): Promise<SiteStatus> => {
  try {
    const { data } = await backendApi.get<SiteStatus>("/site-status");
    return data;
  } catch (error) {
    console.error("Error fetching site status:", error);
    // Fail-open: si no se puede verificar el estado, se permite comprar.
    // El backend igual bloquea con 503 si realmente hay mantenimiento.
    return {
      maintenance: false,
      message: null,
      source: "unreachable",
      checkedAt: new Date().toISOString(),
    };
  }
};
