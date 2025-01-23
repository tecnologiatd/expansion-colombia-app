// app/checkout/payment.tsx
import React, {useState} from 'react';
import {ActivityIndicator, Alert, Image, Text, TouchableOpacity, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {useCreateOrder} from '@/presentation/hooks/useOrders';
import {useCartStore} from '@/core/stores/cart-store';
import * as Linking from 'expo-linking';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';

export default function PaymentScreen() {
    const {billingData} = useLocalSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);
    const {createOrderMutation, prepareOrderItems} = useCreateOrder();
    const {calculateTotal} = useCartStore();

    const handlePaymentMethod = async (method: 'openpay_pse' | 'openpay_cards') => {
        try {
            setIsProcessing(true);
            const parsedBilling = JSON.parse(billingData as string);
            const orderItems = prepareOrderItems();

            const response = await createOrderMutation.mutateAsync({
                payment_method: method,
                billing: parsedBilling,
                line_items: orderItems
            });

            if (response?.payment_url) {
                // Open payment URL and navigate to order details
                await Linking.openURL(response.payment_url);
                router.replace({
                    pathname: '/order/' + response.id.toString(),
                });
            } else {
                Alert.alert('Error', 'No se recibió la URL de pago del servidor');
            }
        } catch (error) {
            console.error('Error de pago:', error);
            Alert.alert(
                'Error',
                'Hubo un problema procesando tu pago. Por favor intenta de nuevo.'
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <View className="flex-1 p-4">
                {/* Header */}
                <View className="flex-row items-center mb-6">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 rounded-full bg-gray-800"
                    >
                        <Ionicons name="arrow-back" size={24} color="white"/>
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold ml-4">
                        Selecciona el metodo de Pago
                    </Text>
                </View>

                {/* Amount Display */}
                <View className="bg-gray-800 p-4 rounded-lg mb-6">
                    <Text className="text-gray-400 text-base mb-2">Cantidad a pagar</Text>
                    <Text className="text-white text-2xl font-bold">
                        ${calculateTotal().toLocaleString()}
                    </Text>
                </View>

                {/* Payment Options */}
                <View className="space-y-4">
                    <TouchableOpacity
                        className={`bg-blue-500 p-6 rounded-lg flex-row justify-between items-center mb-10 ${
                            isProcessing ? 'opacity-50' : ''
                        }`}
                        onPress={() => handlePaymentMethod('openpay_pse')}
                        disabled={isProcessing}
                    >
                        <View className="flex-row items-center">
                            <Image source={require('@/assets/images/pse-seeklogo.png')}
                                   className="w-16 h-16 rounded-lg"/>
                            <View className="ml-4">

                                <Text className="text-white text-lg font-bold">PSE</Text>
                                <Text className="text-white opacity-75">Pagar con tu cuenta bancaria</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white"/>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`bg-purple-500 p-6 rounded-lg flex-row justify-between items-center ${
                            isProcessing ? 'opacity-50' : ''
                        }`}
                        onPress={() => handlePaymentMethod('openpay_cards')}
                        disabled={isProcessing}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="card-outline" size={44} color="white"/>
                            <View className="ml-4">
                                <Text className="text-white text-lg font-bold">Tarjeta de Credito</Text>
                                <Text className="text-white opacity-75">Pagar con tu tarjeta de credito/debito </Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white"/>
                    </TouchableOpacity>
                </View>

                {/* Processing Indicator */}
                {isProcessing && (
                    <View className="absolute inset-0 bg-black/50 justify-center items-center">
                        <View className="bg-gray-800 p-6 rounded-lg items-center">
                            <ActivityIndicator size="large" color="#8B5CF6"/>
                            <Text className="text-white mt-4">Creando Orden...</Text>
                        </View>
                    </View>
                )}

                {/* Security Notice */}
                <View className="mt-auto p-4 bg-gray-800 rounded-lg">
                    <Text className="text-gray-400 text-center text-sm">
                        Los pagos son procesador por OpenPay de BBVA
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}