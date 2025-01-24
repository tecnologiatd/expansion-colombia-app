import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useCustomer } from '@/presentation/hooks/useCustomer';
import { useUpdateCustomer } from '@/presentation/hooks/useUpdateCustomer';
import FormField from '@/presentation/components/FormField';
import CustomButton from '@/presentation/components/CustomButton';
import { BillingAddress } from '@/core/interfaces/customer.interface';
import { Ionicons } from '@expo/vector-icons';

export default function BillingScreen() {
    const { costumerQuery } = useCustomer();
    const { updateCustomerMutation } = useUpdateCustomer();
    const [billingData, setBillingData] = useState<BillingAddress>({
        first_name: '',
        last_name: '',
        company: '',
        address_1: '',
        address_2: '',
        city: '',
        postcode: '',
        country: 'CO',
        state: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (costumerQuery.data) {
            setBillingData(prev => ({
                ...prev,
                ...costumerQuery.data.billing,
                email: costumerQuery.data.email || prev.email // Use customer's email as default
            }));
        }
    }, [costumerQuery.data]);

    const handleContinue = async () => {
        const requiredFields = [
            'first_name',
            'last_name',
            'address_1',
            'city',
            'state',
            'email',
            'phone'
        ];

        const missingFields = requiredFields.filter(
            field => !billingData[field] || billingData[field].trim() === ''
        );

        if (missingFields.length > 0) {
            Alert.alert('Faltan datos', 'Por favor complete todos los campos requeridos');
            return;
        }

        try {
            await updateCustomerMutation.mutateAsync({
                billing: billingData
            });

            router.push({
                pathname: '/checkout/payment',
                params: { billingData: JSON.stringify(billingData) }
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la información de facturación');
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-900">
            {/* Header Section */}
            <View className="p-6 bg-gray-800 rounded-b-3xl shadow-lg mb-6">
                <Text className="text-white text-2xl font-bold mb-2">
                    Información de Facturación
                </Text>
                <Text className="text-gray-400">
                    Complete los detalles para continuar con su compra
                </Text>
            </View>

            <View className="px-6">
                {/* Personal Information Section */}
                <View className="mb-8">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="person-circle-outline" size={24} color="#7B3DFF" />
                        <Text className="text-white text-lg font-bold ml-2">
                            Información Personal
                        </Text>
                    </View>
                    <FormField
                        title="Nombres"
                        value={billingData.first_name}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, first_name: text }))}
                        placeholder="Ingrese sus nombres"
                    />
                    <FormField
                        title="Apellidos"
                        value={billingData.last_name}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, last_name: text }))}
                        placeholder="Ingrese sus apellidos"
                    />
                </View>

                {/* Contact Information Section */}
                <View className="mb-8">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="call-outline" size={24} color="#7B3DFF" />
                        <Text className="text-white text-lg font-bold ml-2">
                            Información de Contacto
                        </Text>
                    </View>
                    <FormField
                        title="Correo electrónico"
                        value={billingData.email}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, email: text }))}
                        keyboardType="email-address"
                        placeholder="correo@ejemplo.com"
                    />
                    <FormField
                        title="Teléfono"
                        value={billingData.phone}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, phone: text }))}
                        keyboardType="phone-pad"
                        placeholder="300 123 4567"
                    />
                </View>

                {/* Address Information Section */}
                <View className="mb-8">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="location-outline" size={24} color="#7B3DFF" />
                        <Text className="text-white text-lg font-bold ml-2">
                            Dirección de Facturación
                        </Text>
                    </View>
                    <FormField
                        title="Dirección"
                        value={billingData.address_1}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, address_1: text }))}
                        placeholder="Calle / Carrera / Avenida"
                    />
                    <FormField
                        title="Ciudad"
                        value={billingData.city}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, city: text }))}
                        placeholder="Ciudad"
                    />
                    <FormField
                        title="Departamento"
                        value={billingData.state}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, state: text }))}
                        placeholder="Departamento"
                    />
                    <FormField
                        title="Código postal"
                        value={billingData.postcode}
                        onChangeText={(text) => setBillingData(prev => ({ ...prev, postcode: text }))}
                        placeholder="Código postal (opcional)"
                        keyboardType="numeric"
                    />
                </View>

                {/* Submit Button */}
                <View className="mb-8">
                    <CustomButton
                        title={updateCustomerMutation.isPending ? "Procesando..." : "Continuar al pago"}
                        onPress={handleContinue}
                        className="bg-purple-500"
                        disabled={updateCustomerMutation.isPending}
                    />
                </View>
            </View>
        </ScrollView>
    );
}