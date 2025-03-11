import axios from "axios";

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Solicita restablecimiento de contraseña usando el formulario nativo de WordPress
 * Esta función se comunica directamente con WordPress sin pasar por el backend NestJS
 */
export const nativePasswordReset = async (
  email: string,
): Promise<ResetPasswordResponse> => {
  try {
    // URL base del sitio WordPress (ajustar según tu configuración)
    const wpURL = "https://expansioncolombia.com";

    // Crear objeto FormData (necesario para enviar como formulario)
    const formData = new FormData();
    formData.append("user_login", email);

    // Enviar solicitud al endpoint nativo de WordPress para recuperación de contraseña
    await axios.post(`${wpURL}/wp-login.php?action=lostpassword`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Por razones de seguridad, devolvemos siempre un mensaje genérico
    // independientemente de si el correo existe o no
    return {
      success: true,
      message:
        "Si tu correo existe, recibirás instrucciones para restablecer tu contraseña.",
    };
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);

    // Incluso si hay un error, no queremos revelarlo al usuario por seguridad
    return {
      success: true,
      message:
        "Si tu correo existe, recibirás instrucciones para restablecer tu contraseña.",
    };
  }
};
