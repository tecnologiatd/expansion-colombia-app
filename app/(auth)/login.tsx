import { View, Text, ScrollView } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { Link, router } from "expo-router";

const login = () => {
  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  return (
    <SafeAreaView className="bg-primary h-full flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full flex-1 justify-between px-4 my-6">
          <View>
            <Text className="font-fortuna text-center text-4xl mt-10 text-white">
              EXPANSION
            </Text>
            <Text className="font-design-systemc text-center text-2xl text-white">
              COLOMBIA
            </Text>
            <Text className="text-2xl mt-16 text-white">Inicias sesión</Text>
            <FormField
              title="Correo"
              placeholder="usuario@expansionm.co"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(e) => setForm({ ...form, email: e })}
            />
            <FormField
              title="Contraseña"
              value={form.password}
              onChangeText={(e) => setForm({ ...form, password: e })}
              secureTextEntry
            />
          </View>
          <View id="hola">
            <CustomButton
              title="Iniciar sesión"
              className="mt-5"
              onPress={() => router.push("/(tabs)/home")}
            />
            <View className="justify-center pt-5 flex-row gap-5">
              <Text className="text-white text-center mt-4">
                ¿No tienes una cuenta?{" "}
                <Link
                  className="text-lg text-yellow-500"
                  href="/(auth)/register"
                >
                  Registrate
                </Link>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default login;
