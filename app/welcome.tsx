import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image , useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  FadeInDown,
  FadeIn
} from 'react-native-reanimated';

import { Typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  // Hologram Glow Animation & Floating
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Smooth and dynamic breathing animation using bezier
    pulseScale.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0.4, { duration: 2000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      -1,
      true
    );
    // Logo should not move based on user feedback
    floatY.value = 0;
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value * 1.15 }],
    opacity: pulseOpacity.value * 2.5,
    position: 'absolute',
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.container}>
        {/* Smooth Full Screen Background Gradient */}
        <LinearGradient
          colors={['#2A1108', '#0B0D12']}
          locations={[0, 0.6]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.content}>
          <View style={styles.brandContainer}>
            <Animated.Image 
              source={require('../assets/images/logo.png')} 
              style={[styles.logoImage, glowStyle, { tintColor: themeColors.primary }]} 
              blurRadius={25}
              resizeMode="contain" 
            />
            <Animated.View style={[floatStyle, styles.logoWrapper]}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
            </Animated.View>
          </View>
          
          <View style={styles.bottomSection}>
            <Animated.Text entering={FadeInDown.duration(800).delay(200)} style={styles.headline}>
              Find your sports{'\n'}buddies nearby.
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(800).delay(400)} style={styles.subhead}>
              Connect, train, and dominate together.
            </Animated.Text>
            
            <Animated.View entering={FadeInDown.duration(800).delay(600)}>
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]}
                onPress={() => router.push('/register')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>GET STARTED</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.duration(800).delay(800)}>
              <TouchableOpacity 
                style={styles.secondaryBtn}
                onPress={() => router.push('/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>I ALREADY HAVE AN ACCOUNT</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D12',
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
    zIndex: 1,
  },
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    borderRadius: width * 0.35,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: width * 0.65,
    height: width * 0.65,
  },
  bottomSection: {
    width: '100%',
  },
  headline: {
    fontFamily: Typography.fontHeading,
    fontSize: 36,
    color: '#FFFFFF',
    lineHeight: 46,
    marginBottom: 12,
  },
  subhead: {
    fontFamily: Typography.fontRegular,
    fontSize: 15,
    color: '#D0D0D0',
    marginBottom: 40,
    lineHeight: 22,
  },
  primaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
