import {
  View,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TextInput,
  Text,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Link, router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
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
  const { register, error, clearError } = useAuthStore();
  const [isPosting, setIsPosting] = useState(false);
  const insets = useSafeAreaInsets();

  // Referencias para navegar entre campos del formulario
  const confirmEmailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Limpiar errores al entrar en esta pantalla
  useFocusEffect(
    React.useCallback(() => {
      clearError();
      return () => {};
    }, [clearError]),
  );

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      confirmEmail: "",
      password: "",
    },
  });

  // Efecto para mostrar errores del store en el formulario
  useEffect(() => {
    if (error) {
      // Si hay un error específico del servidor, mostrarlo como error general
      if (
        error.toLowerCase().includes("email") ||
        error.toLowerCase().includes("correo")
      ) {
        setError("email", { message: error });
      } else if (
        error.toLowerCase().includes("username") ||
        error.toLowerCase().includes("usuario")
      ) {
        setError("email", { message: error });
      }
      // Limpiar el estado de carga
      setIsPosting(false);
    }
  }, [error, setError]);

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

      // Si llegamos aquí es porque register retornó false pero no lanzó excepción
      // El error debería estar en el estado de error
      if (!error) {
        setIsPosting(false);
      }
    } catch (error) {
      setIsPosting(false);
    }
  };

  // Función para ocultar el teclado al tocar fuera de los inputs
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ThemedView className="h-full flex-1">
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
            <View
              className="w-full flex-1 justify-between px-6 self-center"
              style={{
                maxWidth: 480,
                paddingTop: insets.top,
                paddingBottom: Math.max(insets.bottom + 16, 32),
              }}
            >
              <View className="flex-1 justify-center py-8">
                <View className="items-center mb-6">
                  <ExpansionHeader />
                  <Text
                    className="text-white text-2xl font-bold mt-6 text-center"
                    maxFontSizeMultiplier={1.3}
                  >
                    Crear una cuenta
                  </Text>
                  <Text className="text-base text-muted mt-1 text-center">
                    Únete para empezar
                  </Text>
                </View>

                {/* Mensaje de error global */}
                {error && (
                  <View className="bg-red-500/15 border border-red-500/30 p-4 rounded-xl mb-2">
                    <Text className="text-red-400 text-center">{error}</Text>
                  </View>
                )}

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
                  loading={isPosting}
                />
                <View className="justify-center pt-2 flex-row">
                  <Text className="text-center mt-4 text-muted">
                    ¿Ya tienes una cuenta?{" "}
                    <Link
                      className="text-purple-400 font-semibold"
                      href="/auth/login"
                    >
                      Inicia sesión
                    </Link>
                  </Text>
                </View>

                {/* Botón para cerrar el teclado en iOS */}
                {Platform.OS === "ios" && (
                  <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <View className="items-center mt-6 mb-2">
                      <View className="bg-surface-raised px-4 py-1.5 rounded-full">
                        <Ionicons name="chevron-down" size={20} color="white" />
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
