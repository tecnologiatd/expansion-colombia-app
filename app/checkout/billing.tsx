import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCustomer } from '@/presentation/hooks/useCustomer';
import { useUpdateCustomer } from '@/presentation/hooks/useUpdateCustomer';
import FormField from '@/presentation/components/FormField';
import CustomButton from '@/presentation/components/CustomButton';
import { BillingAddress } from '@/core/interfaces/customer.interface';

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
        country: '',
        state: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (costumerQuery.data?.billing) {
            setBillingData(costumerQuery.data.billing);
        }
    }, [costumerQuery.data]);

    const handleContinue = async () => {
        const requiredFields = [
            'first_name',
            'last_name',
            'address_1',
            'city',
            'country',
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
            // Update customer billing information
            await updateCustomerMutation.mutateAsync({
                billing: billingData
            });

            // Navigate to payment screen
            router.push({
                pathname: '/checkout/payment',
                params: { billingData: JSON.stringify(billingData) }
            });
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la información de facturación');
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <FormField
                title="Nombres"
                value={billingData.first_name}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, first_name: text }))}
            />
            <FormField
                title="Apellidos"
                value={billingData.last_name}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, last_name: text }))}
            />
            <FormField
                title="Correo electrónico"
                value={billingData.email}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
            />
            <FormField
                title="Teléfono"
                value={billingData.phone}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
            />
            <FormField
                title="Dirección"
                value={billingData.address_1}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, address_1: text }))}
            />
            <FormField
                title="Ciudad"
                value={billingData.city}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, city: text }))}
            />
            <FormField
                title="Departamento"
                value={billingData.state}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, state: text }))}
            />
            <FormField
                title="Código postal"
                value={billingData.postcode}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, postcode: text }))}
            />
            <CustomButton
                title="Continuar al pago"
                onPress={handleContinue}
                className="mt-6"
            />
        </ScrollView>
    );
}