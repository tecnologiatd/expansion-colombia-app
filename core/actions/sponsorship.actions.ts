import { backendApi } from "@/core/api/wordpress-api";

export interface SponsorshipLine {
  id: number;
  name: string;
  category?: string;
  order?: number;
  active?: boolean;
}

export interface SponsorshipLinesResponse {
  success: boolean;
  data: SponsorshipLine[];
}

// Public: active lines for checkout
export const getSponsorshipLines = async (): Promise<SponsorshipLine[]> => {
  const { data } =
    await backendApi.get<SponsorshipLinesResponse>("/sponsorship-lines");

  if (data.success && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

// Admin: all lines (including inactive)
export const getAdminSponsorshipLines = async (): Promise<
  SponsorshipLine[]
> => {
  const { data } = await backendApi.get<SponsorshipLine[]>(
    "/sponsorship-lines/admin",
  );
  return data;
};

export const createSponsorshipLine = async (
  params: Omit<SponsorshipLine, "id">,
): Promise<SponsorshipLine> => {
  const { data } = await backendApi.post<SponsorshipLine>(
    "/sponsorship-lines",
    params,
  );
  return data;
};

export const updateSponsorshipLine = async (
  id: number,
  params: Partial<SponsorshipLine>,
): Promise<SponsorshipLine> => {
  const { data } = await backendApi.put<SponsorshipLine>(
    `/sponsorship-lines/${id}`,
    params,
  );
  return data;
};

export const deleteSponsorshipLine = async (
  id: number,
): Promise<void> => {
  await backendApi.delete(`/sponsorship-lines/${id}`);
};
