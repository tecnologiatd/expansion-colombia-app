import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PasswordValidationRuleProps {
    isValid: boolean;
    text: string;
}

const ValidationRule = ({ isValid, text }: PasswordValidationRuleProps) => (
    <View className="flex-row items-center space-x-2 mb-1">
        <Ionicons
            name={isValid ? "checkmark-circle" : "close-circle"}
            size={16}
            color={isValid ? "#10B981" : "#EF4444"}
        />
        <Text className={`${isValid ? "text-green-500" : "text-red-500"}`}>
            {text}
        </Text>
    </View>
);

interface PasswordValidationProps {
    password: string;
}

const PasswordValidation = ({ password }: PasswordValidationProps) => {
    const validations = {
        minLength: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    return (
        <View className="mt-2 mb-4 p-3 bg-gray-800 rounded-lg">
            <Text className="text-white text-sm mb-2">La contraseña debe contener:</Text>
            <ValidationRule
                isValid={validations.minLength}
                text="Mínimo 8 caracteres"
            />
            <ValidationRule
                isValid={validations.hasUpper}
                text="Al menos una mayúscula"
            />
            <ValidationRule
                isValid={validations.hasLower}
                text="Al menos una minúscula"
            />
            <ValidationRule
                isValid={validations.hasNumber}
                text="Al menos un número"
            />
            <ValidationRule
                isValid={validations.hasSpecial}
                text="Al menos un caracter especial"
            />
        </View>
    );
};

export default PasswordValidation;