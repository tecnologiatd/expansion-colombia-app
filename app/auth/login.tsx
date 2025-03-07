import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import React, { useCallback, useRef, useEffect } from "react";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Link, router, useFocusEffect } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
import { ThemedText } from "@/presentation/theme/components/ThemedText";
import ExpansionHeader from "@/presentation/components/ExpansionHeader";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native";

interface LoginFormData {
  email: string;
  password: string;
}

const Login = () => {
  const { login, error, clearError } = useAuthStore();
  const [isPosting, setIsPosting] = React.useState(false);

  // Referencias para navegar entre campos del formulario
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
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Efecto para mostrar errores del store
  useEffect(() => {
    if (error) {
      setIsPosting(false);
    }
  }, [error]);

  const onLogin = useCallback(
    async (data: LoginFormData) => {
      const { email, password } = data;

      if (email.length === 0 || password.length === 0) {
        return;
      }

      // Ocultar el teclado al enviar el formulario
      Keyboard.dismiss();

      setIsPosting(true);
      try {
        const wasSuccessful = await login(email, password);
        if (wasSuccessful) {
          router.replace("/(tabs)/home");
          return;
        }

        // Si llegamos aquí, login retornó false
        // El mensaje de error debería estar en el estado global
      } catch (error) {
        // El error se manejará a través del estado global
      } finally {
        setIsPosting(false);
      }
    },
    [login, error],
  );

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
                <CustomButton
                  title="Ver eventos"
                  className="bg-primary dark:bg-white"
                  onPress={() => router.replace("/(tabs)/home")}
                />
                <View className="items-center mb-10">
                  <ExpansionHeader />
                  <ThemedText className="text-3xl font-bold mt-4">
                    Bienvenido de nuevo
                  </ThemedText>
                  <ThemedText className="text-lg text-gray-500 mt-2">
                    Inicia sesión para continuar
                  </ThemedText>
                </View>

                {/* Mensaje de error global */}
                {error && (
                  <View className="bg-red-500/20 p-4 rounded-lg mb-4">
                    <Text className="text-red-500 text-center">{error}</Text>
                  </View>
                )}

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
                      returnKeyType="next"
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
                    <FormField
                      title="Contraseña"
                      placeholder="Ingresa tu contraseña"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry
                      returnKeyType="done"
                      ref={passwordInputRef}
                      onSubmitEditing={handleSubmit(onLogin)}
                    />
                  )}
                />
              </View>

              <View>
                <CustomButton
                  title={isPosting ? "Iniciando sesión..." : "Iniciar sesión"}
                  className="mt-5"
                  onPress={handleSubmit(onLogin)}
                  disabled={isPosting}
                />
                {isPosting && (
                  <ActivityIndicator
                    size="small"
                    color="#7B3DFF"
                    style={{ marginTop: 10 }}
                  />
                )}
                <View className="justify-center pt-5 flex-row gap-5">
                  <ThemedText className="text-center mt-4">
                    ¿No tienes una cuenta?{" "}
                    <Link
                      className="text-lg text-purple-500"
                      href="/auth/register"
                    >
                      Registrate
                    </Link>
                  </ThemedText>
                </View>

                {/* Agregamos un botón para cerrar el teclado, especialmente útil en iOS */}
                {Platform.OS === "ios" && (
                  <TouchableWithoutFeedback onPress={dismissKeyboard}>
                    <View className="items-center mt-6 mb-2">
                      <View className="bg-gray-700 px-4 py-2 rounded-full">
                        <Ionicons name="chevron-down" size={24} color="white" />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                )}

                <View className="px-8 py-2" />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default Login;
