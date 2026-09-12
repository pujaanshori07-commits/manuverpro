import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Tab bar height calculation for Android vs iOS safe area
  const tabHeight = Platform.OS === 'ios' ? 64 + insets.bottom : 68;
  const paddingBottom = Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 10;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopColor: Colors.surfaceBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 8,
          elevation: 0, // Disable Android default shadow to keep sleek dark line
        },
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* 1. Discover Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'flame' : 'flame-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 2. Open Sparing / Sesi Tab */}
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sesi',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 3. Explore / Activity Tab (matching design reference) */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={23}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 3. Matches & Chat Tab */}
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={23}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 4. Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={23}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabBarLabel: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
