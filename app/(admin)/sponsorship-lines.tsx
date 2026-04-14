import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAdminSponsorshipLines } from "@/presentation/hooks/useSponsorshipLines";
import { SponsorshipLine } from "@/core/actions/sponsorship.actions";

// ── Form Modal ──────────────────────────────────────────────────────────

interface FormData {
  name: string;
  category: string;
  active: boolean;
}

const PREDEFINED_CATEGORIES = ["Región", "EMBAJADOR", "DIAMANTE", "ESMERALDA"];

function SponsorshipFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: SponsorshipLine;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<FormData>({
    name: initialData?.name ?? "",
    category: initialData?.category ?? "Región",
    active: initialData?.active ?? true,
  });

  React.useEffect(() => {
    if (visible) {
      setForm({
        name: initialData?.name ?? "",
        category: initialData?.category ?? "Región",
        active: initialData?.active ?? true,
      });
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    onSubmit(form);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="bg-gray-800 rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-xl font-bold">
              {initialData ? "Editar Línea" : "Nueva Línea"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="text-gray-400 mb-1">Nombre *</Text>
            <TextInput
              className="bg-gray-700 text-white p-3 rounded-lg mb-4"
              value={form.name}
              onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              placeholder="Nombre de la línea"
              placeholderTextColor="#666"
            />

            <Text className="text-gray-400 mb-1">Categoría</Text>
            <View className="flex-row flex-wrap mb-4">
              {PREDEFINED_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setForm((f) => ({ ...f, category: cat }))}
                  className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                    form.category === cat ? "bg-purple-500" : "bg-gray-700"
                  }`}
                >
                  <Text className={form.category === cat ? "text-white font-bold" : "text-gray-300"}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-gray-400">Activa</Text>
              <Switch
                value={form.active}
                onValueChange={(v) => setForm((f) => ({ ...f, active: v }))}
                trackColor={{ false: "#555", true: "#7B3DFF" }}
                thumbColor="white"
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            className={`bg-purple-500 p-4 rounded-lg ${isLoading ? "opacity-50" : ""}`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-bold text-lg">
              {isLoading ? "Guardando..." : "Guardar"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────

export default function SponsorshipLinesScreen() {
  const { query, createMutation, updateMutation, deleteMutation } =
    useAdminSponsorshipLines();

  const [formVisible, setFormVisible] = useState(false);
  const [editingLine, setEditingLine] = useState<SponsorshipLine | undefined>();

  // Group lines by category for SectionList
  const sections = React.useMemo(() => {
    if (!query.data) return [];

    const map = new Map<string, SponsorshipLine[]>();
    for (const line of query.data) {
      const cat = line.category || "Sin Categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(line);
    }

    const categoryOrder: Record<string, number> = {
      Región: 1,
      EMBAJADOR: 2,
      DIAMANTE: 3,
      ESMERALDA: 4,
    };

    return Array.from(map, ([title, data]) => ({ title, data })).sort(
      (a, b) =>
        (categoryOrder[a.title] ?? 50) - (categoryOrder[b.title] ?? 50),
    );
  }, [query.data]);

  const handleCreate = () => {
    setEditingLine(undefined);
    setFormVisible(true);
  };

  const handleEdit = (line: SponsorshipLine) => {
    setEditingLine(line);
    setFormVisible(true);
  };

  const handleDelete = (line: SponsorshipLine) => {
    Alert.alert(
      "Eliminar",
      `¿Eliminar "${line.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteMutation.mutate(line.id),
        },
      ],
    );
  };

  const handleDeleteCategory = (category: string, lines: SponsorshipLine[]) => {
    Alert.alert(
      "Eliminar categoría",
      `¿Eliminar la categoría "${category}" y sus ${lines.length} línea${lines.length === 1 ? "" : "s"}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar todo",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                lines.map((l) => deleteMutation.mutateAsync(l.id)),
              );
            } catch {
              Alert.alert("Error", "No se pudieron eliminar todas las líneas.");
            }
          },
        },
      ],
    );
  };

  const handleSubmit = (form: FormData) => {
    let order = editingLine?.order;
    if (!editingLine || editingLine.category !== form.category.trim()) {
      const itemsInCat = query.data?.filter(l => l.category === form.category.trim()) || [];
      order = itemsInCat.length > 0 ? Math.max(...itemsInCat.map(i => i.order)) + 1 : 1;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      order,
      active: form.active,
    };

    if (editingLine) {
      updateMutation.mutate(
        { id: editingLine.id, ...payload },
        { onSuccess: () => setFormVisible(false) },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormVisible(false),
      });
    }
  };

  const handleToggleActive = (line: SponsorshipLine) => {
    updateMutation.mutate({ id: line.id, active: !line.active });
  };

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#7B3DFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900" edges={["bottom"]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderSectionHeader={({ section: { title, data } }) => (
          <View className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex-row items-center justify-between">
            <Text className="text-purple-400 font-bold text-base">
              {title}
              <Text className="text-gray-500 font-normal"> · {data.length}</Text>
            </Text>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => handleDeleteCategory(title, data)}
              className="p-1"
            >
              <Ionicons name="trash-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <View
            className={`mx-4 my-1 p-4 rounded-lg flex-row items-center justify-between ${
              item.active ? "bg-gray-800" : "bg-gray-800/50"
            }`}
          >
            <TouchableOpacity
              className="flex-1 mr-3"
              onPress={() => handleEdit(item)}
            >
              <Text
                className={`font-medium ${item.active ? "text-white" : "text-gray-500"}`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Switch
                value={item.active}
                onValueChange={() => handleToggleActive(item)}
                trackColor={{ false: "#555", true: "#7B3DFF" }}
                thumbColor="white"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
              <TouchableOpacity
                className="ml-2 p-2"
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="text-gray-400">
              No hay líneas de auspicio configuradas
            </Text>
          </View>
        }
        refreshing={query.isFetching}
        onRefresh={() => query.refetch()}
      />

      {/* FAB to add new line */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-purple-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={handleCreate}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <SponsorshipFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmit}
        initialData={editingLine}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </SafeAreaView>
  );
}
