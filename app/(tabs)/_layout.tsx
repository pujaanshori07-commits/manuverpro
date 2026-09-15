import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants/theme';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { registerForPushNotifications, savePushToken } from '../../lib/pushNotifications';
export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const tabHeight = Platform.OS === 'ios' ? 62 + insets.bottom : 66;
  const paddingBottom = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 10;

  useEffect(() => {
    async function setupPush() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const token = await registerForPushNotifications();
      if (token) {
        await savePushToken(session.user.id, token);
      }
    }
    setupPush();
  }, []);

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
          elevation: 0,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      {/* 1. Discover */}
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

      {/* 2. Explore */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 3. Matches & Chat */}
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

      {/* 4. Profile */}
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

      {/* Sessions hidden from bottom tabs */}
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
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
    fontWeight: '500',
  },
});
