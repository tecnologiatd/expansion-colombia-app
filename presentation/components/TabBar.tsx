import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const bottomPadding = Platform.OS === "ios" ? Math.max(insets.bottom, 10) : insets.bottom;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
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
                <View style={styles.iconWrapper}>
                  <View
                    style={[
                      styles.iconBackground,
                      isFocused && styles.focusedIconBackground,
                    ]}
                  >
                    {options.tabBarIcon({
                      focused: false,
                      color: isFocused ? "#FFFFFF" : "#666666",
                      size: 24,
                    })}
                  </View>
                </View>
              )}
              <Text
                style={[styles.tabLabel, isFocused && styles.focusedTabLabel]}
                numberOfLines={1}
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
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconBackground: {
    padding: 8,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        overflow: "hidden",
      },
      android: {
        overflow: "hidden",
        elevation: 0,
      },
    }),
  },
  focusedIconBackground: {
    backgroundColor: "#7B3DFF",
  },
  tabLabel: {
    color: "#666666",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  focusedTabLabel: {
    color: "#FFFFFF",
  },
});

export default TabBar;
