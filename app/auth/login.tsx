import { Alert, ScrollView, View } from "react-native";
import React, { useState } from "react";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Link, router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
import { ThemedText } from "@/presentation/theme/components/ThemedText";
import ExpansionHeader from "@/presentation/components/ExpansionHeader";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";

const login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const { login } = useAuthStore();

  const [isPosting, setIsPosting] = useState(false);

  const onLogin = async () => {
    const { email, password } = form;

    console.log({ email, password });

    if (email.length === 0 || password.length === 0) {
      return;
    }

    setIsPosting(true);
    const wasSuccessful = await login(email, password);
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
            <CustomButton
              title="Ver eventos"
              className="bg-primary dark:bg-white"
              onPress={() => router.replace("/(tabs)/home")}
            ></CustomButton>
            <View className="items-center mb-10">
              <ExpansionHeader />
              <ThemedText className="text-3xl font-bold mt-4">
                Bienvenido de nuevo
              </ThemedText>
              <ThemedText className="text-lg text-gray-500 mt-2">
                Inicia sesión para continuar
              </ThemedText>
            </View>
            <FormField
              title="Correo"
              placeholder="usuario@expansionm.co"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(e) => setForm({ ...form, email: e })}
            />
            <FormField
              title="Contraseña"
              placeholder="Crea una contraseña"
              value={form.password}
              onChangeText={(e) => setForm({ ...form, password: e })}
              secureTextEntry
            />
          </View>
          <View>
            <CustomButton
              title="Iniciar sesión"
              className="mt-5"
              onPress={onLogin}
              disabled={isPosting}
            />
            <View className="justify-center pt-5 flex-row gap-5">
              <ThemedText className="text-center mt-4">
                ¿No tienes una cuenta?{" "}
                <Link className="text-lg text-purple-500" href="/auth/register">
                  Registrate
                </Link>
              </ThemedText>
            </View>
            <View className="px-8 py-2"></View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default login;
