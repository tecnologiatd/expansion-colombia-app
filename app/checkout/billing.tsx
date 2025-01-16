import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCustomer } from '@/presentation/hooks/useCustomer';
import FormField from '@/presentation/components/FormField';
import CustomButton from '@/presentation/components/CustomButton';
import { BillingAddress } from '@/core/interfaces/customer.interface';

export default function BillingScreen() {
    const { costumerQuery } = useCustomer();
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

    const handleContinue = () => {
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
            Alert.alert('Missing Information', 'Please fill in all required fields');
            return;
        }

        router.push({
            pathname: '/checkout/payment',
            params: { billingData: JSON.stringify(billingData) }
        });
    };

    return (
        <ScrollView className="flex-1 bg-gray-900 p-4">
            <FormField
                title="First Name"
                value={billingData.first_name}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, first_name: text }))}
            />
            <FormField
                title="Last Name"
                value={billingData.last_name}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, last_name: text }))}
            />
            <FormField
                title="Email"
                value={billingData.email}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
            />
            <FormField
                title="Phone"
                value={billingData.phone}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
            />
            <FormField
                title="Address"
                value={billingData.address_1}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, address_1: text }))}
            />
            <FormField
                title="City"
                value={billingData.city}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, city: text }))}
            />
            <FormField
                title="State"
                value={billingData.state}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, state: text }))}
            />
            <FormField
                title="Postal Code"
                value={billingData.postcode}
                onChangeText={(text) => setBillingData(prev => ({ ...prev, postcode: text }))}
            />
            <CustomButton
                title="Continue to Payment"
                onPress={handleContinue}
                className="mt-6"
            />
        </ScrollView>
    );
}