import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';

const PaymentScreen = () => {
    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <View className="p-4">
                <Text className="text-white text-2xl font-bold mb-4">Payment</Text>
                <View className="bg-gray-800 rounded-lg p-4 mb-4">
                    <Text className="text-gray-400 text-base font-medium mb-2">Card Number</Text>
                    <TextInput
                        placeholder="4111 1111 1111 1111"
                        placeholderTextColor="gray"
                        className="text-white text-lg"
                    />
                </View>
                <View className="flex-row items-center justify-between mb-4">
                    <View className="bg-gray-800 rounded-lg p-4 flex-1 mr-2">
                        <Text className="text-gray-400 text-base font-medium mb-2">Expiration</Text>
                        <TextInput
                            placeholder="MM/YY"
                            placeholderTextColor="gray"
                            className="text-white text-lg"
                        />
                    </View>
                    <View className="bg-gray-800 rounded-lg p-4 flex-1 ml-2">
                        <Text className="text-gray-400 text-base font-medium mb-2">CVV</Text>
                        <TextInput
                            placeholder="123"
                            placeholderTextColor="gray"
                            className="text-white text-lg"
                        />
                    </View>
                </View>
                <View className="bg-gray-800 rounded-lg p-4 mb-4">
                    <Text className="text-gray-400 text-base font-medium mb-2">Billing Address</Text>
                    <TextInput
                        placeholder="123 Main St, Naperville, IL 60540"
                        placeholderTextColor="gray"
                        className="text-white text-lg"
                    />
                </View>
                <TouchableOpacity className="bg-purple-500 rounded-lg py-4 justify-center items-center">
                    <Text className="text-white font-bold text-lg">Pay $45.00</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default PaymentScreen;