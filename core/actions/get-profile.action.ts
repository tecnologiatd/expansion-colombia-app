import { backendApi } from "@/core/api/wordpress-api";
import Profile from "@/core/interfaces/profile.interface";

export const getProfileAction = async (): Promise<Profile> => {
    try {
        const { data } = await backendApi.get<Profile>(`/profile`);

        return data;

    } catch (error) {
        console.log(error);
        throw "Cannot load customer data";
    }
};
