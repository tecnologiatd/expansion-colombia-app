import {
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
import { router, useLocalSearchParams } from "expo-router";
import RenderHtml from "react-native-render-html";
// import Clipboard from "@react-native-clipboard/clipboard";
import { useProduct } from "@/presentation/hooks/useProduct";
import { useSiteStatus } from "@/presentation/hooks/useSiteStatus";
import { useCartStore } from "@/core/stores/cart-store";
import MaintenanceBanner from "@/presentation/components/MaintenanceBanner";
import { Button } from "@/presentation/components/ui/Button";
import { FadeInView } from "@/presentation/components/ui/FadeInView";
import { StateView } from "@/presentation/components/ui/StateView";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";
import { formatCOP, plainText } from "@/helpers/format";

import { CachedDataNotice } from "@/presentation/components/CachedDataNotice";
import { useConnectivityStore } from "@/core/offline/connectivity";

const eventBaseStyle = { color: Theme.text, fontSize: 16, lineHeight: 24 };
const eventTagsStyles = {
  p: { color: Theme.text },
  a: { color: "#C084FC" },
};

const DetailScreen = () => {
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams();
  const { productQuery } = useProduct(`${id}`);
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const { isMaintenance, maintenanceMessage } = useSiteStatus();

  const [showModal, setShowModal] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function onRefresh() {
    setIsRefreshing(true);
    await productQuery.refetch();
    setIsRefreshing(false);
  }

  useEffect(() => {
    setImageUri(productQuery.data?.images?.[0]?.src?.trim() || null);
  }, [productQuery.data]);

  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    // En mantenimiento el evento se puede ver, pero no comprar
    if (isMaintenance) {
      Alert.alert(
        "Mantenimiento",
        maintenanceMessage ??
          "Las compras están pausadas por mantenimiento. Intenta de nuevo más tarde.",
      );
      return;
    }
    if (productQuery.data) {
      const productToAdd = {
        id: productQuery.data.id, // Use actual product ID
        name: productQuery.data.name,
        price: Number(productQuery.data.price), // Ensure price is a number
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

  if (productQuery.isLoading && !productQuery.data) {
    return <StateView loading />;
  }

  if (!productQuery.data) {
    return (
      <StateView
        icon="cloud-offline-outline"
        title="No se pudo cargar el evento"
        message="Revisa tu conexión e intenta de nuevo."
        actionLabel="Reintentar"
        onAction={onRefresh}
      />
    );
  }

  const product = productQuery.data;

  const heroImageUri = product?.images?.[0]?.src?.trim();
  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH) - 32;

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["left", "right", "bottom"]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Theme.accent}
            colors={[Theme.accent]}
          />
        }
      >
        <View
          className="w-full self-center"
          style={{ maxWidth: CONTENT_MAX_WIDTH }}
        >
          <CachedDataNotice
            offline={!isOnline || productQuery.isPaused}
            failed={productQuery.isError}
            dataUpdatedAt={productQuery.dataUpdatedAt || undefined}
            onRetry={() => {
              void onRefresh();
            }}
          />
          {heroImageUri ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleImagePress}
              accessibilityRole="imagebutton"
              accessibilityLabel="Ampliar imagen del evento"
            >
              <Image
                source={{ uri: heroImageUri }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.heroImage} />
          )}
          <FadeInView style={{ padding: 16 }}>
            {isMaintenance && (
              <MaintenanceBanner message={maintenanceMessage} />
            )}
            <Text
              className="text-white text-2xl font-bold"
              maxFontSizeMultiplier={1.3}
            >
              {plainText(product.name)}
            </Text>
            <View className="bg-surface border border-line rounded-2xl p-4 mt-4 flex-row items-center justify-between">
              <Text className="text-muted">Precio</Text>
              <Text className="text-white text-lg font-bold">
                {formatCOP(product.price)}
              </Text>
            </View>
            <View className="mt-6">
              <RenderHtml
                tagsStyles={eventTagsStyles}
                baseStyle={eventBaseStyle}
                contentWidth={contentWidth}
                source={{ html: product.description }}
              />
            </View>
          </FadeInView>
        </View>
      </ScrollView>
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => setShowModal(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar imagen"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.modalImage} />
            ) : null}
          </TouchableOpacity>
        </View>
      </Modal>
      <View className="border-t border-line bg-background px-4 pt-3 pb-3">
        <View
          className="w-full self-center"
          style={{ maxWidth: CONTENT_MAX_WIDTH }}
        >
          <Button
            title={
              isMaintenance ? "No disponible por mantenimiento" : "Comprar"
            }
            icon={isMaintenance ? undefined : "ticket-outline"}
            onPress={handleAddToCart}
            disabled={isMaintenance}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DetailScreen;

const styles = StyleSheet.create({
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: Theme.surfaceRaised,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
