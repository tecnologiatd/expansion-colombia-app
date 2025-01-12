import {useQuery} from "@tanstack/react-query";
import {getProfileAction} from "@/core/actions/get-profile.action";

export const useProfile = () => {

    const profileQuery = useQuery({
        queryKey: ['profile'],
        queryFn: () => getProfileAction(),
        staleTime: 1000 * 60,
    });

    return {
        profileQuery,
    };
}