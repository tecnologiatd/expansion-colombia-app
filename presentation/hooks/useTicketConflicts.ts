// presentation/hooks/useTicketConflicts.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTicketConflicts,
  resolveTicketConflict,
} from "@/core/actions/ticket-validation.actions";

export const useTicketConflicts = (eventId?: string) => {
  const queryClient = useQueryClient();

  const conflictsQuery = useQuery({
    queryKey: ["ticket-conflicts", eventId ?? "all"],
    queryFn: () => getTicketConflicts(eventId),
    staleTime: 30000,
  });

  const resolveConflictMutation = useMutation({
    mutationFn: resolveTicketConflict,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-conflicts"] });
    },
  });

  return { conflictsQuery, resolveConflictMutation };
};
