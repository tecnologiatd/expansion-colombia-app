import { View, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Link, router } from "expo-router";
import { ThemedView } from "@/presentation/theme/components/ThemedView";
import { ThemedText } from "@/presentation/theme/components/ThemedText";
import ExpansionHeader from "@/presentation/components/ExpansionHeader";

const Register = () => {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
  });

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
            <FormField
              title="Nombre"
              placeholder="Tu nombre"
              value={form.name}
              onChangeText={(e) => setForm({ ...form, name: e })}
            />
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
              title="Registrarse"
              className="mt-5"
              onPress={() => router.push("/(tabs)/home")} // Ajusta esta ruta según tu lógica
            />
            <View className="justify-center pt-5 flex-row gap-5">
              <ThemedText className="text-center mt-4">
                ¿Ya tienes una cuenta?{" "}
                <Link className="text-lg text-yellow-500" href="/auth/login">
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
