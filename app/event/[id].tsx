import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import { useState, useEffect } from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useProduct } from "@/presentation/hooks/useProduct";

const DetailScreen = () => {
  const { id } = useLocalSearchParams();
  const { productQuery } = useProduct(`${id}`);

  const [showModal, setShowModal] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    if (productQuery.data?.images?.[0]?.src) {
      setImageUri(productQuery.data.images[0].src);
    }
  }, [productQuery.data]);

  const handleImagePress = () => {
    setShowModal(true);
  };

  const handleDownload = () => {
    // TODO: Implement download functionality here
  };

  if (productQuery.isLoading) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size={30} />
        </View>
    );
  }

  if (!productQuery.data) {
    return <Redirect href="/(tabs)/home" />;
  }

  const product = productQuery.data;

  return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <ScrollView>
          <View className="relative">
            <TouchableOpacity onPress={handleImagePress}>
              <Image
                  source={{ uri: product?.images?.[0]?.src ?? "" }}
                  style={{
                    width: "100%",
                    height: 300,
                    resizeMode: "cover",
                  }}
              />
            </TouchableOpacity>
            <View className="absolute top-4 left-4 bg-purple-500 px-3 py-1 rounded-md">
              <Text className="text-white font-medium">{product.name}</Text>
            </View>
          </View>
          <View className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-2xl font-bold">
                {product.name}
              </Text>
              <TouchableOpacity className="bg-gray-800 rounded-lg p-2">
                <Feather name="share" size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between mt-4">
              <Text className="text-gray-400 font-medium">${product.price}</Text>
              <Text className="text-gray-400 font-medium">Nov 4-6</Text>
              <Text className="text-gray-400 font-medium">Manahan</Text>
            </View>
            <View className="mt-8">
              <Text className="text-gray-400 mt-8">{product.description}</Text>
            </View>
          </View>
        </ScrollView>
        <Modal visible={showModal} transparent>
          <View style={styles.modalContainer}>
            <TouchableOpacity
                style={styles.modalContent}
                onPress={() => setShowModal(false)}
            >
              <Image source={{ uri: imageUri }} style={styles.modalImage} />
              <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleDownload}
              >
                <Feather name="download" size={24} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>
        <TouchableOpacity className="bg-purple-500 rounded-lg py-4 mt-8 justify-center items-center">
          <Text className="text-white font-bold text-lg">Comprar Voleto</Text>
        </TouchableOpacity>
      </SafeAreaView>
  );
};

export default DetailScreen;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "black",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  downloadButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    borderRadius: 8,
  },
});
