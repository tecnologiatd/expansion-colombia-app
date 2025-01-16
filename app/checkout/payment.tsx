// app/checkout/payment.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCreateOrder } from '@/presentation/hooks/useOrders';
import { useCartStore } from '@/core/stores/cart-store';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentScreen() {
    const { billingData } = useLocalSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);
    const { createOrderMutation, prepareOrderItems } = useCreateOrder();
    const { calculateTotal } = useCartStore();

    const handlePaymentMethod = async (method: 'pse' | 'creditcard') => {
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
                router.push({
                    pathname: '/event/order',
                    params: { orderId: response.id.toString() }
                });
            } else {
                Alert.alert('Error', 'No payment URL received from server');
            }
        } catch (error) {
            console.error('Payment error:', error);
            Alert.alert(
                'Error',
                'There was a problem processing your payment. Please try again.'
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
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold ml-4">
                        Select Payment Method
                    </Text>
                </View>

                {/* Amount Display */}
                <View className="bg-gray-800 p-4 rounded-lg mb-6">
                    <Text className="text-gray-400 text-base mb-2">Total Amount</Text>
                    <Text className="text-white text-2xl font-bold">
                        ${calculateTotal().toLocaleString()}
                    </Text>
                </View>

                {/* Payment Options */}
                <View className="space-y-4">
                    <TouchableOpacity
                        className={`bg-blue-500 p-6 rounded-lg flex-row justify-between items-center ${
                            isProcessing ? 'opacity-50' : ''
                        }`}
                        onPress={() => handlePaymentMethod('pse')}
                        disabled={isProcessing}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="bank-outline" size={24} color="white" />
                            <View className="ml-4">
                                <Text className="text-white text-lg font-bold">PSE</Text>
                                <Text className="text-white opacity-75">Pay with your bank account</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`bg-purple-500 p-6 rounded-lg flex-row justify-between items-center ${
                            isProcessing ? 'opacity-50' : ''
                        }`}
                        onPress={() => handlePaymentMethod('creditcard')}
                        disabled={isProcessing}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="card-outline" size={24} color="white" />
                            <View className="ml-4">
                                <Text className="text-white text-lg font-bold">Credit Card</Text>
                                <Text className="text-white opacity-75">Pay with credit/debit card</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Processing Indicator */}
                {isProcessing && (
                    <View className="absolute inset-0 bg-black/50 justify-center items-center">
                        <View className="bg-gray-800 p-6 rounded-lg items-center">
                            <ActivityIndicator size="large" color="#8B5CF6" />
                            <Text className="text-white mt-4">Processing Payment...</Text>
                        </View>
                    </View>
                )}

                {/* Security Notice */}
                <View className="mt-auto p-4 bg-gray-800 rounded-lg">
                    <Text className="text-gray-400 text-center text-sm">
                        Secure payment processed by OpenPay BBA
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}