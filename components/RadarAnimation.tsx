import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing, 
  interpolate 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/DesignSystem';

export default function RadarAnimation() {
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);

  useEffect(() => {
    // Gelombang pertama
    progress1.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    
    // Gelombang kedua (delay 1 detik)
    const timer = setTimeout(() => {
      progress2.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress1.value, [0, 1], [0.5, 3]) }],
    opacity: interpolate(progress1.value, [0, 0.8, 1], [0.6, 0, 0]),
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress2.value, [0, 1], [0.5, 3]) }],
    opacity: interpolate(progress2.value, [0, 0.8, 1], [0.6, 0, 0]),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, animatedStyle1]} />
      <Animated.View style={[styles.circle, animatedStyle2]} />
      <View style={styles.iconContainer}>
        <Ionicons name="flame" size={50} color={COLORS.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 87, 47, 0.4)', // Primary color with opacity
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});
