import { useQuery } from "@tanstack/react-query";
import {
  getSponsorshipLines,
  SponsorshipLine,
} from "@/core/actions/sponsorship.actions";

export const useSponsorshipLines = () => {
  const query = useQuery<SponsorshipLine[], Error>({
    queryKey: ["sponsorship-lines"],
    queryFn: getSponsorshipLines,
    staleTime: 1000 * 60 * 5, // Considerar los datos frescos por 5 minutos
    retry: 2, // Reintentar hasta 2 veces en caso de error
  });

  return query;
};
