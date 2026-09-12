import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';

import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import MultiPhotoCard from '../../components/MultiPhotoCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.74;

interface Profile {
  id: string;
  nama: string;
  umur?: number;
  foto_url: string;
  alamat?: string;
  jarak?: string;
  hobi?: string[];
  bio?: string;
}

// Fallback high-quality demo profiles matching the reference image
const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-1',
    nama: 'Dinda',
    umur: 24,
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    alamat: 'Jakarta Selatan',
    jarak: '3 km away',
    hobi: ['Badminton', 'Gym', 'Running'],
    bio: 'Cari partner badminton / gym / lari. Let’s move together! 💪',
  },
  {
    id: 'demo-2',
    nama: 'Reza',
    umur: 26,
    foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
    alamat: 'Gelora Bung Karno',
    jarak: '4 km away',
    hobi: ['Gym', 'Basket', 'Running', 'Coffee'],
    bio: 'Gym, basket, lari, kopi. Cari teman olahraga yang konsisten.',
  },
  {
    id: 'demo-3',
    nama: 'Nadia',
    umur: 26,
    foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
    alamat: 'Senayan',
    jarak: '2 km away',
    hobi: ['Running', 'Yoga', 'Tennis'],
    bio: 'Pagi lari santai, sore tennis match. Siapa mau join?',
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch profiles from Supabase with fallback to demo data
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);

      if (error || !data || data.length === 0) {
        setProfiles(DEMO_PROFILES);
      } else {
        const formatted: Profile[] = data.map((item: any) => ({
          id: item.id,
          nama: item.nama || 'Pengguna',
          umur: item.umur || 25,
          foto_url: item.foto_url || DEMO_PROFILES[0].foto_url,
          alamat: item.alamat || 'Jakarta',
          jarak: '3 km away',
          hobi: Array.isArray(item.hobi)
            ? item.hobi
            : (item.hobi ? item.hobi.split(',').map((s: string) => s.trim()) : ['Gym', 'Running']),
          bio: item.bio || 'Yuk cari teman olahraga bareng di Manuver!',
        }));
        setProfiles(formatted);
      }
    } catch {
      setProfiles(DEMO_PROFILES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  // Gesture shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const handleSwipeComplete = (direction: 'left' | 'right' | 'superlike') => {
    const swipedId = currentProfile?.id;
    setCurrentIndex((prev) => prev + 1);
    translateX.value = 0;
    translateY.value = 0;

    // Persist swipe action to Supabase
    if (swipedId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          supabase.from('swipes').insert({
            swiper_id: data.user.id,
            swipee_id: swipedId,
            action: direction === 'right' ? 'like' : direction === 'left' ? 'pass' : 'superlike',
          });
        }
      });
    }
  };

  const triggerSwipe = (direction: 'left' | 'right' | 'superlike') => {
    'worklet';
    
    // Provide haptic feedback based on the action
    if (direction === 'superlike') {
      runOnJS(Haptics.notificationAsync)(
        Haptics.NotificationFeedbackType.Success
      );
    } else {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (direction === 'left') {
      translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
        runOnJS(handleSwipeComplete)('left');
      });
    } else if (direction === 'right') {
      translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 250 }, () => {
        runOnJS(handleSwipeComplete)('right');
      });
    } else {
      translateY.value = withTiming(-SCREEN_HEIGHT * 1.2, { duration: 280 }, () => {
        runOnJS(handleSwipeComplete)('superlike');
      });
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.6; // subtle vertical drag
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        triggerSwipe('right');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        triggerSwipe('left');
      } else if (event.translationY < -150) {
        triggerSwipe('superlike');
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-10, 0, 10]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, SWIPE_THRESHOLD], [0, 1]),
  }));

  const passStampStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -20], [1, 0]),
  }));

  return (
    <GestureHandlerRootView style={styles.rootContainer}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        
        {/* Transparent Header */}
        <View style={styles.discoverHeader}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.discoverLogo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => router.push('/settings/filters')}
          >
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !currentProfile ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.glowingRingsOuter}>
              <View style={styles.glowingRingsInner}>
                <Ionicons name="flame" size={56} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Area Clear!</Text>
            <Text style={styles.emptySubtitle}>
              Coba perluas radius atau rentang umur di pengaturan untuk menemukan partner baru.
            </Text>
            <TouchableOpacity
              style={styles.emptyFilterBtn}
              onPress={() => {
                setCurrentIndex(0);
                fetchProfiles();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyFilterText}>Ubah Filter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Swiper Area */
          <View style={styles.deckContainer}>
            {/* Background Card Preview */}
            {nextProfile && (
              <View style={[styles.card, styles.nextCard]}>
                <Image
                  source={{ uri: nextProfile.foto_url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Active Swiping Card */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.card, animatedCardStyle]}>
                <MultiPhotoCard
                  photos={[currentProfile.foto_url, currentProfile.foto_url]}
                  name={currentProfile.nama}
                  age={currentProfile.umur || 24}
                  location={currentProfile.alamat || 'Jakarta'}
                  distance={currentProfile.jarak || '3 km away'}
                  sports={currentProfile.hobi || ['Badminton', 'Gym']}
                  bio={currentProfile.bio}
                />

                {/* LIKE / PASS Visual Feedback Stamps */}
                <Animated.View style={[styles.stampBadge, styles.likeBadge, likeStampStyle]} pointerEvents="none">
                  <Text style={styles.likeBadgeText}>LIKE</Text>
                </Animated.View>
                <Animated.View style={[styles.stampBadge, styles.passBadge, passStampStyle]} pointerEvents="none">
                  <Text style={styles.passBadgeText}>PASS</Text>
                </Animated.View>
              </Animated.View>
            </GestureDetector>

            {/* Bottom Action Buttons (Pass, Superlike, Like) */}
            <View style={styles.actionRow}>
              {/* Pass Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnPass]}
                onPress={() => triggerSwipe('left')}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={30} color={Colors.danger} />
              </TouchableOpacity>

              {/* Superlike / Star Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnStar]}
                onPress={() => triggerSwipe('superlike')}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={24} color={Colors.white} />
              </TouchableOpacity>

              {/* Like / Heart Button */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnLike]}
                onPress={() => triggerSwipe('right')}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={28} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  discoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    height: 52,
    zIndex: 10,
  },
  discoverLogo: {
    width: 110,
    height: 32,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1D24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckContainer: {
    flex: 1,
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 20,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    position: 'absolute',
    top: 8,
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.7,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  cardInfo: {
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontFamily: Typography.fontHeading,
    fontSize: 28,
    color: Colors.textPrimary,
  },
  verifiedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locationText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: '#B7BCCB',
  },
  bioText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
  },
  sportTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  sportTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 90, 31, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.5)',
  },
  sportTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  venuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  venuePillText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    maxWidth: SCREEN_WIDTH - 120,
  },
  stampBadge: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 3,
    zIndex: 99,
  },
  likeBadge: {
    left: 30,
    borderColor: Colors.success,
    transform: [{ rotate: '-18deg' }],
  },
  likeBadgeText: {
    fontFamily: Typography.fontHeading,
    color: Colors.success,
    fontSize: 28,
    letterSpacing: 2,
  },
  passBadge: {
    right: 30,
    borderColor: Colors.danger,
    transform: [{ rotate: '18deg' }],
  },
  passBadgeText: {
    fontFamily: Typography.fontHeading,
    color: Colors.danger,
    fontSize: 28,
    letterSpacing: 2,
  },
  actionRow: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  btnPass: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#1A1D24',
    borderWidth: 1.5,
    borderColor: '#2A2E38',
  },
  btnStar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
  },
  btnLike: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  glowingRingsOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 87, 47, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  glowingRingsInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 87, 47, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  emptyFilterBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  emptyFilterText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.primary,
  },
});
