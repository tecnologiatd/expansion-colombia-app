import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "blue", headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Eventos",
          headerTitle: "sdfa",
          headerTintColor: "white",
          headerStyle: {
            backgroundColor: "#F9B233",
          },
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="ticket" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrito",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="shopping-cart" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
