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
    throw error; // Propagar el error para un mejor manejo
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
    let errorCode = "";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    if (error.response?.data?.code) {
      errorCode = error.response.data.code;
    }

    // Mejorar los mensajes de error para el usuario final
    if (errorCode === "existing_user_login") {
      errorMessage = "Este nombre de usuario ya está en uso";
    } else if (errorCode === "existing_user_email") {
      errorMessage = "Este correo electrónico ya está registrado";
    }

    // Formato específico para errores de WordPress
    return {
      success: false,
      data: null,
      error: {
        code: errorCode || "register_error",
        message: errorMessage,
      },
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
    throw error; // Propagar el error para un mejor manejo
  }
};
