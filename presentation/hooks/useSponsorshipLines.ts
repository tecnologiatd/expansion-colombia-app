import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSponsorshipLines,
  getAdminSponsorshipLines,
  createSponsorshipLine,
  updateSponsorshipLine,
  deleteSponsorshipLine,
  SponsorshipLine,
} from "@/core/actions/sponsorship.actions";

// Public hook: active lines for checkout selector
export const useSponsorshipLines = () => {
  return useQuery<SponsorshipLine[], Error>({
    queryKey: ["sponsorship-lines"],
    queryFn: getSponsorshipLines,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};

// Admin hook: all lines + mutations
export const useAdminSponsorshipLines = () => {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sponsorship-lines"] });
    queryClient.invalidateQueries({ queryKey: ["admin-sponsorship-lines"] });
  };

  const query = useQuery<SponsorshipLine[], Error>({
    queryKey: ["admin-sponsorship-lines"],
    queryFn: getAdminSponsorshipLines,
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: (params: Omit<SponsorshipLine, "id">) =>
      createSponsorshipLine(params),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...params
    }: Partial<SponsorshipLine> & { id: number }) =>
      updateSponsorshipLine(id, params),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSponsorshipLine(id),
    onSuccess: invalidate,
  });

  return { query, createMutation, updateMutation, deleteMutation };
};
