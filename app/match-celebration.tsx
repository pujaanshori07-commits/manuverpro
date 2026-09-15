import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = Math.min(SCREEN_WIDTH * 0.36, 140);
const AVATAR_OVERLAP = 22; // Overlap distance in center

export default function MatchCelebrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    matchName?: string;
    matchPhotoUrl?: string;
    currentUserPhotoUrl?: string;
    sportName?: string;
    matchId?: string;
  }>();

  // Safely extract params with robust fallbacks
  const matchName = (params.matchName as string) || 'Partner Baru';
  const sportName = (params.sportName as string) || 'Olahraga';
  const matchId = (params.matchId as string) || '';
  const matchPhotoUrl =
    (params.matchPhotoUrl as string) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80';
  const currentUserPhotoUrl =
    (params.currentUserPhotoUrl as string) ||
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80';

  // --- Reanimated Shared Values ---
  // Avatar Positions
  const leftAvatarTranslateX = useSharedValue(-SCREEN_WIDTH * 0.75);
  const rightAvatarTranslateX = useSharedValue(SCREEN_WIDTH * 0.75);

  // Avatar Scales & Rotations (Adds slight dynamic tilt during collision)
  const leftAvatarRotate = useSharedValue(-12);
  const rightAvatarRotate = useSharedValue(12);

  // Glow & Center Sparks
  const glowScale = useSharedValue(0.2);
  const glowOpacity = useSharedValue(0);
  const sparkScale = useSharedValue(0);

  // Content & Buttons (Delayed Fade-ins)
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const subtitleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(30);

  const triggerImpactHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  useEffect(() => {
    // 1. Initial soft light tap on mount
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Target X coordinates for collision with overlapping offset
    const targetLeftX = -(AVATAR_SIZE / 2 - AVATAR_OVERLAP);
    const targetRightX = AVATAR_SIZE / 2 - AVATAR_OVERLAP;

    const springConfig = {
      damping: 12,
      stiffness: 110,
      mass: 0.9,
    };

    // 2. Avatar Collision Animation
    leftAvatarTranslateX.value = withSpring(targetLeftX, springConfig);
    rightAvatarTranslateX.value = withSpring(targetRightX, springConfig);
    leftAvatarRotate.value = withSpring(-4, springConfig);
    rightAvatarRotate.value = withSpring(4, springConfig);

    // 3. Trigger heavy impact haptic exactly when they collide (~280ms)
    const hapticTimer = setTimeout(() => {
      triggerImpactHaptic();
    }, 280);

    // 4. Glow behind avatars expands on collision
    glowScale.value = withDelay(
      220,
      withSpring(1, { damping: 9, stiffness: 90 })
    );
    glowOpacity.value = withDelay(
      180,
      withTiming(0.85, { duration: 400 })
    );

    // 5. Center energy spark pops out
    sparkScale.value = withDelay(
      320,
      withSpring(1, { damping: 8, stiffness: 140 })
    );

    // 6. Header drops down
    headerOpacity.value = withDelay(
      260,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) })
    );
    headerTranslateY.value = withDelay(
      260,
      withSpring(0, { damping: 14, stiffness: 120 })
    );

    // 7. Subtitle reveals
    subtitleOpacity.value = withDelay(
      420,
      withTiming(1, { duration: 450 })
    );

    // 8. Action Buttons slide up into place
    buttonsOpacity.value = withDelay(
      560,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) })
    );
    buttonsTranslateY.value = withDelay(
      560,
      withSpring(0, { damping: 15, stiffness: 120 })
    );

    return () => {
      clearTimeout(hapticTimer);
    };
  }, []);

  // --- Animated Styles ---
  const leftAvatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: leftAvatarTranslateX.value },
      { rotate: `${leftAvatarRotate.value}deg` },
    ],
  }));

  const rightAvatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rightAvatarTranslateX.value },
      { rotate: `${rightAvatarRotate.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const sparkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkScale.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  // --- Handlers ---
  const handleAjakMain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (matchId) {
      router.replace({
        pathname: '/chat/[id]',
        params: { id: matchId, openAjakMain: 'true' },
      });
    } else {
      router.back();
    }
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['rgba(11, 13, 19, 0.98)', '#0B0D13', '#120D0B']}
        locations={[0, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Sport Ambient Flare (Top Right & Bottom Left) */}
      <View style={styles.ambientFlareTop} />
      <View style={styles.ambientFlareBottom} />

      <View
        style={[
          styles.contentWrapper,
          {
            paddingTop: Math.max(insets.top + 20, 48),
            paddingBottom: Math.max(insets.bottom + 16, 32),
          },
        ]}
      >
        {/* Top Dismiss Button */}
        <View style={styles.topBar}>
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color="#8E929E" />
          </Pressable>
        </View>

        {/* Section 1: Typography (Headline & Subtitle) */}
        <View style={styles.headerContainer}>
          <Animated.View style={[styles.sportTagBadge, subtitleAnimatedStyle]}>
            <Ionicons name="fitness-outline" size={14} color="#FF5A2A" />
            <Text style={styles.sportTagText}>{sportName.toUpperCase()}</Text>
          </Animated.View>

          <Animated.Text style={[styles.headlineText, headerAnimatedStyle]}>
            MANUVER BERHASIL!
          </Animated.Text>

          <Animated.Text style={[styles.subtitleText, subtitleAnimatedStyle]}>
            Kamu dan <Text style={styles.highlightText}>{matchName}</Text> sama-sama suka{' '}
            <Text style={styles.highlightText}>{sportName}</Text>.
          </Animated.Text>
        </View>

        {/* Section 2: Core Overlapping Avatars with Glow & Impact Spark */}
        <View style={styles.avatarStageContainer}>
          {/* Radial Glow Layer */}
          <Animated.View style={[styles.avatarGlowRing, glowAnimatedStyle]}>
            <LinearGradient
              colors={['rgba(255, 90, 42, 0.45)', 'rgba(255, 90, 42, 0.05)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Left Avatar (Current User) */}
          <Animated.View
            style={[
              styles.avatarFrame,
              styles.leftAvatarFrame,
              leftAvatarAnimatedStyle,
            ]}
          >
            <Image
              source={{ uri: currentUserPhotoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            <View style={styles.avatarLabelChip}>
              <Text style={styles.avatarLabelText}>Kamu</Text>
            </View>
          </Animated.View>

          {/* Right Avatar (Match Partner) */}
          <Animated.View
            style={[
              styles.avatarFrame,
              styles.rightAvatarFrame,
              rightAvatarAnimatedStyle,
            ]}
          >
            <Image
              source={{ uri: matchPhotoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            <View style={[styles.avatarLabelChip, styles.matchLabelChip]}>
              <Text style={styles.avatarLabelText}>{matchName.split(' ')[0]}</Text>
            </View>
          </Animated.View>

          {/* Center Impact Energy Spark Badge */}
          <Animated.View style={[styles.sparkBadge, sparkAnimatedStyle]}>
            <LinearGradient
              colors={['#FF6B35', '#FF5A2A']}
              style={styles.sparkBadgeGradient}
            >
              <Ionicons name="flash" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Section 3: Bottom Sticky Action Buttons */}
        <Animated.View style={[styles.actionButtonsContainer, buttonsAnimatedStyle]}>
          {/* Primary CTA: Ajak Main Sekarang */}
          <Pressable
            onPress={handleAjakMain}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF5A2A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ajak Main Sekarang</Text>
            </LinearGradient>
          </Pressable>

          {/* Secondary CTA: Nanti Saja */}
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Nanti Saja</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D13',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ambient Glows
  ambientFlareTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255, 90, 42, 0.12)',
  },
  ambientFlareBottom: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 90, 42, 0.08)',
  },

  // Header & Copy
  headerContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  sportTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 90, 42, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 42, 0.28)',
    marginBottom: 14,
  },
  sportTagText: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#FF5A2A',
  },
  headlineText: {
    fontSize: 30,
    letterSpacing: 0.6,
    color: '#FF5A2A',
    textAlign: 'center',
    fontWeight: Platform.OS === 'ios' ? '900' : 'bold',
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 90, 42, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 18,
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#C6C8D1',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  highlightText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Stage & Avatars
  avatarStageContainer: {
    height: AVATAR_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: AVATAR_SIZE * 2.2,
    height: AVATAR_SIZE * 2.2,
    borderRadius: (AVATAR_SIZE * 2.2) / 2,
    overflow: 'hidden',
  },
  avatarFrame: {
    position: 'absolute',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3.5,
    backgroundColor: '#1A1D24',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  leftAvatarFrame: {
    borderColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 1,
  },
  rightAvatarFrame: {
    borderColor: '#FF5A2A',
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarLabelChip: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    backgroundColor: '#1E222B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  matchLabelChip: {
    backgroundColor: 'rgba(255, 90, 42, 0.22)',
    borderColor: 'rgba(255, 90, 42, 0.45)',
  },
  avatarLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Center Spark
  sparkBadge: {
    position: 'absolute',
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0B0D13',
    padding: 2.5,
    shadowColor: '#FF5A2A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  sparkBadgeGradient: {
    flex: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Buttons
  actionButtonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  primaryButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF5A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 28,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A0A4B0',
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
