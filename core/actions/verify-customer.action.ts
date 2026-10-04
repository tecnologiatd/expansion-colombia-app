import { backendApi } from "@/core/api/wordpress-api";
import { Customer, BillingAddress } from "@/core/interfaces/customer.interface";

export const verifyCustomerBilling = async (
  customerId: string,
): Promise<{
  isComplete: boolean;
  customer: Customer;
}> => {
  try {
    const { data } = await backendApi.get<Customer>(
      `/customer-billing/${customerId}`,
    );

    const requiredFields: (keyof BillingAddress)[] = [
      "first_name",
      "last_name",
      "address_1",
      "city",
      "country",
      "state",
      "email",
      "phone",
    ];

    const isComplete = requiredFields.every(
      (field) => data.billing[field] && data.billing[field].trim() !== "",
    );

    return {
      isComplete,
      customer: data,
    };
  } catch (error) {
    console.error("Error verifying customer billing:", error);
    throw new Error("Failed to verify customer billing");
  }
};
