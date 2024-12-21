import { backendApi } from "../../api/wordpress-api";
import { WordPressAuthResponse, User } from "../../interfaces/auth";

const returnUserToken = (
  data: WordPressAuthResponse,
): {
  user: User;
  token: string;
} => {
  const user: User = {
    username: data.username,
  };

  return {
    user,
    token: data.access_token,
  };
};

export const authLogin = async (username: string, password: string) => {
  try {
    const { data } = await backendApi.post<WordPressAuthResponse>(
      "/auth/login",
      {
        username,
        password,
      },
    );

    return returnUserToken(data);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const authCheckStatus = async () => {
  try {
    console.log("Enviando petición de validación..."); // Debug
    const { data } = await backendApi.post<WordPressAuthResponse>(
      "/auth/validate-token",
    );
    console.log("Respuesta del servidor:", data); // Debug
    return returnUserToken(data);
  } catch (error) {
    console.log("Error en authCheckStatus:", error); // Debug
    return null;
  }
};
