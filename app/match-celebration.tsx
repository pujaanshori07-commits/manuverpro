import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVATAR_SIZE = 130;

// Configurable particle count (kept low for performance-friendly rendering)
const PARTICLE_COUNT = 24;
const PARTICLE_COLORS = [
  Colors.primary,
  '#FF9500', // Gold/orange
  '#34C759', // Green like
  '#FFFFFF', // White glint
  '#FF7347',
];

interface ParticleData {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  isSquare: boolean;
  delay: number;
}

// Pre-computed deterministic coordinates so we don't recalculate on every render
const PARTICLES: ParticleData[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const angle = (i / PARTICLE_COUNT) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
  const distance = 90 + Math.random() * 110;
  return {
    id: i,
    angle,
    distance,
    size: 6 + Math.floor(Math.random() * 6),
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    isSquare: i % 2 === 0,
    delay: Math.floor(Math.random() * 120),
  };
});

// Single native particle component powered by Reanimated
function Particle({ data, disabled }: { data: ParticleData; disabled: boolean }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (disabled) return;
    progress.value = withDelay(
      data.delay,
      withTiming(1, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [disabled]);

  const animatedStyle = useAnimatedStyle(() => {
    if (disabled) {
      return { opacity: 0 };
    }
    const currentDistance = data.distance * progress.value;
    const x = Math.cos(data.angle) * currentDistance;
    const y = Math.sin(data.angle) * currentDistance + progress.value * 25; // subtle gravity pull
    const scale = (1 - progress.value * 0.6);
    const opacity = 1 - Math.pow(progress.value, 1.8);
    const rotate = `${progress.value * 280}deg`;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        { rotate },
      ],
      opacity,
    };
  });

  if (disabled) return null;

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: data.size,
          height: data.isSquare ? data.size : data.size * 1.5,
          backgroundColor: data.color,
          borderRadius: data.isSquare ? data.size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function MatchCelebrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [reduceMotion, setReduceMotion] = React.useState(false);

  // Check if system has reduced motion or low performance mode enabled
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  const partnerName = (params.name as string) || 'Dinda';
  const partnerAvatar =
    (params.partnerAvatar as string) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
  const myAvatar =
    (params.myAvatar as string) ||
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80';
  const chatId = (params.chatId as string) || 'chat-new';

  const handleSendMessage = () => {
    router.replace({
      pathname: '/chat/[id]',
      params: { id: chatId, name: partnerName, avatar: partnerAvatar },
    });
  };

  const handleKeepSwiping = () => {
    router.replace('/(tabs)/');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Cinematic Dark Stadium Background */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            'rgba(9, 10, 13, 0.75)',
            'rgba(9, 10, 13, 0.90)',
            'rgba(9, 10, 13, 0.98)',
            Colors.background,
          ]}
          locations={[0.0, 0.45, 0.8, 1.0]}
          style={styles.gradientOverlay}
        >
          {/* Top Close Button */}
          <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleKeepSwiping}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Center Content */}
          <View style={styles.centerSection}>
            {/* Athletic Match Badge */}
            <View style={styles.matchBadge}>
              <Ionicons name="flame" size={14} color={Colors.primary} />
              <Text style={styles.matchBadgeText}>SPORTS SYNC CONFIRMED</Text>
            </View>

            {/* Typography */}
            <Text style={styles.celebrationTitle}>
              IT'S A <Text style={styles.titleHighlight}>MATCH!</Text>
            </Text>
            <Text style={styles.celebrationSubtitle}>
              Kamu dan <Text style={styles.boldPartner}>{partnerName}</Text> sama-sama ingin olahraga bareng!
            </Text>

            {/* Overlapping Interlocking Avatars with Confetti Anchor */}
            <View style={styles.avatarsWrapper}>
              {/* Confetti / Particle Burst Center */}
              <View style={styles.confettiCenterAnchor} pointerEvents="none">
                {PARTICLES.map((particle) => (
                  <Particle
                    key={particle.id}
                    data={particle}
                    disabled={reduceMotion}
                  />
                ))}
              </View>

              {/* Left Avatar (You) */}
              <View style={[styles.avatarGlowRing, styles.myAvatarPosition]}>
                <Image source={{ uri: myAvatar }} style={styles.avatarImage} />
                <View style={styles.avatarSportBadge}>
                  <Ionicons name="fitness" size={12} color={Colors.white} />
                </View>
              </View>

              {/* Intersecting Flame Bubble in the center */}
              <View style={styles.centerGlowBubble}>
                <LinearGradient
                  colors={[Colors.primary, '#E6441D']}
                  style={styles.flameIconCircle}
                >
                  <Ionicons name="flash" size={20} color={Colors.white} />
                </LinearGradient>
              </View>

              {/* Right Avatar (Partner) */}
              <View style={[styles.avatarGlowRing, styles.partnerAvatarPosition]}>
                <Image source={{ uri: partnerAvatar }} style={styles.avatarImage} />
                <View style={[styles.avatarSportBadge, styles.partnerSportBadge]}>
                  <Ionicons name="tennisball" size={12} color={Colors.white} />
                </View>
              </View>
            </View>

            {/* Glassmorphic Shared Interests Pill */}
            <View style={styles.sharedInterestCard}>
              <Text style={styles.sharedLabel}>SHARED INTERESTS</Text>
              <View style={styles.sharedPillsRow}>
                <View style={styles.glassPill}>
                  <Ionicons name="walk" size={13} color={Colors.primary} />
                  <Text style={styles.glassPillText}>Running</Text>
                </View>
                <View style={styles.glassPill}>
                  <Ionicons name="tennisball" size={13} color={Colors.primary} />
                  <Text style={styles.glassPillText}>Badminton</Text>
                </View>
                <View style={styles.glassPill}>
                  <Ionicons name="barbell" size={13} color={Colors.primary} />
                  <Text style={styles.glassPillText}>Gym Jaksel</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom CTA Buttons */}
          <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.88}
              onPress={handleSendMessage}
            >
              <LinearGradient
                colors={[Colors.primary, '#E6441D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Kirim Pesan Sekarang</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Ghost Button */}
            <TouchableOpacity
              style={styles.ghostButton}
              activeOpacity={0.7}
              onPress={handleKeepSwiping}
            >
              <Text style={styles.ghostButtonText}>Nanti Saja (Keep Swiping)</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  topBar: {
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerSection: {
    alignItems: 'center',
    gap: 14,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 87, 47, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 47, 0.35)',
  },
  matchBadgeText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  celebrationTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 34,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  titleHighlight: {
    color: Colors.primary,
    fontFamily: Typography.fontDisplay,
  },
  celebrationSubtitle: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 20,
  },
  boldPartner: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontSemiBold,
  },
  avatarsWrapper: {
    width: SCREEN_WIDTH * 0.85,
    height: AVATAR_SIZE + 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  confettiCenterAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
  },
  avatarGlowRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3.5,
    borderColor: Colors.primary,
    padding: 3,
    backgroundColor: Colors.surface,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    position: 'absolute',
  },
  myAvatarPosition: {
    left: 20,
    zIndex: 1,
  },
  partnerAvatarPosition: {
    right: 20,
    zIndex: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarSportBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  partnerSportBadge: {
    backgroundColor: Colors.success,
  },
  centerGlowBubble: {
    position: 'absolute',
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  sharedInterestCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(23, 26, 33, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    marginTop: 6,
  },
  sharedLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  sharedPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  glassPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  bottomActions: {
    gap: 12,
    paddingHorizontal: Spacing.sm,
  },
  primaryButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  ghostButtonText: {
    fontFamily: Typography.fontMedium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
