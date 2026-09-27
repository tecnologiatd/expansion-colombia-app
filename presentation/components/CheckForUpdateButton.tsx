import React, { useState } from 'react';
import { TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import * as Updates from 'expo-updates';
import { Feather } from '@expo/vector-icons';

export const CheckForUpdateButton = () => {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckForUpdate = async () => {
    if (!Updates.isEnabled) {
      Alert.alert('Actualizaciones', 'No disponible en este entorno (modo desarrollo).');
      return;
    }

    setIsChecking(true);
    try {
      const { isAvailable } = await Updates.checkForUpdateAsync();

      if (!isAvailable) {
        Alert.alert('Actualizaciones', 'Ya tienes la última versión.');
        return;
      }

      await Updates.fetchUpdateAsync();
      Alert.alert(
        'Actualización disponible',
        'Se descargó una nueva versión. ¿Reiniciar la app ahora para aplicarla?',
        [
          { text: 'Después', style: 'cancel' },
          { text: 'Reiniciar', onPress: () => Updates.reloadAsync() },
        ],
      );
    } catch {
      Alert.alert('Actualizaciones', 'No se pudo verificar actualizaciones. Intenta más tarde.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <TouchableOpacity
      className="bg-gray-800 p-4 rounded-lg flex-row justify-between items-center mt-2"
      onPress={handleCheckForUpdate}
      disabled={isChecking}
    >
      <Text className="text-gray-400 font-medium">Buscar actualizaciones</Text>
      {isChecking ? (
        <ActivityIndicator color="#7B3DFF" size="small" />
      ) : (
        <Feather name="refresh-cw" size={18} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
};
