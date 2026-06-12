// app/(admin)/conflicts.tsx
// Revisión de conflictos: tickets validados más veces de las permitidas
// (p. ej. dos escáneres offline validaron el mismo ticket).
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTicketConflicts } from "@/presentation/hooks/useTicketConflicts";
import { ConflictTicket } from "@/core/actions/ticket-validation.actions";

const ConflictCard = ({
  ticket,
  onResolve,
  isResolving,
}: {
  ticket: ConflictTicket;
  onResolve: () => void;
  isResolving: boolean;
}) => {
  const conflictEntries = (ticket.usageHistory ?? []).filter(
    (entry) => entry.conflict,
  );
  const qrTail = ticket.qrCode.split("/")[0].slice(-8);

  return (
    <View className="bg-gray-800 rounded-xl p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text
          className="text-white font-bold text-base flex-1"
          numberOfLines={1}
        >
          {ticket.customerName || "Cliente no disponible"}
        </Text>
        <View className="bg-red-500/20 px-2 py-1 rounded-lg">
          <Text className="text-red-400 text-xs font-bold">
            {ticket.usageCount}/{ticket.maxUsages} usos
          </Text>
        </View>
      </View>

      <Text className="text-gray-400 text-sm mb-1">
        QR …{qrTail} · Orden #{ticket.orderId} · Evento {ticket.eventId}
      </Text>

      {conflictEntries.map((entry, index) => (
        <View key={index} className="bg-gray-700/50 rounded-lg p-2 mt-2">
          <Text className="text-yellow-500 text-xs">
            Validación en exceso:{" "}
            {new Date(entry.timestamp).toLocaleString("es-CO")}
            {entry.validatedByName ? ` · por ${entry.validatedByName}` : ""}
            {entry.offline ? " · offline" : ""}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        onPress={onResolve}
        disabled={isResolving}
        className={`bg-purple-500 py-3 rounded-xl mt-3 flex-row justify-center items-center ${
          isResolving ? "opacity-50" : ""
        }`}
      >
        {isResolving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="checkmark-done-outline" size={18} color="white" />
            <Text className="text-white font-bold ml-2">Marcar revisado</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function ConflictsScreen() {
  const { conflictsQuery, resolveConflictMutation } = useTicketConflicts();

  const conflicts = conflictsQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-900" edges={["bottom"]}>
      <View className="px-4 py-4">
        <Text className="text-white text-xl font-bold">
          Conflictos de validación
        </Text>
        <Text className="text-gray-400 mt-1">
          Tickets validados más veces de las permitidas (normalmente por
          escaneos sin conexión en varios dispositivos)
        </Text>
      </View>

      {conflictsQuery.isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#7B3DFF" />
        </View>
      ) : conflictsQuery.isError ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-white text-center mb-4">
            No se pudieron cargar los conflictos (requiere conexión)
          </Text>
          <TouchableOpacity
            className="bg-purple-500 px-6 py-3 rounded-lg"
            onPress={() => conflictsQuery.refetch()}
          >
            <Text className="text-white font-bold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : conflicts.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="shield-checkmark-outline" size={48} color="#22C55E" />
          <Text className="text-gray-400 mt-4 text-center">
            No hay conflictos pendientes de revisión
          </Text>
        </View>
      ) : (
        <FlatList
          data={conflicts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={conflictsQuery.isFetching}
              onRefresh={() => conflictsQuery.refetch()}
              tintColor="#7B3DFF"
            />
          }
          renderItem={({ item }) => (
            <ConflictCard
              ticket={item}
              onResolve={() => resolveConflictMutation.mutate(item.id)}
              isResolving={
                resolveConflictMutation.isPending &&
                resolveConflictMutation.variables === item.id
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
