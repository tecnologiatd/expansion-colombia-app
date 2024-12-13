import { View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';

const ProfileScreen = () => {
    return(
        <View>
            <Text>
                Profile Screen
            </Text>
        </View>
    )
    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <View className="p-4">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Image
                            source={{ uri: 'https://randomuser.me/api/portraits/men/75.jpg' }}
                            className="w-16 h-16 rounded-full"
                        />
                        <View className="ml-4">
                            <Text className="text-white text-xl font-bold">John Doe</Text>
                            <Text className="text-gray-400 text-base">johndoe@example.com</Text>
                        </View>
                    </View>
                    <TouchableOpacity className="bg-gray-800 rounded-lg p-2">
                        <Feather name="edit" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                <View className="mt-8">
                    <Text className="text-white text-lg font-bold">Upcoming Events</Text>
                    <View className="flex-row items-center justify-between mt-4">
                        <View className="bg-gray-800 rounded-lg p-4 flex-1 mr-4">
                            <Text className="text-white text-base font-medium">BMTH Concert</Text>
                            <Text className="text-gray-400 text-base">Nov 4-6</Text>
                        </View>
                        <View className="bg-gray-800 rounded-lg p-4 flex-1">
                            <Text className="text-white text-base font-medium">Dewa 19 Anniversary</Text>
                            <Text className="text-gray-400 text-base">Nov 4-6</Text>
                        </View>
                    </View>
                </View>
                <View className="mt-8">
                    <Text className="text-white text-lg font-bold">Settings</Text>
                    <TouchableOpacity className="bg-gray-800 rounded-lg py-4 mt-4 flex-row items-center justify-between">
                        <Text className="text-white text-base font-medium">Notification Settings</Text>
                        <Feather name="chevron-right" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity className="bg-gray-800 rounded-lg py-4 mt-4 flex-row items-center justify-between">
                        <Text className="text-white text-base font-medium">Payment Methods</Text>
                        <Feather name="chevron-right" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen;