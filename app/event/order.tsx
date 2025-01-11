import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Sample order data
const sampleOrder = {
    id: 38,
    number: "38",
    status: "processing",
    currency: "COP",
    date_created: "2024-12-28T10:40:03",
    total: "1250000",
    payment_method_title: "Credit Card",
    billing: {
        first_name: "Usuario",
        last_name: "prueba",
        email: "prueba.hola@example.com",
        phone: "+57 300 123 4567",
        address_1: "Calle 123 #45-67",
        city: "Bogotá",
        state: "Cundinamarca",
        postcode: "110111",
        country: "Colombia"
    },
    line_items: [
        {
            id: 1,
            name: "Convención Marzo",
            quantity: 1,
            price: "300000",
            subtotal: "300000"
        },
        {
            id: 2,
            name: "Tascas Feria de Cali",
            quantity: 2,
            price: "200000",
            subtotal: "400000"
        }
    ]
};

const OrderDetailScreen = ({ order = sampleOrder }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount, currency = 'COP') => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status) => {
        const statusColors = {
            processing: "text-blue-400",
            completed: "text-green-400",
            pending: "text-yellow-400",
            cancelled: "text-red-400"
        };
        return statusColors[status] || "text-gray-400";
    };

    return (
        <View className="flex-1 bg-[#1a1625]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-800">
                <TouchableOpacity>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">Order #{order.number}</Text>
                <TouchableOpacity>
                    <Ionicons name="share-social-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
                {/* Order Status Card */}
                <View className="m-4 bg-[#2d2639] rounded-xl p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <View>
                            <Text className="text-gray-400 text-sm">Estado</Text>
                            <Text className={`text-lg capitalize ${getStatusColor(order.status)}`}>
                                <Ionicons
                                    name={order.status === 'completed' ? 'checkmark-circle' : 'time-outline'}
                                    size={18}
                                /> {order.status}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-gray-400 text-sm">Fecha</Text>
                            <Text className="text-white text-lg">{formatDate(order.date_created)}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-gray-400 text-sm">Total</Text>
                            <Text className="text-white text-lg">{formatCurrency(order.total)}</Text>
                        </View>
                        <View>
                            <Text className="text-gray-400 text-sm">Metodo de pago</Text>
                            <Text className="text-white text-lg">
                                <Ionicons name="card-outline" size={18} /> {order.payment_method_title}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Items */}
                <View className="m-4 bg-[#2d2639] rounded-xl p-4">
                    <Text className="text-white text-lg mb-3">Pedidos</Text>
                    {order.line_items.map((item) => (
                        <View key={item.id} className="flex-row justify-between items-center py-2 border-b border-gray-700">
                            <View className="flex-1">
                                <Text className="text-white">{item.name}</Text>
                                <Text className="text-gray-400">Cantidad: {item.quantity}</Text>
                            </View>
                            <Text className="text-white">{formatCurrency(item.subtotal)}</Text>
                        </View>
                    ))}
                </View>

                <View className="m-4 bg-[#2d2639] rounded-xl p-4">
                    <Text className="text-white text-lg mb-3">
                        <Ionicons name="person-outline" size={18} /> Facturación
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
                <View className="m-4 space-y-3">
                    <TouchableOpacity
                        className="bg-[#6c2bd9] p-4 rounded-xl flex-row justify-center items-center space-x-2"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="document-text-outline" size={20} color="white" />
                        <Text className="text-white text-center font-semibold text-lg">
                            Descargar Recibo
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="border border-[#6c2bd9] p-4 rounded-xl flex-row justify-center items-center space-x-2"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chatbox-outline" size={20} color="white" />
                        <Text className="text-white text-center font-semibold text-lg">
                            Soporte
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

export default OrderDetailScreen;