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

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'dark'];

  // Floating Logo Animation
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.container}>
        {/* Glowing Mesh Background */}
        <Animated.View style={[styles.glowOrb, { top: -100, left: -100 }]} entering={FadeIn.duration(1500)}>
          <LinearGradient
            colors={['rgba(255, 90, 42, 0.25)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
        <Animated.View style={[styles.glowOrb, { bottom: -100, right: -100 }]} entering={FadeIn.duration(1500).delay(500)}>
          <LinearGradient
            colors={['rgba(255, 90, 42, 0.15)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <SafeAreaView style={styles.content}>
          <View style={styles.brandContainer}>
            <Animated.View style={floatingStyle}>
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
                <Text style={styles.primaryBtnText}>GET STARTED</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.duration(800).delay(900).springify()}>
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
  glowOrb: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    zIndex: 0,
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
  logoImage: {
    width: width * 0.7,
    height: width * 0.7,
  },
  bottomSection: {
    width: '100%',
  },
  headline: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 40,
    color: '#FFFFFF',
    lineHeight: 48,
    marginBottom: 12,
  },
  subhead: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 40,
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
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
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
