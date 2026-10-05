import {
  FlatList,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "@/presentation/components/EventCard";
import { useProducts } from "@/presentation/hooks/useProducts";
import React from "react";
import { FadeInView } from "@/presentation/components/ui/FadeInView";
import { Skeleton } from "@/presentation/components/ui/Skeleton";
import { StateView } from "@/presentation/components/ui/StateView";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";

import { CachedDataNotice } from "@/presentation/components/CachedDataNotice";
import { useConnectivityStore } from "@/core/offline/connectivity";

const TWO_COLUMN_MIN_WIDTH = 700;
const GUTTER = 16;

export default function Tab() {
  const { productsQuery } = useProducts();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const { width } = useWindowDimensions();

  const numColumns = width >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
  const maxWidth = numColumns === 2 ? 960 : CONTENT_MAX_WIDTH;

  const onRefresh = () => {
    productsQuery.refetch();
  };

  if (productsQuery.isLoading && productsQuery.data === undefined) {
    return (
      <View
        className="flex-1 bg-background self-center w-full p-4"
        style={{ maxWidth }}
      >
        <Skeleton style={{ height: 32, width: "60%", marginTop: 16 }} />
        {[0, 1].map((key) => (
          <View key={key} className="mt-6">
            <Skeleton style={{ aspectRatio: 16 / 9, borderRadius: 16 }} />
            <Skeleton style={{ height: 18, width: "70%", marginTop: 14 }} />
            <Skeleton style={{ height: 14, width: "45%", marginTop: 10 }} />
          </View>
        ))}
      </View>
    );
  }

  if (productsQuery.data === undefined) {
    return (
      <StateView
        icon="cloud-offline-outline"
        title="No pudimos cargar los eventos"
        message="Revisa tu conexión e intenta de nuevo."
        actionLabel="Reintentar"
        onAction={onRefresh}
      />
    );
  }

  const products = productsQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <FlatList
        // numColumns no puede cambiar en caliente: se remonta la lista
        key={numColumns}
        data={products}
        numColumns={numColumns}
        keyExtractor={(item) => String(item.id)}
        style={{ alignSelf: "center", width: "100%", maxWidth }}
        contentContainerStyle={{
          paddingHorizontal: GUTTER,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        columnWrapperStyle={numColumns > 1 ? { gap: GUTTER } : undefined}
        refreshControl={
          <RefreshControl
            refreshing={productsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={Theme.accent}
            colors={[Theme.accent]}
          />
        }
        ListHeaderComponent={
          <View className="mt-6 mb-5">
            <CachedDataNotice
              offline={!isOnline || productsQuery.isPaused}
              failed={productsQuery.isError}
              dataUpdatedAt={productsQuery.dataUpdatedAt || undefined}
              onRetry={onRefresh}
            />
            <Text
              className="text-3xl font-bold text-white"
              maxFontSizeMultiplier={1.3}
            >
              Eventos en <Text className="text-secondary">Colombia</Text>
            </Text>
            <Text className="text-muted mt-1">
              Elige tu próximo evento y compra tus entradas
            </Text>
          </View>
        }
        ListEmptyComponent={
          <StateView
            icon="calendar-outline"
            title="No hay eventos disponibles"
            message="Desliza hacia abajo para actualizar."
          />
        }
        renderItem={({ item, index }) => (
          <FadeInView
            index={index}
            style={{
              flex: numColumns > 1 ? 1 : undefined,
              marginBottom: GUTTER,
            }}
          >
            <EventCard product={item} />
          </FadeInView>
        )}
      />
    </SafeAreaView>
  );
}
