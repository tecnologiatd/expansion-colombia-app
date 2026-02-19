import { backendApi } from "@/core/api/wordpress-api";
import Profile from "@/core/interfaces/profile.interface";
import { AxiosError } from "axios";

interface GetProfileParams {
    page?: number;
    perPage?: number;
}

export const getProfileAction = async (
    params: GetProfileParams = {},
): Promise<Profile> => {
    const { page = 1, perPage = 10 } = params;

    try {
        const { data } = await backendApi.get<Profile>(`/profile`, {
            params: {
                page,
                per_page: perPage,
            },
        });

        return data;

    } catch (error) {
        const status = (error as AxiosError)?.response?.status;
        const mayNotSupportPagination =
            status === 400 || status === 404 || status === 422;

        // Backward compatibility: if pagination params are not supported,
        // retry with the legacy endpoint signature (no query params).
        if (mayNotSupportPagination) {
            try {
                const { data } = await backendApi.get<Profile>(`/profile`);
                return data;
            } catch (fallbackError) {
                console.log(fallbackError);
            }
        }

        console.log(error);
        throw "Cannot load customer data";
    }
};
