import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { useProducts } from "@/presentation/hooks/useProducts";
import { Ionicons } from "@expo/vector-icons";

interface ProductSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (productId: string, title: string) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const { productsQuery } = useProducts();

  const handleSelect = (id: number, name: string) => {
    onSelect(id.toString(), name);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-gray-800 rounded-t-3xl h-3/4 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">
              Seleccionar Evento
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {productsQuery.isLoading ? (
            <ActivityIndicator size="large" color="#7B3DFF" />
          ) : productsQuery.data ? (
            <FlatList
              data={productsQuery.data}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="bg-gray-700 p-4 rounded-lg mb-2 flex-row"
                  onPress={() => handleSelect(item.id, item.name)}
                >
                  {item.images && item.images[0] && (
                    <Image
                      source={{ uri: item.images[0].src }}
                      className="w-16 h-16 rounded-lg mr-3"
                    />
                  )}
                  <View className="flex-1">
                    <Text className="text-white font-bold">{item.name}</Text>
                    <Text className="text-gray-400 mt-1">
                      ${item.price.toLocaleString("es-CO")}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text className="text-white text-center">
              No hay eventos disponibles
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};
