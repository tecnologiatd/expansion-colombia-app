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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormData,
} from "@/core/validations/register-validations";
import PasswordValidation from "@/presentation/auth/components/PasswordValidation";

const Register = () => {
  const { register } = useAuthStore();
  const [isPosting, setIsPosting] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const password = watch("password");

  const onRegister = async (data: RegisterFormData) => {
    const { name, email, password } = data;

    setIsPosting(true);
    const wasSuccessful = await register(name, email.toLowerCase(), password);
    setIsPosting(false);

    if (wasSuccessful) {
      router.replace("/(tabs)/home");
      return;
    }

    Alert.alert(
      "Error",
      "No se pudo completar el registro. Por favor verifica tus datos e intenta de nuevo.",
    );
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

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <FormField
                  title="Nombre de usuario"
                  placeholder="usuario1"
                  value={value}
                  onChangeText={onChange}
                  errorMessage={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <FormField
                  title="Correo electrónico"
                  placeholder="usuario@expansionm.co"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  errorMessage={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <>
                  <FormField
                    title="Contraseña"
                    placeholder="Crea una contraseña segura"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry
                    errorMessage={errors.password?.message}
                  />
                  <PasswordValidation password={value} />
                </>
              )}
            />
          </View>

          <View>
            <CustomButton
              title={isPosting ? "Registrando..." : "Crear cuenta"}
              className="mt-5"
              onPress={handleSubmit(onRegister)}
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
