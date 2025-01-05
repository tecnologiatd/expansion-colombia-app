import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Linking from "expo-linking";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label: string =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const href = Linking.createURL(route.name, {
            queryParams: route.params,
          });

          return (
            <TouchableOpacity
              key={route.key}
              href={href}
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={styles.tabBarItem}
            >
              {options.tabBarIcon && (
                <View
                  style={[
                    styles.iconContainer,
                    isFocused && styles.focusedIconContainer,
                  ]}
                >
                  {options.tabBarIcon({
                    focused: false,
                    color: isFocused ? "#FFFFFF" : "#666666",
                    size: 24,
                  })}
                </View>
              )}
              <Text
                style={[styles.tabLabel, isFocused && styles.focusedTabLabel]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#111111",
    borderTopWidth: 1,
    borderTopColor: "#222222",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  focusedIconContainer: {
    backgroundColor: "#7B3DFF",
  },
  tabLabel: {
    color: "#666666",
    fontSize: 12,
    marginTop: 4,
  },
  focusedTabLabel: {
    color: "#FFFFFF",
  },
});

export default TabBar;
