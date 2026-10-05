import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CONTENT_MAX_WIDTH, Theme } from "@/presentation/theme/Colors";

interface TabItemProps {
  label: string;
  isFocused: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
  renderIcon?: (color: string) => React.ReactNode;
}

const TabItem = ({
  label,
  isFocused,
  onPress,
  accessibilityLabel,
  testID,
  renderIcon,
}: TabItemProps) => {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={styles.tabBarItem}
    >
      {renderIcon && (
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.iconPill, pillStyle]} />
          {renderIcon(isFocused ? Theme.text : Theme.muted)}
        </View>
      )}
      <Text
        style={[styles.tabLabel, isFocused && styles.focusedTabLabel]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const TabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
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

          const tabBarIcon = options.tabBarIcon;

          return (
            <TabItem
              key={route.key}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              renderIcon={
                tabBarIcon
                  ? (color) =>
                      tabBarIcon({ focused: isFocused, color, size: 22 })
                  : undefined
              }
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.line,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabBarItem: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    width: 56,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 16,
    backgroundColor: Theme.accent,
  },
  tabLabel: {
    color: Theme.muted,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  focusedTabLabel: {
    color: Theme.text,
    fontWeight: "600",
  },
});

export default TabBar;
