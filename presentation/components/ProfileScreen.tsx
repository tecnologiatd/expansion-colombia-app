import React, { useState } from "react";
import { imageSource } from "@/helpers/image-source";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useProfile } from "@/presentation/hooks/useProfile";
import { router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import EditProfileModal from "./EditProfileModal";
import { LogoutButton } from "@/presentation/auth/components/LogoutIconButton";
import { CheckForUpdateButton } from "./CheckForUpdateButton";
import PurchasedEventCard from "./PurchasedEventCard";
import { AdminAccessButton } from "./AdminAccessButton";
import { OfflineBanner } from "./OfflineBanner";
import { useConnectivityStore } from "@/core/offline/connectivity";
import { StateView } from "@/presentation/components/ui/StateView";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";

export default function ProfileScreen() {
  const { profileQuery, userData, orders } = useProfile();
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const [editing, setEditing] = useState(false);
  const refresh = () => {
    void profileQuery.refetch();
  };
  const loadMore = () => {
    if (
      isOnline &&
      profileQuery.hasNextPage &&
      !profileQuery.isFetching &&
      !profileQuery.isFetchNextPageError
    ) {
      void profileQuery.fetchNextPage();
    }
  };
  if (profileQuery.isLoading && !profileQuery.isPaused)
    return <StateView loading />;
  if (!userData)
    return (
      <StateView
        icon="person-circle-outline"
        title="No se pudo cargar el perfil"
        actionLabel="Reintentar"
        onAction={refresh}
      />
    );
  const total = profileQuery.data?.pages[0]?.pagination?.totalOrders;
  return (
    <>
      <FlatList
        className="flex-1 bg-background"
        contentContainerStyle={{
          padding: 16,
          width: "100%",
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: "center",
        }}
        data={orders}
        keyExtractor={(order) => String(order.id)}
        initialNumToRender={12}
        windowSize={7}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={
              profileQuery.isRefetching && !profileQuery.isFetchingNextPage
            }
            onRefresh={refresh}
            tintColor="#7B3DFF"
          />
        }
        ListHeaderComponent={
          <>
            {(!isOnline || profileQuery.isPaused) && (
              <OfflineBanner
                dataUpdatedAt={profileQuery.dataUpdatedAt || undefined}
              />
            )}
            <View className="flex-row items-center justify-between mb-6 mt-2">
              <View className="flex-row items-center flex-1">
                {userData.avatar_url && (
                  <Image
                    source={imageSource(userData.avatar_url)}
                    className="w-16 h-16 rounded-full bg-surface-raised"
                  />
                )}
                <View className="ml-4 flex-1">
                  <Text className="text-white text-xl font-bold">
                    {userData.billing?.first_name} {userData.billing?.last_name}
                  </Text>
                  <Text className="text-gray-400">{userData.email}</Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-surface border border-line w-11 h-11 rounded-xl items-center justify-center"
                onPress={() => setEditing(true)}
                accessibilityRole="button"
                accessibilityLabel="Editar perfil"
              >
                <Feather name="edit-2" size={18} color="white" />
              </TouchableOpacity>
            </View>
            <AdminAccessButton />
            <View className="bg-surface p-4 rounded-2xl border border-line flex-row items-center justify-between my-6">
              <Text className="text-muted">
                {total === undefined && profileQuery.hasNextPage
                  ? "Compras cargadas"
                  : "Compras"}
              </Text>
              <Text className="text-white text-xl font-bold">
                {total ?? orders.length}
              </Text>
            </View>
            <Text className="text-white text-lg font-bold mb-3">
              Mis compras
            </Text>
          </>
        }
        renderItem={({ item: order }) => (
          <PurchasedEventCard
            event={{
              id: order.id,
              name: order.line_items[0]?.name ?? "Compra",
              status: order.status,
              image: order.line_items[0]?.image,
            }}
            onPress={() =>
              router.push({
                pathname: "/order/[id]",
                params: { id: String(order.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View className="bg-gray-800 p-6 rounded-2xl border border-line items-center">
            <Feather name="shopping-bag" size={40} color={Theme.muted} />
            <Text className="text-gray-400 mt-4">
              No hay compras registradas
            </Text>
            <TouchableOpacity
              className="mt-4"
              onPress={() => router.push("/(tabs)/home")}
            >
              <Text className="text-purple-400">Explorar eventos</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <>
            {orders.length > 0 && (
              <Text className="text-gray-400 text-center my-3">
                {total === undefined
                  ? `${orders.length} compras cargadas`
                  : `${orders.length} de ${total} compras`}
              </Text>
            )}
            {profileQuery.isFetchingNextPage && (
              <ActivityIndicator color="#7B3DFF" />
            )}
            {profileQuery.hasNextPage && !profileQuery.isFetchingNextPage && (
              <TouchableOpacity
                disabled={!isOnline}
                className="bg-gray-800 p-4 rounded-2xl border border-line items-center"
                onPress={() => {
                  void profileQuery.fetchNextPage();
                }}
              >
                <Text className="text-purple-400 font-bold">
                  {profileQuery.isFetchNextPageError
                    ? "Reintentar cargar compras anteriores"
                    : "Cargar más compras"}
                </Text>
              </TouchableOpacity>
            )}
            <View className="mt-8 mb-6">
              <Text className="text-white text-lg font-bold mb-3">Ajustes</Text>
              <LogoutButton />
              <CheckForUpdateButton />
            </View>
          </>
        }
      />
      <EditProfileModal
        visible={editing}
        onClose={() => setEditing(false)}
        userData={userData}
        onSave={() => {
          refresh();
          setEditing(false);
        }}
      />
    </>
  );
}
