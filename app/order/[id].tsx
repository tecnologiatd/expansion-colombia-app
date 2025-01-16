// app/event/order.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useOrderDetails } from '@/presentation/hooks/useOrders';

const OrderDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const { data: order, isLoading, isError } = useOrderDetails(id as string);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(parseFloat(amount));
    };

    const getStatusColor = (status: string) => {
        const statusColors = {
            processing: "text-blue-400",
            completed: "text-green-400",
            pending: "text-yellow-400",
            cancelled: "text-red-400"
        };
        return statusColors[status] || "text-gray-400";
    };

    const handlePayment = async () => {
        if (order?.payment_url) {
            try {
                await Linking.openURL(order.payment_url);
            } catch (error) {
                console.error('Error opening payment URL:', error);
            }
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-[#1a1625] justify-center items-center">
                <ActivityIndicator size="large" color="#6c2bd9" />
            </View>
        );
    }

    if (isError || !order) {
        return (
            <View className="flex-1 bg-[#1a1625] justify-center items-center p-4">
                <Text className="text-white text-lg text-center mb-4">
                    Unable to load order details
                </Text>
                <TouchableOpacity
                    className="bg-purple-500 px-6 py-3 rounded-lg"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#1a1625]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-800">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">Order #{order.number}</Text>
                <View style={{ width: 24 }} /> {/* Spacer for alignment */}
            </View>

            <ScrollView className="flex-1">
                {/* Order Status Card */}
                <View className="m-4 bg-[#2d2639] rounded-xl p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <Text className="text-gray-400 text-sm">Status</Text>
                            <Text className={`text-lg capitalize ${getStatusColor(order.status)}`}>
                                <Ionicons
                                    name={order.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                                    size={18}
                                /> {order.status}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-gray-400 text-sm">Date</Text>
                            <Text className="text-white text-lg">{formatDate(order.date_created)}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-gray-400 text-sm">Total</Text>
                            <Text className="text-white text-lg">{formatCurrency(order.total)}</Text>
                        </View>
                        <View>
                            <Text className="text-gray-400 text-sm">Payment Method</Text>
                            <Text className="text-white text-lg">
                                <Ionicons name="card-outline" size={18} /> {order.payment_method_title}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Items */}
                <View className="m-4 bg-[#2d2639] rounded-xl p-4">
                    <Text className="text-white text-lg mb-3">Items</Text>
                    {order.line_items.map((item) => (
                        <View key={item.id} className="flex-row justify-between items-center py-2 border-b border-gray-700">
                            <View className="flex-1">
                                <Text className="text-white">{item.name}</Text>
                                <Text className="text-gray-400">Quantity: {item.quantity}</Text>
                            </View>
                            <Text className="text-white">{formatCurrency(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {/* Billing Information */}
                <View className="m-4 bg-[#2d2639] rounded-xl p-4">
                    <Text className="text-white text-lg mb-3">
                        <Ionicons name="person-outline" size={18} /> Billing Details
                    </Text>
                    <View className="space-y-2">
                        <Text className="text-gray-400">
                            {order.billing.first_name} {order.billing.last_name}
                        </Text>
                        <Text className="text-gray-400">
                            <Ionicons name="mail-outline" size={16} /> {order.billing.email}
                        </Text>
                        <Text className="text-gray-400">
                            <Ionicons name="call-outline" size={16} /> {order.billing.phone}
                        </Text>
                        <Text className="text-gray-400">
                            <Ionicons name="location-outline" size={16} /> {[
                            order.billing.address_1,
                            order.billing.city,
                            order.billing.state,
                            order.billing.postcode,
                            order.billing.country
                        ].filter(Boolean).join(', ')}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                {order.status === 'pending' && order.payment_url && (
                    <View className="m-4">
                        <TouchableOpacity
                            className="bg-[#6c2bd9] p-4 rounded-xl flex-row justify-center items-center space-x-2"
                            onPress={handlePayment}
                        >
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text className="text-white text-center font-semibold text-lg">
                                Complete Payment
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="m-4 mb-8 space-y-3">
                    <TouchableOpacity
                        className="border border-[#6c2bd9] p-4 rounded-xl flex-row justify-center items-center space-x-2"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chatbox-outline" size={20} color="white" />
                        <Text className="text-white text-center font-semibold text-lg">
                            Contact Support
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default OrderDetailScreen