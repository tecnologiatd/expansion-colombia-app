import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSponsorshipLines } from "@/presentation/hooks/useSponsorshipLines";

interface SponsorshipLineSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SponsorshipLineSelector: React.FC<SponsorshipLineSelectorProps> = ({
  value,
  onChange,
  placeholder = "Seleccionar línea de auspicio",
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Obtener las líneas del backend
  const {
    data: sponsorshipLines,
    isLoading,
    isError,
    refetch,
  } = useSponsorshipLines();

  // Mostrar el valor actual o el placeholder
  const selectedOption = value || placeholder;

  // Procesar los datos para la sección agrupada
  const getSectionedData = () => {
    if (!sponsorshipLines || sponsorshipLines.length === 0) return [];

    // Filtramos por el texto de búsqueda si existe
    const filteredLines = searchText
      ? sponsorshipLines.filter((line) =>
          line.name.toLowerCase().includes(searchText.toLowerCase()),
        )
      : sponsorshipLines;

    // Agrupamos por categoría
    const categoriesMap = new Map();

    filteredLines.forEach((line) => {
      const category = line.category || "Otros";
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, []);
      }
      categoriesMap.get(category).push(line);
    });

    // Convertimos el mapa a un array de secciones
    const sections = Array.from(categoriesMap, ([title, data]) => ({
      title,
      data,
    }));

    // Ordenamos las secciones por un orden predefinido y luego alfabéticamente
    const categoryOrder = {
      Región: 1,
      EMBAJADOR: 2,
      DIAMANTE: 3,
      ESMERALDA: 4,
      Otros: 99,
    };

    return sections.sort((a, b) => {
      const orderA = categoryOrder[a.title] || 50;
      const orderB = categoryOrder[b.title] || 50;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
  };

  return (
    <View>
      <TouchableOpacity
        className="bg-gray-700 p-4 rounded-lg flex-row justify-between items-center"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white">{selectedOption}</Text>
        <Ionicons name="chevron-down" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="bg-gray-800 rounded-t-3xl p-4"
            style={{ maxHeight: "80%" }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">
                Línea de Auspicio
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Búsqueda */}
            <View className="bg-gray-700 rounded-lg flex-row items-center px-3 mb-4">
              <Ionicons name="search" size={20} color="gray" />
              <TextInput
                className="flex-1 py-2 px-2 text-white"
                placeholder="Buscar..."
                placeholderTextColor="gray"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              ) : null}
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#7B3DFF" />
            ) : isError ? (
              <View className="items-center py-4">
                <Text className="text-red-400 mb-2">
                  Error al cargar las líneas de auspicio
                </Text>
                <TouchableOpacity
                  className="bg-gray-700 px-4 py-2 rounded-lg"
                  onPress={() => refetch()}
                >
                  <Text className="text-white">Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <SectionList
                sections={getSectionedData()}
                keyExtractor={(item, index) => `${item.name}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`p-4 rounded-lg mb-2 ${
                      value === item.name ? "bg-purple-500" : "bg-gray-700"
                    }`}
                    onPress={() => {
                      onChange(item.name);
                      setModalVisible(false);
                    }}
                  >
                    <Text className="text-white">{item.name}</Text>
                  </TouchableOpacity>
                )}
                renderSectionHeader={({ section: { title } }) => (
                  <View className="bg-gray-900 py-2 px-4 rounded-t-lg mt-2">
                    <Text className="text-purple-400 font-bold">{title}</Text>
                  </View>
                )}
                showsVerticalScrollIndicator={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={() => (
                  <View className="py-8 items-center">
                    <Text className="text-gray-400 text-center">
                      No hay líneas de auspicio disponibles
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SponsorshipLineSelector;
