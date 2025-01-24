// app/order/[id].tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useOrderDetails } from '@/presentation/hooks/useOrders';

const OrderDetailScreen = () => {
    const { id } = useLocalSearchParams();
    const { data: order, isLoading, isError, error } = useOrderDetails(id as string);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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
        switch (status) {
            case 'processing':
                return 'text-blue-400';
            case 'completed':
                return 'text-green-400';
            case 'cancelled':
                return 'text-red-400';
            case 'pending':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
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
            <View className="flex-1 bg-gray-900 justify-center items-center">
                <ActivityIndicator size="large" color="#7B3DFF" />
            </View>
        );
    }

    if (isError || !order) {
        return (
            <View className="flex-1 bg-gray-900 justify-center items-center p-4">
                <Text className="text-white text-lg text-center mb-4">
                    Error al cargar los detalles del pedido
                </Text>
                <TouchableOpacity
                    className="bg-purple-500 px-6 py-3 rounded-lg"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalItems = order.line_items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <View className="flex-1 bg-gray-900">
            <ScrollView className="flex-1">
                {/* Status and Date Card */}
                <View className="m-4 bg-gray-800 rounded-xl p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <Text className="text-gray-400">Estado</Text>
                            <Text className={`text-lg capitalize ${getStatusColor(order.status)}`}>
                                <Ionicons
                                    name={order.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                                    size={18}
                                /> {order.status}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-gray-400">Fecha</Text>
                            <Text className="text-white">
                                {formatDate(order.date_created)}
                            </Text>
                        </View>
                    </View>

                    {/* Order Summary */}
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-gray-400">Total</Text>
                            <Text className="text-white text-lg font-bold">
                                {formatCurrency(order.total)}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-gray-400">Items</Text>
                            <Text className="text-white text-lg">
                                {totalItems} {totalItems === 1 ? 'item' : 'items'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Products List */}
                <View className="m-4 bg-gray-800 rounded-xl p-4">
                    <Text className="text-white text-lg font-bold mb-4">Eventos</Text>
                    {order.line_items.map((item) => (
                        <View key={item.id} className="flex-row mb-4 border-b border-gray-700 pb-4">
                            {item.image && (
                                <Image
                                    source={{ uri: item.image.src }}
                                    className="w-20 h-20 rounded-lg"
                                />
                            )}
                            <View className="flex-1 ml-4">
                                <Text className="text-white font-bold">{item.name}</Text>
                                <Text className="text-gray-400">
                                    Quantity: {item.quantity}
                                </Text>
                                <Text className="text-white mt-1">
                                    {formatCurrency(item.total)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Billing Information */}
                <View className="m-4 bg-gray-800 rounded-xl p-4">
                    <Text className="text-white text-lg font-bold mb-4">
                        Detalles de facturación
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

                {/* Payment Action */}
                {order.status === 'pending' && order.payment_url && (
                    <View className="m-4 mb-8">
                        <TouchableOpacity
                            className="bg-purple-500 p-4 rounded-xl flex-row justify-center items-center space-x-2"
                            onPress={handlePayment}
                        >
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text className="text-white font-bold text-lg ml-2">
                                Completar Pago
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
                {/*{order?.status === 'pending' && (*/}
                {/*    <View className="m-4 bg-yellow-500/20 p-4 rounded-xl">*/}
                {/*        <Text className="text-yellow-500 text-center">*/}
                {/*            Esperando confirmación del pago...*/}
                {/*        </Text>*/}
                {/*    </View>*/}
                {/*)}*/}
            </ScrollView>
        </View>
    );
};

export default OrderDetailScreen;