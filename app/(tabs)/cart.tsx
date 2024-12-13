import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import {router} from "expo-router";

const CartItem = ({ item, onIncrement, onDecrement }) => {
    const [quantity, setQuantity] = useState(1);

    const handleIncrement = () => {
        setQuantity(quantity + 1);
        onIncrement(item.id);
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
            onDecrement(item.id);
        }
    };

    return (
        <View className="flex-row items-center justify-between bg-gray-800 rounded-lg p-4 mb-4 text-purple-500 a">
            <View className="flex-row items-center">
                <Image source={{ uri: item.imageUrl }} className="w-16 h-16 rounded-lg mr-4" />
                <View>
                    <Text className="text-white text-lg font-bold">{item.name}</Text>
                    <View className="flex-row items-center mt-2">
                        <TouchableOpacity
                            className="bg-purple-500 rounded-full p-2 mr-2"
                            onPress={handleDecrement}
                        >
                            <Feather name="minus" size={16} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-lg font-bold">{quantity}</Text>
                        <TouchableOpacity
                            className="bg-purple-500 rounded-full p-2 ml-2"
                            onPress={handleIncrement}
                        >
                            <Feather name="plus" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <Text className="text-white text-lg font-bold">${(item.price * quantity).toLocaleString()}</Text>
        </View>
    );
};

const CartScreen = () => {
    const [cartItems, setCartItems] = useState([
        { id: 1, name: 'Convención Marzo', price: 300000, imageUrl: 'https://expansioncolombia.com/wp-content/uploads/2024/11/convencion_ticketx1.jpg' },
        { id: 2, name: 'Convención Diciembre', price: 250000, imageUrl: 'https://expansioncolombia.com/wp-content/uploads/2024/11/convencion_ticketx1.jpg' },
    ]);

    const handleIncrement = (id) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
            )
        );
    };

    const handleDecrement = (id) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === id ? { ...item, quantity: Math.max((item.quantity || 1) - 1, 1) } : item
            )
        );
    };

    const total = cartItems.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <View className="p-4">
                <Text className="text-white text-2xl font-bold mb-4">Carrito</Text>
                <FlatList
                    data={cartItems}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <CartItem item={item} onIncrement={handleIncrement} onDecrement={handleDecrement} />
                    )}
                    contentContainerStyle={{ paddingBottom: 24 }}
                />
                <View className="bg-gray-800 rounded-lg p-4 flex-row items-center justify-between">
                    <Text className="text-white text-lg font-bold">Total</Text>
                    <Text className="text-white text-lg font-bold">${total.toLocaleString()}</Text>
                </View>
                <TouchableOpacity className="bg-purple-500 rounded-lg py-4 mt-8 justify-center items-center"
                                  onPress={()=> router.push("/payment")}>
                    <Text className="text-white font-bold text-lg">Pagar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default CartScreen;