import React, { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useUpdateCustomer } from "@/presentation/hooks/useUpdateCustomer";

const EditProfileModal = ({ visible, onClose, userData, onSave }) => {
  const { updateCustomerMutation } = useUpdateCustomer();
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({
    email: "",
    billing: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
    },
  });

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

  const hasNames = userData.billing?.first_name && userData.billing?.last_name;

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedData.email)) {
        Alert.alert("Error", "Por favor ingrese un correo electrónico válido");
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
      <View className="flex-1 justify-end">
        <View className="bg-gray-800 rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-xl font-bold">Editar Perfil</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
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
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-2">Apellidos</Text>
              <TextInput
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
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-2">Correo electrónico</Text>
              <TextInput
                className="bg-gray-700 p-4 rounded-lg text-white"
                value={editedData.email}
                onChangeText={(text) =>
                  setEditedData({ ...editedData, email: text })
                }
                keyboardType="email-address"
                placeholderTextColor="#666"
              />
            </View>

            <View>
              <Text className="text-gray-400 mb-2">Teléfono</Text>
              <TextInput
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
              />
            </View>

            <TouchableOpacity
              className={`bg-purple-500 p-4 rounded-lg mt-4 ${isSaving ? "opacity-50" : ""}`}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text className="text-white text-center font-bold">
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;
