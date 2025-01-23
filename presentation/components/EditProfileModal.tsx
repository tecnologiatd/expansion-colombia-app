import {useState} from "react";
import {Alert, Modal, Text, TextInput, TouchableOpacity, View} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import {useUpdateCustomer} from "@/presentation/hooks/useUpdateCustomer";

const EditProfileModal = ({ visible, onClose, userData, onSave }) => {
    const [editedData, setEditedData] = useState(userData);
    const { updateCustomerMutation } = useUpdateCustomer();
    const [isSaving, setIsSaving] = useState(false);

    const hasNames = userData?.billing?.first_name && userData?.billing?.last_name;

    const handleSave = async () => {
        try {
            setIsSaving(true);

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(editedData.email)) {
                Alert.alert('Error', 'Por favor ingrese un correo electrónico válido');
                return;
            }

            // Format the data before sending
            const updateData = {
                email: editedData.email,
                billing: {
                    ...editedData.billing,
                    email: editedData.email, // Make sure billing email matches
                    country: 'CO', // Set default country if not present
                }
            };

            await updateCustomerMutation.mutateAsync(updateData);
            onSave(editedData);
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'No se pudo actualizar el perfil'
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                <View className="bg-gray-800 rounded-t-3xl p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-bold">Editar Perfil</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-gray-400 mb-2">Nombres</Text>
                            <TextInput
                                className={`bg-gray-700 p-4 rounded-lg text-white ${hasNames ? 'opacity-50' : ''}`}
                                value={editedData.billing.first_name}
                                onChangeText={(text) =>
                                    !hasNames && setEditedData({
                                        ...editedData,
                                        billing: { ...editedData.billing, first_name: text },
                                    })
                                }
                                editable={!hasNames}
                                placeholderTextColor="#666"
                            />
                            {/*{hasNames && (*/}
                            {/*    <Text className="text-gray-400 text-sm mt-1">*/}
                            {/*        Nombre no puede ser modificado*/}
                            {/*    </Text>*/}
                            {/*)}*/}
                        </View>

                        <View>
                            <Text className="text-gray-400 mb-2">Apellidos</Text>
                            <TextInput
                                className={`bg-gray-700 p-4 rounded-lg text-white ${hasNames ? 'opacity-50' : ''}`}
                                value={editedData.billing.last_name}
                                onChangeText={(text) =>
                                    !hasNames && setEditedData({
                                        ...editedData,
                                        billing: { ...editedData.billing, last_name: text },
                                    })
                                }
                                editable={!hasNames}
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-400 mb-2">Correo electrónico</Text>
                            <TextInput
                                className="bg-gray-700 p-4 rounded-lg text-white"
                                value={editedData.email}
                                onChangeText={(text) =>
                                    setEditedData({ ...editedData, email: text })
                                }
                                keyboardType="email-address"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-400 mb-2">Teléfono</Text>
                            <TextInput
                                className="bg-gray-700 p-4 rounded-lg text-white"
                                value={editedData.billing.phone}
                                onChangeText={(text) =>
                                    setEditedData({
                                        ...editedData,
                                        billing: { ...editedData.billing, phone: text },
                                    })
                                }
                                keyboardType="phone-pad"
                                placeholderTextColor="#666"
                            />
                        </View>

                        <TouchableOpacity
                            className={`bg-purple-500 p-4 rounded-lg mt-4 ${isSaving ? 'opacity-50' : ''}`}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            <Text className="text-white text-center font-bold">
                                {isSaving ? 'Guardando...' : 'Guardar cambios'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default EditProfileModal;