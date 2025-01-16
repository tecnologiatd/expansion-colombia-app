import { backendApi } from "@/core/api/wordpress-api";
import { Customer } from "@/core/interfaces/customer.interface";

export const verifyCustomerBilling = async (customerId: string): Promise<{
    isComplete: boolean;
    customer: Customer;
}> => {
    try {
        const { data } = await backendApi.get<Customer>(`/customer-billing/${customerId}`);

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

        // @ts-ignore
        const isComplete = requiredFields.every(field =>
            data.billing[field] && data.billing[field].trim() !== ''
        );

        return {
            isComplete,
            customer: data
        };
    } catch (error) {
        console.error('Error verifying customer billing:', error);
        throw new Error('Failed to verify customer billing');
    }
};