import { backendApi } from "@/core/api/wordpress-api";

export interface SponsorshipLine {
  name: string;
  category?: string;
  order?: number;
  active?: boolean;
}

export interface SponsorshipLinesResponse {
  success: boolean;
  data: SponsorshipLine[];
  message?: string;
  error?: string;
}

// Obtener todas las líneas de auspicio desde el backend que las obtiene de WordPress
export const getSponsorshipLines = async (): Promise<SponsorshipLine[]> => {
  try {
    const { data } =
      await backendApi.get<SponsorshipLinesResponse>("/sponsorship-lines");

    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }

    console.warn("No se recibieron líneas de auspicio válidas:", data);
    return [];
  } catch (error) {
    console.error("Error fetching sponsorship lines:", error);
    throw new Error("No se pudieron cargar las líneas de auspicio");
  }
};
