import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import EventCard from "@/presentation/components/EventCard";
import { useProducts } from "@/presentation/hooks/useProducts";

export default function Tab() {
  const { productsQuery } = useProducts();
  console.log(productsQuery.data);
  if (productsQuery.isLoading) {
    return (
      <View className="justify-center items-center flex-1">
        <ActivityIndicator color="purple" size={40} />
      </View>
    );
  }

  if (productsQuery.isError) {
    // TODO: Make and error Component
    return (
      <View className="justify-center items-center flex-1">
        <Text className="text-black">Error</Text>
      </View>
    );
  }

  if (productsQuery.data?.length === 0) {
    return (
      <View className="justify-center items-center flex-1">
        <Text className="text-black">No events found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView>
        <View className="mt-8 mb-4 mx-4">
          <Text className="text-3xl font-bold text-white">
            Eventos en <Text className="text-secondary">Colombia</Text>
          </Text>
        </View>
        {/* Search */}
        <View className="mx-4 mb-8 flex-row justify-between items-center">
          <View className="flex-1 p-2 bg-gray-800 rounded-lg flex-row items-center">
            <Entypo name="magnifying-glass" size={24} color="gray" />
            <TextInput
              placeholder="Search any event..."
              placeholderTextColor="gray"
              className="flex-1 text-white ml-2"
            />
          </View>
          <TouchableOpacity className="bg-gray-800 rounded-lg p-2 ml-4">
            <Feather name="filter" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {/* Categories */}
        <View className="mx-4 mb-8 flex-row justify-between">
          <TouchableOpacity className="bg-gray-800 rounded-lg py-3 px-4 flex-1 mr-2">
            <Text className="text-white font-medium">Musica</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-800 rounded-lg py-3 px-4 flex-1 mx-2">
            <Text className="text-white font-medium">Festivales</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-gray-800 rounded-lg py-3 px-4 flex-1 ml-2">
            <Text className="text-white font-medium">Deportes</Text>
          </TouchableOpacity>
        </View>
        {/* Cards */}
        {productsQuery.data &&
          productsQuery.data.map((item, index) => (
            <EventCard product={item} key={index} />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
