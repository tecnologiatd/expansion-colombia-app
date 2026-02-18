import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EventCard from "@/presentation/components/EventCard";
import { useProducts } from "@/presentation/hooks/useProducts";
import React, { useEffect, useState, useMemo } from "react";
import debounce from "lodash.debounce";
import * as SecureStore from "expo-secure-store";
import { type Product } from "@/core/interfaces/product.interface";

export default function Tab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const { productsQuery } = useProducts();

  // Debounced search handler
  const onSearch = useMemo(
    () =>
      debounce((text: string) => {
        setSearchTerm(text);
      }, 500),
    [],
  );

  useEffect(() => {
    return () => {
      onSearch.cancel();
    };
  }, [onSearch]);

  // Filter products by search and category
  useEffect(() => {
    if (productsQuery.data) {
      let products = productsQuery.data;

      // if (searchTerm) {
      //   products = products.filter((product) =>
      //     product.name.toLowerCase().includes(searchTerm.toLowerCase()),
      //   );
      // }
      //
      // if (selectedCategory) {
      //   products = products.filter(
      //     (product) => product.category === selectedCategory,
      //   );
      // }

      setFilteredProducts(products);
    }
  }, [productsQuery.data, searchTerm]);

  // Handle refresh
  const onRefresh = () => {
    productsQuery.refetch();
  };

  const toke = SecureStore.getItem("token");
  console.log("HOME", toke);

  // Loading state
  if (productsQuery.isLoading) {
    return (
      <View className="justify-center items-center flex-1">
        <ActivityIndicator color="purple" size={40} />
      </View>
    );
  }

  // Error state
  if (productsQuery.isError) {
    return (
      <View>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={productsQuery.isFetching}
              onRefresh={onRefresh}
            />
          }
        >
          <View className="justify-center items-center flex-1">
            <Text>
              Hay un error, intente de nuevo
            </Text>
            <TouchableOpacity
              className="bg-red-600 rounded-lg mt-4 px-4 py-2"
              onPress={onRefresh}
            >
              <Text className="text-white">Reintentar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // No data state
  if (!filteredProducts || filteredProducts.length === 0) {
    return (
      <View className="justify-center items-center flex-1">
        <Text className="text-white">No hay eventos disponibles</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={productsQuery.isFetching}
            onRefresh={onRefresh}
          />
        }
      >
        <View className="mt-8 mb-4 mx-4">
          <Text className="text-3xl font-bold text-white">
            Eventos en <Text className="text-secondary">Colombia</Text>
          </Text>
        </View>

        {/*/!* Search Bar *!/*/}
        {/*<View className="mx-4 mb-8 flex-row justify-between items-center">*/}
        {/*  <View className="flex-1 p-2 bg-gray-800 rounded-lg flex-row items-center">*/}
        {/*    <Entypo name="magnifying-glass" size={24} color="gray" />*/}
        {/*    <TextInput*/}
        {/*      placeholder="Search any event..."*/}
        {/*      placeholderTextColor="gray"*/}
        {/*      className="flex-1 text-white ml-2"*/}
        {/*      onChangeText={onSearch}*/}
        {/*    />*/}
        {/*  </View>*/}
        {/*  <TouchableOpacity className="bg-gray-800 rounded-lg p-2 ml-4">*/}
        {/*    <Feather name="filter" size={24} color="white" />*/}
        {/*  </TouchableOpacity>*/}
        {/*</View>*/}

        {/*/!* Categories *!/*/}
        {/*<View className="mx-4 mb-8 flex-row justify-between">*/}
        {/*  {categories.map((category, idx) => (*/}
        {/*    <TouchableOpacity*/}
        {/*      key={idx}*/}
        {/*      className={`py-3 px-4 flex-1 mx-1 rounded-lg ${*/}
        {/*        selectedCategory === category ? "bg-secondary" : "bg-gray-800"*/}
        {/*      }`}*/}
        {/*      onPress={() =>*/}
        {/*        setSelectedCategory(*/}
        {/*          selectedCategory === category ? null : category,*/}
        {/*        )*/}
        {/*      }*/}
        {/*    >*/}
        {/*      <Text className="text-white font-medium">{category}</Text>*/}
        {/*    </TouchableOpacity>*/}
        {/*  ))}*/}
        {/*</View>*/}

        {/* Event Cards */}
        {filteredProducts.map((item) => (
          <EventCard product={item} key={item.id} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
