import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useCustomer } from "@/presentation/hooks/useCustomer";
import { useUpdateCustomer } from "@/presentation/hooks/useUpdateCustomer";
import FormField from "@/presentation/components/FormField";
import CustomButton from "@/presentation/components/CustomButton";
import { BillingAddress } from "@/core/interfaces/customer.interface";
import { Ionicons } from "@expo/vector-icons";

export default function BillingScreen() {
  const { costumerQuery } = useCustomer();
  const { updateCustomerMutation } = useUpdateCustomer();
  const scrollViewRef = useRef<ScrollView>(null);

  const [billingData, setBillingData] = useState<BillingAddress>({
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    postcode: "", // Mantenemos en el estado, pero eliminado de la UI
    country: "CO",
    state: "",
    email: "",
    phone: "",
  });

  // Refs para facilitar la navegación por campos
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);

  useEffect(() => {
    if (costumerQuery.data) {
      setBillingData((prev) => ({
        ...prev,
        ...costumerQuery.data.billing,
        email: costumerQuery.data.email || prev.email,
      }));
    }
  }, [costumerQuery.data]);

  const handleContinue = async () => {
    const requiredFields = [
      "first_name",
      "last_name",
      "address_1",
      "city",
      "state",
      "email",
      "phone",
    ];
    // Nota: 'postcode' ya no es requerido

    const missingFields = requiredFields.filter(
      (field) => !billingData[field] || billingData[field].trim() === "",
    );

    if (missingFields.length > 0) {
      Alert.alert(
        "Faltan datos",
        "Por favor complete todos los campos requeridos",
      );
      return;
    }

    try {
      // Configuramos un código postal por defecto para Colombia
      const dataToSubmit = {
        ...billingData,
      };

      await updateCustomerMutation.mutateAsync({
        billing: dataToSubmit,
      });

      router.push({
        pathname: "/checkout/payment",
        params: { billingData: JSON.stringify(dataToSubmit) },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo actualizar la información de facturación",
      );
    }
  };

  // Función para cerrar el teclado cuando se toca fuera de los inputs
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 bg-gray-900"
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <View className="p-6 bg-gray-800 rounded-b-3xl shadow-lg mb-6">
              <Text className="text-white text-2xl font-bold mb-2">
                Información de Facturación
              </Text>
              <Text className="text-gray-400">
                Complete los detalles para continuar con su compra
              </Text>
            </View>

            <View className="px-6">
              {/* Personal Information Section */}
              <View className="mb-8">
                <View className="flex-row items-center mb-4">
                  <Ionicons
                    name="person-circle-outline"
                    size={24}
                    color="#7B3DFF"
                  />
                  <Text className="text-white text-lg font-bold ml-2">
                    Información Personal
                  </Text>
                </View>
                <FormField
                  title="Nombres"
                  value={billingData.first_name}
                  onChangeText={(text) =>
                    setBillingData((prev) => ({ ...prev, first_name: text }))
                  }
                  placeholder="Ingrese sus nombres"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <FormField
                  inputRef={lastNameRef}
                  title="Apellidos"
                  value={billingData.last_name}
                  onChangeText={(text) =>
                    setBillingData((prev) => ({ ...prev, last_name: text }))
                  }
                  placeholder="Ingrese sus apellidos"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Contact Information Section */}
              <View className="mb-8">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="call-outline" size={24} color="#7B3DFF" />
                  <Text className="text-white text-lg font-bold ml-2">
                    Información de Contacto
                  </Text>
                </View>
                <FormField
                  inputRef={emailRef}
                  title="Correo electrónico"
                  value={billingData.email}
                  onChangeText={(text) =>
                    setBillingData((prev) => ({ ...prev, email: text }))
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="correo@ejemplo.com"
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <FormField
                  inputRef={phoneRef}
                  title="Teléfono"
                  value={billingData.phone}
                  onChangeText={(text) =>
                    setBillingData((prev) => ({ ...prev, phone: text }))
                  }
                  keyboardType="phone-pad"
                  placeholder="300 123 4567"
                  returnKeyType="next"
                  onSubmitEditing={() => addressRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Address Information Section */}
              <View className="mb-8">
                <View className="flex-row items-center mb-4">
                  <Ionicons name="location-outline" size={24} color="#7B3DFF" />
                  <Text className="text-white text-lg font-bold ml-2">
                    Dirección de Facturación
                  </Text>
                </View>
                <FormField
                  inputRef={addressRef}
                  title="Dirección"
                  value={billingData.address_1}
                  onChangeText={(text) =>
                    setBillingData((prev) => ({ ...prev, address_1: text }))
                  }
                  placeholder="Calle / Carrera / Avenida"
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <FormField
                  inputRef={cityRef}
                  title="Ciudad"
                  value={billingData.city}
                  onChangeText={(text) =>
                    setBillingData((prev) => ({ ...prev, city: text }))
                  }
                  placeholder="Ciudad"
                  returnKeyType="next"
                  onSubmitEditing={() => stateRef.current?.focus()}
                  blurOnSubmit={false}
                />
                <FormField
                  inputRef={stateRef}
                  title="Departamento"
                  value={billingData.state}
                  onChangeText={(text) =>
                    setBillingData((prev) => ({ ...prev, state: text }))
                  }
                  placeholder="Departamento"
                  returnKeyType="done"
                  onSubmitEditing={dismissKeyboard}
                />
                {/* El campo de código postal ha sido eliminado */}
              </View>

              {/* Submit Button */}
              <View className="mb-16">
                <CustomButton
                  title={
                    updateCustomerMutation.isPending
                      ? "Procesando..."
                      : "Continuar al pago"
                  }
                  onPress={handleContinue}
                  className="bg-purple-500"
                  disabled={updateCustomerMutation.isPending}
                />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}
