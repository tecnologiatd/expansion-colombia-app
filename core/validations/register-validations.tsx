import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Ingresa un correo electrónico válido")
      .min(1, "El correo electrónico es obligatorio"),
    confirmEmail: z.string().min(1, "Confirma tu correo electrónico"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un caracter especial"),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Los correos electrónicos no coinciden",
    path: ["confirmEmail"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
