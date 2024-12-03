import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform, Pressable, TouchableOpacity
} from 'react-native';
import {
  PlatformPressable
} from '@react-navigation/elements';
import {
  useLinkBuilder
} from '@react-navigation/native';
import {
  BlurView
} from 'expo-blur';

const { width } = Dimensions.get('window');

const TabBar = ({ state, descriptors, navigation }) => {
  const { buildHref } = useLinkBuilder();

  return (
      <View style={styles.container}>
        <BlurView
            intensity={Platform.OS === 'ios' ? 80 : 50}
            style={styles.tabBar}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label =
                options.tabBarLabel !== undefined
                    ? options.tabBarLabel
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

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
                <TouchableOpacity
                    key={route.name}
                    href={buildHref(route.name, route.params)}
                    accessibilityState={isFocused ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    testID={options.tabBarButtonTestID}
                    onPress={onPress}
                    onLongPress={onLongPress}
                    style={[
                      styles.tabBarItem,
                      isFocused && styles.focusedTabItem
                    ]}
                >
                  {options.tabBarIcon && (
                      <View style={[
                        styles.iconContainer,
                        isFocused && styles.focusedIconContainer
                      ]}>
                        {options.tabBarIcon({
                          color: isFocused ? '#FFFFFF' : '#8E8E93',
                          size: 24
                        })}
                      </View>
                  )}
                  <Text
                      style={[
                        styles.tabLabel,
                        isFocused && styles.focusedTabLabel
                      ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,

  },
  focusedTabItem: {
    // Additional styling for focused state can be added here
  },
  iconContainer: {
    padding: 8,
    borderRadius: 15,
  },
  focusedIconContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
  },
  tabLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  focusedTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default TabBar;