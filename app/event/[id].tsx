import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import RenderHtml from "react-native-render-html";
// import Clipboard from "@react-native-clipboard/clipboard";
import { useProduct } from "@/presentation/hooks/useProduct";
import { useCartStore } from "@/core/stores/cart-store";

const eventTagsStyles = {
  p: { color: "white" },
};

const DetailScreen = () => {
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const { productQuery } = useProduct(`${id}`);

  const [showModal, setShowModal] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function onRefresh() {
    setIsRefreshing(true);
    await productQuery.refetch();
    setIsRefreshing(false);
  }

  useEffect(() => {
    if (productQuery.data?.images?.[0]?.src) {
      setImageUri(productQuery.data.images[0].src);
    }
  }, [productQuery.data]);

  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    if (productQuery.data) {
      const productToAdd = {
        id: productQuery.data.id, // Use actual product ID
        name: productQuery.data.name,
        price: parseFloat(productQuery.data.price), // Ensure price is a number
        imageUrl: productQuery.data.images?.[0]?.src || "", // Use first image or empty string
      };

      // Add to cart
      addToCart(productToAdd);

      // Navigate to cart screen
      router.push("/(tabs)/cart");
    }
  };

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

  const handleShare = async () => {
    if (product?.permalink) {
      // Clipboard.setString(product.permalink);
      // Optional: Show feedback to user
      Alert.alert(
        "¡Enlace copiado!",
        "El enlace ha sido copiado al portapapeles",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900" edges={["left", "right"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
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
            {/*<TouchableOpacity*/}
            {/*  className="bg-gray-800 rounded-lg p-2"*/}
            {/*  onPress={handleShare}*/}
            {/*>*/}
            {/*  <Feather name="share" size={24} color="white" />*/}
            {/*</TouchableOpacity>*/}
          </View>
          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-gray-400 font-medium">
              ${product.price.toLocaleString("es-CO")}
            </Text>
          </View>
          <View className="mt-8 ">
            <RenderHtml
              tagsStyles={eventTagsStyles}
              contentWidth={width}
              source={{ html: product.description }}
            />
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
          </TouchableOpacity>
        </View>
      </Modal>
      <TouchableOpacity
        className="bg-purple-500 rounded-lg py-4 mt-8 justify-center items-center"
        onPress={handleAddToCart}
        disabled={!productQuery.data} // Disable if product is not loaded
      >
        <Text className="text-white font-bold text-lg">
          {productQuery.isLoading ? "Cargando..." : "Comprar"}
        </Text>
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
