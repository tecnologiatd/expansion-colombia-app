import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
import { ThemedText } from "@/presentation/theme/components/ThemedText";
import ExpansionHeader from "@/presentation/components/ExpansionHeader";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Ionicons } from "@expo/vector-icons";
import { useNativePasswordReset } from "@/presentation/hooks/useNativePasswordReset";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    <ThemedView className="bg-primary h-full flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="w-full flex-1 justify-between px-6 pb-8">
              <View className="flex-1 justify-center px-6 py-8">
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="absolute top-4 left-4 z-10"
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="items-center mb-10">
                  <ExpansionHeader />
                  <ThemedText className="text-3xl font-bold mt-4">
                    Recupera tu contraseña
                  </ThemedText>
                  <ThemedText className="text-lg text-gray-500 mt-2 text-center">
                    Ingresa tu correo electrónico y te enviaremos un enlace para
                    restablecerla
                  </ThemedText>
                </View>

                {/* Mensaje de éxito */}
                {successMessage && (
                  <View className="bg-green-500/20 p-4 rounded-lg mb-4">
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
                  disabled={resetPasswordMutation.isPending}
                />

                {resetPasswordMutation.isPending && (
                  <ActivityIndicator
                    size="small"
                    color="#7B3DFF"
                    style={{ marginTop: 10 }}
                  />
                )}

                <View className="justify-center pt-5 flex-row gap-5">
                  <ThemedText className="text-center mt-4">
                    ¿Recordaste tu contraseña?{" "}
                    <Link
                      className="text-lg text-purple-500"
                      href="/auth/login"
                    >
                      Iniciar sesión
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

export default ForgotPasswordScreen;
