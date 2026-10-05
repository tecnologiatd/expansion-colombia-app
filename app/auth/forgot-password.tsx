import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
import ExpansionHeader from "@/presentation/components/ExpansionHeader";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { useNativePasswordReset } from "@/presentation/hooks/useNativePasswordReset";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Usar el hook simplificado
  const { resetPasswordMutation } = useNativePasswordReset();

  const handleResetPassword = async () => {
    // Validar formato de email
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return;
    }

    // Ocultar teclado
    Keyboard.dismiss();

    try {
      const response = await resetPasswordMutation.mutateAsync(email);

      // Mostrar mensaje de éxito y limpiar campo
      setSuccessMessage(response.message);
      setEmail("");
    } catch (error) {
      console.error("Error al procesar solicitud:", error);

      // Por seguridad, mostrar mensaje genérico incluso en caso de error
      Alert.alert(
        "Solicitud enviada",
        "Si tu correo existe, recibirás instrucciones para restablecer tu contraseña.",
      );
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
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View
              className="w-full flex-1 justify-between px-6 self-center"
              style={{
                maxWidth: 480,
                paddingTop: insets.top,
                paddingBottom: Math.max(insets.bottom + 16, 32),
              }}
            >
              <View className="flex-1 justify-center py-8">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="absolute top-4 left-4 z-10"
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="items-center mb-6">
                  <ExpansionHeader />
                  <Text
                    className="text-white text-2xl font-bold mt-6 text-center"
                    maxFontSizeMultiplier={1.3}
                  >
                    Recupera tu contraseña
                  </Text>
                  <Text className="text-base text-muted mt-1 text-center">
                    Ingresa tu correo electrónico y te enviaremos un enlace para
                    restablecerla
                  </Text>
                </View>

                {/* Mensaje de éxito */}
                {successMessage && (
                  <View className="bg-green-500/20 p-4 rounded-xl mb-4">
                    <Text className="text-green-500 text-center">
                      {successMessage}
                    </Text>
                  </View>
                )}

                <FormField
                  title="Correo electrónico"
                  placeholder="tucorreo@ejemplo.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
              </View>

              <View>
                <CustomButton
                  title={
                    resetPasswordMutation.isPending
                      ? "Enviando..."
                      : "Enviar enlace"
                  }
                  className="mt-5"
                  onPress={handleResetPassword}
                  loading={resetPasswordMutation.isPending}
                />

                <View className="justify-center pt-2 flex-row">
                  <Text className="text-center mt-4 text-muted">
                    ¿Recordaste tu contraseña?{" "}
                    <Link
                      className="text-purple-400 font-semibold"
                      href="/auth/login"
                    >
                      Iniciar sesión
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

export default ForgotPasswordScreen;
