import { z } from "zod";

export const registerSchema = z.object({
    name: z.string()
        .min(3, "El nombre debe tener al menos 3 caracteres")
        .max(50, "El nombre no puede exceder los 50 caracteres"),
    email: z.string()
        .email("Ingresa un correo electrónico válido")
        .min(1, "El correo electrónico es obligatorio"),
    password: z.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
        .regex(/[a-z]/, "Debe contener al menos una minúscula")
        .regex(/[0-9]/, "Debe contener al menos un número")
        .regex(/[^A-Za-z0-9]/, "Debe contener al menos un caracter especial"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;