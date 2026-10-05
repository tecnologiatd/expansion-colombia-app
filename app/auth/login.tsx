import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
  Text,
} from "react-native";
import React, { useCallback, useRef, useEffect } from "react";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Button } from "@/presentation/components/ui/Button";
import { Link, router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
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
  const insets = useSafeAreaInsets();

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
                    Bienvenido de nuevo
                  </Text>
                  <Text className="text-base text-muted mt-1 text-center">
                    Inicia sesión para continuar
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
                  loading={isPosting}
                />
                <View className="justify-center pt-2 flex-row">
                  <Text className="text-center mt-4 text-muted">
                    ¿No tienes una cuenta?{" "}
                    <Link
                      className="text-purple-400 font-semibold"
                      href="/auth/register"
                    >
                      Registrate
                    </Link>
                  </Text>
                </View>
                <View className="justify-center pt-2 flex-row">
                  <Text className="text-center mt-2 text-muted">
                    ¿Olvidaste tu contraseña?{" "}
                    <Link
                      className="text-purple-400 font-semibold"
                      href="/auth/forgot-password"
                    >
                      Recuperala aquí
                    </Link>
                  </Text>
                </View>
                <Button
                  title="Ver eventos sin iniciar sesión"
                  variant="ghost"
                  onPress={() => router.replace("/(tabs)/home")}
                  containerStyle={{ marginTop: 8 }}
                />
                {/* Agregamos un botón para cerrar el teclado, especialmente útil en iOS */}
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

export default Login;
