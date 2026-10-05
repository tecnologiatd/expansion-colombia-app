import { Text, TouchableOpacity, View } from "react-native";
import { OfflineBanner } from "./OfflineBanner";

export const CachedDataNotice = ({
  offline,
  failed,
  dataUpdatedAt,
  onRetry,
}: {
  offline: boolean;
  failed: boolean;
  dataUpdatedAt?: number;
  onRetry: () => void;
}) => {
  if (!offline && !failed) return null;
  return (
    <View className="my-3">
      <OfflineBanner
        message={
          offline
            ? "Mostrando datos guardados sin conexión"
            : "No se pudo actualizar. Mostrando datos guardados"
        }
        dataUpdatedAt={dataUpdatedAt}
      />
      {!offline && (
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          className="px-4 py-2"
        >
          <Text className="text-purple-300 font-bold">
            Reintentar actualización
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
