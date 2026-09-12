import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/DesignSystem';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, 
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondaryText,
        tabBarStyle: {
          position: 'absolute',
          bottom: 30,
          left: 60,
          right: 60,
          height: 64,
          backgroundColor: 'rgba(23, 26, 33, 0.95)', // Slightly transparent surface
          borderRadius: 32,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderTopWidth: 1, 
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeContainer : styles.inactiveContainer}>
              <Ionicons name={focused ? "flash" : "flash-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeContainer : styles.inactiveContainer}>
              <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="agenda"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeContainer : styles.inactiveContainer}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeContainer : styles.inactiveContainer}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 87, 47, 0.15)', // Primary with opacity
  },
  inactiveContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
