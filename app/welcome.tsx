import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
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
  const themeColors = Colors[colorScheme ?? 'dark'];

  // Hologram Glow Animation
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulseOpacity.value = withRepeat(
      withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const hologramStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: pulseOpacity.value,
    shadowRadius: 20,
    elevation: 10,
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
            <Animated.View style={[hologramStyle, styles.logoWrapper]}>
              <Image 
                source={require('../assets/images/logo.png')} 
                style={styles.logoImage} 
                resizeMode="contain" 
              />
            </Animated.View>
          </View>
          
          <View style={styles.bottomSection}>
            <Animated.Text entering={FadeInDown.duration(800).delay(300).springify()} style={styles.headline}>
              Find your sports{'\n'}buddies nearby.
            </Animated.Text>
            <Animated.Text entering={FadeInDown.duration(800).delay(500).springify()} style={styles.subhead}>
              Connect, train, and dominate together.
            </Animated.Text>
            
            <Animated.View entering={FadeInDown.duration(800).delay(700).springify()}>
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]}
                onPress={() => router.push('/register')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText} adjustsFontSizeToFit numberOfLines={1}>GET STARTED</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.duration(800).delay(900).springify()}>
              <TouchableOpacity 
                style={styles.secondaryBtn}
                onPress={() => router.push('/login')}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText} adjustsFontSizeToFit numberOfLines={1}>I ALREADY HAVE AN ACCOUNT</Text>
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
