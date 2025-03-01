import {
  View,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import React, { useState, useRef } from "react";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Link, router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
import { ThemedText } from "@/presentation/theme/components/ThemedText";
import ExpansionHeader from "@/presentation/components/ExpansionHeader";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useForm, Controller } from "react-hook-form";
import PasswordValidation from "@/presentation/auth/components/PasswordValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import {
  RegisterFormData,
  registerSchema,
} from "@/core/validations/register-validations";

const Register = () => {
  const { register } = useAuthStore();
  const [isPosting, setIsPosting] = useState(false);

  // Referencias para navegar entre campos del formulario
  const confirmEmailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      confirmEmail: "",
      password: "",
    },
  });

  const password = watch("password");

  const onRegister = async (data: RegisterFormData) => {
    const { email, password } = data;

    // Ocultar el teclado al enviar el formulario
    Keyboard.dismiss();

    setIsPosting(true);

    try {
      // Usar el email como username
      const wasSuccessful = await register(
        email,
        email.toLowerCase(),
        password,
      );

      if (wasSuccessful) {
        router.replace("/(tabs)/home");
        return;
      }

      Alert.alert(
        "Error",
        "No se pudo completar el registro. Por favor verifica tus datos e intenta de nuevo.",
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Ocurrió un error durante el registro. Por favor intenta de nuevo.",
      );
    } finally {
      setIsPosting(false);
    }
  };

  // Función para ocultar el teclado al tocar fuera de los inputs
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ThemedView className="bg-primary h-full flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
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
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      title="Correo electrónico"
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      value={value}
                      onChangeText={onChange}
                      errorMessage={errors.email?.message}
                      returnKeyType="next"
                      onSubmitEditing={() =>
                        confirmEmailInputRef.current?.focus()
                      }
                      autoCapitalize="none"
                      blurOnSubmit={false}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmEmail"
                  render={({ field: { onChange, value } }) => (
                    <FormField
                      title="Confirmar correo electrónico"
                      placeholder="correo@ejemplo.com"
                      keyboardType="email-address"
                      value={value}
                      onChangeText={onChange}
                      errorMessage={errors.confirmEmail?.message}
                      returnKeyType="next"
                      ref={confirmEmailInputRef}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      autoCapitalize="none"
                      blurOnSubmit={false}
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
                        returnKeyType="done"
                        ref={passwordInputRef}
                        onSubmitEditing={handleSubmit(onRegister)}
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
                    <Link
                      className="text-lg text-purple-500"
                      href="/auth/login"
                    >
                      Inicia sesión
                    </Link>
                  </ThemedText>
                </View>

                {/* Botón para cerrar el teclado en iOS */}
                {Platform.OS === "ios" && (
                  <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <View className="items-center mt-6 mb-2">
                      <View className="bg-gray-700 px-4 py-2 rounded-full">
                        <Ionicons name="chevron-down" size={24} color="white" />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                )}
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default Register;
