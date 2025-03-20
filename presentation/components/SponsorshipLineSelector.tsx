import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Opciones predefinidas de líneas de auspicio
const SPONSORSHIP_LINES = [
  { id: "jose_bobadilla", name: "Jose Bobadilla - EMBAJADOR CORONA" },
  { id: "diana_cuellar", name: "Diana Cuellar - DIAMANTE EJECUTIVO" },
  {
    id: "mauricio_esperanza",
    name: "Mauricio Castillo y Esperanza Mosquera - DIAMANTES",
  },
  { id: "jorge_pilar", name: "Jorge Ivan Benavides y Pilar López - DIAMANTES" },
  { id: "fausto_gutierrez", name: "Fausto Gutierrez - DIAMANTES" },
  { id: "diego_martha", name: "Diego Ortega y Martha Castañeda - DIAMANTES" },
  { id: "luis_vivian", name: "Luis Granados y Vivian Mosquera - ESMERALDAS" },
  { id: "marcelo_rojas", name: "Marcelo Rojas - ESMERALDAS" },
  {
    id: "andres_blanca",
    name: "Andres Bolaños y Blanca Bolaños - ESMERALDAS FUNDADORES",
  },
  { id: "yesid_angie", name: "Yesid Murillo y Angie Pereira - ESMERALDAS" },
  { id: "carlos_luz", name: "Carlos Urbano y Luz Angela Pulido - ESMERALDAS" },
  {
    id: "francisco_angela",
    name: "Francisco Alvarez y Angela Gonzalez - ESMERALDAS",
  },
  { id: "harold_adriana", name: "Harold Perez y Adriana Sarria - ESMERALDAS" },
  { id: "jackson_paola", name: "Jackson Arturo y Paola Diaz - ESMERALDAS" },
  { id: "lina_ramirez", name: "Lina Ramirez - ESMERALDA" },
  { id: "felix_anayibe", name: "Felix Pardo y Anayibe - ESMERALDAS" },
  { id: "wilmer_ochoa", name: "Wilmer Ochoa - ESMERALDA" },
  {
    id: "william_claudia",
    name: "William Restrepo y Claudia Soto - ESMERALDAS",
  },
  { id: "enrique_ana", name: "Enrique Silvera y Ana Hernandez - ESMERALDAS" },
  {
    id: "alexandra_alvaro",
    name: "Alexandra Rivas y Alvaro Narvaez - ESMERALDAS",
  },
  { id: "fredy_restrepo", name: "Fredy Restrepo - ESMERALDAS" },
  { id: "miller_camel", name: "Miller Camel - ESMERALDA" },
  { id: "olga_romero", name: "Olga Romero - ESMERALDA" },
];

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

  // Mostrar el valor actual si existe, o el placeholder si no
  const selectedOption = value || placeholder;

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

            <FlatList
              data={SPONSORSHIP_LINES}
              keyExtractor={(item) => item.id}
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
              showsVerticalScrollIndicator={true}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SponsorshipLineSelector;
