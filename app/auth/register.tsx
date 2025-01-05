import { View, ScrollView, Alert } from "react-native";
import React from "react";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Link, router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
import { ThemedText } from "@/presentation/theme/components/ThemedText";
import ExpansionHeader from "@/presentation/components/ExpansionHeader";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema using Zod
const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Introduce un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const Register = () => {
  const { register } = useAuthStore();
  const [isPosting, setIsPosting] = React.useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onRegister = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    const { name, email, password } = data;

    setIsPosting(true);
    const wasSuccessful = await register(name, email, password);
    setIsPosting(false);

    if (wasSuccessful) {
      router.replace("/(tabs)/home");
      return;
    }

    Alert.alert("Error", "Usuario o contraseña no son correctos");
  };

  return (
    <ThemedView className="bg-primary h-full flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full flex-1 justify-between px-6 pb-8">
          <View className="flex-1 justify-center px-6 py-8">
            <View className="items-center mb-10">
              <ExpansionHeader />
              <ThemedText className="text-3xl font-bold mt-4">
                Crear una cuenta
              </ThemedText>
              <ThemedText className="text-lg text-gray-500 mt-2">
                Únete para empezar
              </ThemedText>
            </View>
            {/* Name Field */}
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <FormField
                  title="Nombre"
                  placeholder="Tu nombre"
                  value={value}
                  onChangeText={onChange}
                  errorMessage={errors.name?.message}
                />
              )}
            />

            {/* Email Field */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormField
                  title="Correo"
                  placeholder="usuario@expansionm.co"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  errorMessage={errors.email?.message}
                />
              )}
            />

            {/* Password Field */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <FormField
                  title="Contraseña"
                  placeholder="Crea una contraseña"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  errorMessage={errors.password?.message}
                />
              )}
            />
          </View>
          <View>
            <CustomButton
              title={isPosting ? "Registrando..." : "Registrarse"}
              className="mt-5"
              onPress={handleSubmit(onRegister)} // Use handleSubmit from react-hook-form
              disabled={isPosting}
            />
            <View className="justify-center pt-5 flex-row gap-5">
              <ThemedText className="text-center mt-4">
                ¿Ya tienes una cuenta?{" "}
                <Link className="text-lg text-purple-500" href="/auth/login">
                  Inicia sesión
                </Link>
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Register;
