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

const PREDEFINED_CATEGORIES = ["EMBAJADOR", "DIAMANTE", "ESMERALDA"];
const DEFAULT_CATEGORY = "EMBAJADOR";

function SponsorshipFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  availableCategories,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  initialData?: SponsorshipLine;
  isLoading: boolean;
  availableCategories: string[];
}) {
  const [form, setForm] = useState<FormData>({
    name: initialData?.name ?? "",
    category: initialData?.category ?? DEFAULT_CATEGORY,
    active: initialData?.active ?? true,
  });
  const [customMode, setCustomMode] = useState(false);

  React.useEffect(() => {
    if (visible) {
      const initialCategory = initialData?.category ?? DEFAULT_CATEGORY;
      setForm({
        name: initialData?.name ?? "",
        category: initialCategory,
        active: initialData?.active ?? true,
      });
      setCustomMode(
        !!initialData?.category &&
          !availableCategories.includes(initialData.category),
      );
    }
  }, [visible, initialData, availableCategories]);

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }
    if (!form.category.trim()) {
      Alert.alert("Error", "La categoría es obligatoria");
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
            {customMode ? (
              <View className="mb-4">
                <TextInput
                  className="bg-gray-700 text-white p-3 rounded-lg mb-2"
                  value={form.category}
                  onChangeText={(t) => setForm((f) => ({ ...f, category: t }))}
                  placeholder="Nombre de la categoría"
                  placeholderTextColor="#666"
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setCustomMode(false);
                    setForm((f) => ({ ...f, category: DEFAULT_CATEGORY }));
                  }}
                  className="flex-row items-center"
                >
                  <Ionicons name="arrow-back" size={14} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs ml-1">
                    Elegir de la lista
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row flex-wrap mb-4">
                {availableCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setForm((f) => ({ ...f, category: cat }))}
                    className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                      form.category === cat ? "bg-purple-500" : "bg-gray-700"
                    }`}
                  >
                    <Text
                      className={
                        form.category === cat
                          ? "text-white font-bold"
                          : "text-gray-300"
                      }
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => {
                    setCustomMode(true);
                    setForm((f) => ({ ...f, category: "" }));
                  }}
                  className="px-3 py-2 rounded-full mr-2 mb-2 bg-gray-700 border border-dashed border-gray-500 flex-row items-center"
                >
                  <Ionicons name="add" size={14} color="#D1D5DB" />
                  <Text className="text-gray-300 ml-1">Nueva</Text>
                </TouchableOpacity>
              </View>
            )}

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

  // Group lines by category for SectionList — sorted by order within each category
  const sections = React.useMemo(() => {
    if (!query.data) return [];

    const map = new Map<string, SponsorshipLine[]>();
    for (const line of query.data) {
      const cat = line.category || "Sin Categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(line);
    }

    // Sort items within each section by `order` ASC
    for (const [, items] of map) {
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    const categoryOrder: Record<string, number> = {
      EMBAJADOR: 1,
      DIAMANTE: 2,
      ESMERALDA: 3,
    };

    return Array.from(map, ([title, data]) => ({ title, data })).sort(
      (a, b) =>
        (categoryOrder[a.title] ?? 50) - (categoryOrder[b.title] ?? 50),
    );
  }, [query.data]);

  // Predefined categories + any custom ones that already exist in the data
  const availableCategories = React.useMemo(() => {
    const existing = new Set(
      (query.data ?? [])
        .map((l) => l.category)
        .filter((c): c is string => !!c),
    );
    const merged = [...PREDEFINED_CATEGORIES];
    for (const cat of existing) {
      if (!merged.includes(cat)) merged.push(cat);
    }
    return merged;
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
    Alert.alert("Eliminar", `¿Eliminar "${line.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteMutation.mutate(line.id),
      },
    ]);
  };

  const handleDeleteCategory = (
    category: string,
    lines: SponsorshipLine[],
  ) => {
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

  /** Swap the `order` values of two adjacent items within the same section. */
  const handleMove = async (
    item: SponsorshipLine,
    sectionItems: SponsorshipLine[],
    direction: "up" | "down",
  ) => {
    const idx = sectionItems.findIndex((l) => l.id === item.id);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionItems.length) return;

    const other = sectionItems[targetIdx];
    const itemOrder = item.order ?? idx * 10;
    const otherOrder = other.order ?? targetIdx * 10;

    try {
      await Promise.all([
        updateMutation.mutateAsync({ id: item.id, order: otherOrder }),
        updateMutation.mutateAsync({ id: other.id, order: itemOrder }),
      ]);
    } catch {
      Alert.alert("Error", "No se pudo reordenar. Inténtalo de nuevo.");
    }
  };

  const handleSubmit = (form: FormData) => {
    // When creating or moving to a different category, place at the end
    let order = editingLine?.order;
    if (!editingLine || editingLine.category !== form.category.trim()) {
      const itemsInCat =
        query.data?.filter((l) => l.category === form.category.trim()) || [];
      const maxOrder =
        itemsInCat.length > 0
          ? Math.max(...itemsInCat.map((i) => i.order ?? 0))
          : 0;
      order = maxOrder + 10;
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

  const isReordering = updateMutation.isPending;

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
              <Text className="text-gray-500 font-normal">
                {" "}
                · {data.length}
              </Text>
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
        renderItem={({ item, index, section }) => {
          const sectionItems = section.data;
          const isFirst = index === 0;
          const isLast = index === sectionItems.length - 1;

          return (
            <View
              className={`mx-4 my-1 rounded-lg flex-row items-center ${
                item.active ? "bg-gray-800" : "bg-gray-800/50"
              }`}
            >
              {/* Sort arrows */}
              <View className="w-9 items-center justify-center py-3 pl-2">
                <TouchableOpacity
                  onPress={() => handleMove(item, sectionItems, "up")}
                  disabled={isFirst || isReordering}
                  className="py-1"
                  hitSlop={4}
                >
                  <Ionicons
                    name="chevron-up"
                    size={16}
                    color={isFirst ? "#374151" : "#9CA3AF"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleMove(item, sectionItems, "down")}
                  disabled={isLast || isReordering}
                  className="py-1"
                  hitSlop={4}
                >
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={isLast ? "#374151" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>

              {/* Name — tap to edit */}
              <TouchableOpacity
                className="flex-1 px-2 py-4"
                onPress={() => handleEdit(item)}
              >
                <Text
                  className={`font-medium ${item.active ? "text-white" : "text-gray-500"}`}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>

              {/* Active toggle + delete */}
              <View className="flex-row items-center pr-2">
                <Switch
                  value={item.active}
                  onValueChange={() => handleToggleActive(item)}
                  trackColor={{ false: "#555", true: "#7B3DFF" }}
                  thumbColor="white"
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <TouchableOpacity
                  className="ml-1 p-2"
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
        availableCategories={availableCategories}
      />
    </SafeAreaView>
  );
}
