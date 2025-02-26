import { backendApi } from "../../api/wordpress-api";
import { WordPressAuthResponse, User } from "../../interfaces/auth";
import { DeviceService } from "@/core/auth/actions/register-device.action";

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

    await DeviceService.registerDevice(username);
    console.log("token", data);
    return returnUserToken(data);
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const authRegister = async (
  username: string,
  email: string,
  password: string,
) => {
  try {
    const { data } = await backendApi.post<WordPressAuthResponse>(
      "/auth/register",
      {
        username,
        email,
        password,
      },
    );

    await DeviceService.registerDevice(username);

    return {
      success: true,
      data: returnUserToken(data),
      error: null,
    };
  } catch (error) {
    console.log("Error de registro:", error);

    // Extraer mensaje de error
    let errorMessage = "Error al registrar el usuario";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    // Formato específico para errores de WordPress
    if (error.response?.data?.code) {
      return {
        success: false,
        data: null,
        error: {
          code: error.response.data.code,
          message: errorMessage,
        },
      };
    }

    return {
      success: false,
      data: null,
      error: { message: errorMessage },
    };
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
