import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import CustomButton from "@/presentation/components/CustomButton";

const { width } = Dimensions.get("window");

const EventScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView>
        <View className="relative">
          <Image
            source={{
              uri: "https://expansioncolombia.com/wp-content/uploads/2024/11/convencion_ticketx1.jpg",
            }}
            style={{
              width: "100%",
              height: 300,
              resizeMode: "cover",
            }}
          />
          <View className="absolute top-4 left-4 bg-secondary px-3 py-1 rounded-md">
            <Text className="text-black font-medium">
              BMTH "Church of Genxsis" Concert
            </Text>
          </View>
        </View>
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-bold">
              BMTH "Church of Genxsis" Concert
            </Text>
            <TouchableOpacity className="bg-gray-800 rounded-lg p-2">
              <Feather name="share" size={24} color="white" />
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center justify-between mt-4">
            <Text className="text-gray-400 font-medium">$45.00 USD</Text>
            <Text className="text-gray-400 font-medium">Nov 4-6</Text>
            <Text className="text-gray-400 font-medium">CALI</Text>
          </View>
          <Text className="text-gray-400 mt-8">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Hic, ab
            laudantium provident mollitia harum voluptatibus, ut, sequi vel
            expedita aliquam repellat labore molestias at sunt? Distinctio
            tempora reprehenderit praesentium totam assumenda doloremque aut
            nulla? Officia eos tempora, hic eveniet dignissimos nisi dicta,
            consequatur ipsam dolorem neque nulla. Ab, quos magni.
          </Text>
          <View className="mt-8">
            <Text className="text-white text-xl font-bold">
              About this event
            </Text>
            <Text className="text-gray-400 mt-2">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores,
              corporis? Quisquam, quos. Quisquam, quos.
            </Text>
          </View>
          <CustomButton
            title="Get Ticket"
            onPress={() => {}}
            className="bg-secondary rounded-lg py-4 mt-8 justify-center items-center"
          ></CustomButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventScreen;
