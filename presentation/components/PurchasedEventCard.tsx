import { Image, Text, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { imageSource } from "@/helpers/image-source";
import { PressableScale } from "@/presentation/components/ui/PressableScale";
import { Theme } from "@/presentation/theme/Colors";
import { plainText } from "@/helpers/format";

const STATUS: Record<string, { label: string; box: string; text: string }> = {
  completed: {
    label: "Completado",
    box: "bg-green-500/15",
    text: "text-green-400",
  },
  processing: {
    label: "En proceso",
    box: "bg-blue-500/15",
    text: "text-blue-400",
  },
  pending: {
    label: "Pendiente",
    box: "bg-yellow-500/15",
    text: "text-yellow-400",
  },
  "on-hold": {
    label: "En espera",
    box: "bg-yellow-500/15",
    text: "text-yellow-400",
  },
  failed: {
    label: "Pago no completado",
    box: "bg-red-500/15",
    text: "text-red-400",
  },
  cancelled: {
    label: "Cancelado",
    box: "bg-red-500/15",
    text: "text-red-400",
  },
};

const PurchasedEventCard = ({
  event,
  onPress,
}: {
  event: { id: number; name: string; status: string; image?: { src: string } };
  onPress: () => void;
}) => {
  const status = STATUS[event.status] ?? {
    label: event.status,
    box: "bg-surface-raised",
    text: "text-muted",
  };

  return (
    <PressableScale
      className="bg-surface border border-line rounded-2xl p-3 flex-row items-center"
      containerStyle={{ marginBottom: 12 }}
      onPress={onPress}
    >
      {event.image && (
        <Image
          source={imageSource(event.image.src)}
          className="w-16 h-16 rounded-xl bg-surface-raised"
        />
      )}
      <View className={`flex-1 ${event.image ? "ml-3" : ""}`}>
        <Text className="text-white text-base font-semibold" numberOfLines={2}>
          {plainText(event.name)}
        </Text>
        <Text className="text-muted text-sm mt-0.5">Orden #{event.id}</Text>
        <View
          className={`self-start px-2.5 py-1 rounded-full mt-2 ${status.box}`}
        >
          <Text className={`text-xs font-semibold ${status.text}`}>
            {status.label}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Theme.muted} />
    </PressableScale>
  );
};

export default PurchasedEventCard;
