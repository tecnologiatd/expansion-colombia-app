import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import TabBar from "@/presentation/components/TabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7B3DFF",
        headerShown: false,
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="blog"
        options={{
          title: "Noticias",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="newspaper-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrito",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="shopping-cart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Eventos",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="ticket" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={24} name="user" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
