import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Ionicons } from "@expo/vector-icons";
import { useUpdateCustomer } from "@/presentation/hooks/useUpdateCustomer";

const EditProfileModal = ({ visible, onClose, userData, onSave }) => {
  const { updateCustomerMutation } = useUpdateCustomer();
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [editedData, setEditedData] = useState({
    email: "",
    billing: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
    },
  });

  // Referencias para navegación entre campos
  const lastNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  // Animación para el botón de cerrar teclado
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Detectar cuando el teclado aparece/desaparece
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
    );

    // Limpiar listeners cuando el componente se desmonte
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fadeAnim]);

  useEffect(() => {
    if (userData) {
      setEditedData({
        email: userData.email || "",
        billing: {
          first_name: userData.billing?.first_name || "",
          last_name: userData.billing?.last_name || "",
          phone: userData.billing?.phone || "",
          email: userData.billing?.email || userData.email || "",
        },
      });
    }
  }, [userData]);

  if (!userData) {
    return null;
  }

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const hasNames = userData.billing?.first_name && userData.billing?.last_name;

  const handleSave = async () => {
    try {
      // Cerrar el teclado antes de procesar
      Keyboard.dismiss();

      setIsSaving(true);

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedData.email)) {
        Alert.alert("Error", "Por favor ingrese un correo electrónico válido");
        setIsSaving(false);
        return;
      }

      // Preparar datos para actualización
      const updateData = {
        email: editedData.email,
        billing: {
          ...userData.billing,
          ...editedData.billing,
          email: editedData.email,
          country: "CO",
        },
      };

      await updateCustomerMutation.mutateAsync(updateData);
      onSave();
    } catch (error) {
      console.error("Error de actualización:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar el perfil. Por favor intente de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            className="flex-1 justify-end"
          >
            <View className="bg-gray-800 rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white text-xl font-bold">
                  Editar Perfil
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="space-y-4"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View>
                  <Text className="text-gray-400 mb-2">Nombres</Text>
                  <TextInput
                    className={`bg-gray-700 p-4 rounded-lg text-white ${hasNames ? "opacity-50" : ""}`}
                    value={editedData.billing.first_name}
                    onChangeText={(text) =>
                      !hasNames &&
                      setEditedData({
                        ...editedData,
                        billing: { ...editedData.billing, first_name: text },
                      })
                    }
                    editable={!hasNames}
                    placeholderTextColor="#666"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View>
                  <Text className="text-gray-400 mb-2">Apellidos</Text>
                  <TextInput
                    ref={lastNameInputRef}
                    className={`bg-gray-700 p-4 rounded-lg text-white ${hasNames ? "opacity-50" : ""}`}
                    value={editedData.billing.last_name}
                    onChangeText={(text) =>
                      !hasNames &&
                      setEditedData({
                        ...editedData,
                        billing: { ...editedData.billing, last_name: text },
                      })
                    }
                    editable={!hasNames}
                    placeholderTextColor="#666"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View>
                  <Text className="text-gray-400 mb-2">Correo electrónico</Text>
                  <TextInput
                    ref={emailInputRef}
                    className="bg-gray-700 p-4 rounded-lg text-white"
                    value={editedData.email}
                    onChangeText={(text) =>
                      setEditedData({ ...editedData, email: text })
                    }
                    keyboardType="email-address"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneInputRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View>
                  <Text className="text-gray-400 mb-2">Teléfono</Text>
                  <TextInput
                    ref={phoneInputRef}
                    className="bg-gray-700 p-4 rounded-lg text-white"
                    value={editedData.billing.phone}
                    onChangeText={(text) =>
                      setEditedData({
                        ...editedData,
                        billing: { ...editedData.billing, phone: text },
                      })
                    }
                    keyboardType="phone-pad"
                    placeholderTextColor="#666"
                    returnKeyType="done"
                    onSubmitEditing={dismissKeyboard}
                  />
                </View>

                <TouchableOpacity
                  className={`bg-purple-500 p-4 rounded-lg mt-4 ${isSaving ? "opacity-50" : ""}`}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white text-center font-bold">
                      Guardar cambios
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Espaciado para evitar que el botón de enviar quede oculto por el teclado */}
                {Platform.OS === "ios" && <View className="h-32" />}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>

          {/* Botón flotante para cerrar el teclado en iOS */}
          {Platform.OS === "ios" && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                position: "absolute",
                bottom: keyboardVisible ? 20 : -50,
                alignSelf: "center",
              }}
            >
              <TouchableOpacity
                className="bg-gray-700 p-3 rounded-full shadow-lg"
                onPress={dismissKeyboard}
              >
                <Ionicons name="chevron-down" size={24} color="white" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default EditProfileModal;
