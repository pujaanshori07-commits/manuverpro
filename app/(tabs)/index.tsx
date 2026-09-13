import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const HERO_PHOTO_HEIGHT = Math.round(SCREEN_WIDTH * 1.25);

// Spring physics config with a playful, natural bounce
const SPRING_CONFIG = {
  damping: 13,
  stiffness: 115,
  mass: 0.85,
};

interface Profile {
  id: string;
  nama: string;
  umur?: number;
  foto_url: string;
  alamat?: string;
  jarak?: string;
  hobi?: string[];
  bio?: string;
  skill_level?: string;
  availability?: string[];
  distance_pref?: string;
  interests?: string[];
}

const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-1',
    nama: 'Pengguna Baru',
    umur: 24,
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    alamat: 'GBK Senayan',
    jarak: '2 km',
    hobi: ['Gym', 'Running'],
    bio: 'Senang olahraga bersama. Mencari partner latihan rutin di sekitarku dan ikut event lari bareng.',
    skill_level: 'Intermediate',
    availability: ['Pagi', 'Sore', 'Akhir Pekan'],
    distance_pref: '≤ 10 km',
    interests: ['Health', 'Travel', 'Music', 'Food'],
  },
  {
    id: 'demo-2',
    nama: 'Dinda',
    umur: 25,
    foto_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
    alamat: 'Senayan',
    jarak: '3 km away',
    hobi: ['Badminton', 'Running'],
    bio: 'Cari partner badminton santai atau sparring lari pagi di GBK. Let’s stay active together! 💪🏸',
    skill_level: 'Advanced',
    availability: ['Pagi', 'Akhir Pekan'],
    distance_pref: '≤ 5 km',
    interests: ['Health', 'Outdoor', 'Coffee'],
  },
  {
    id: 'demo-3',
    nama: 'Reza',
    umur: 27,
    foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
    alamat: 'Cilandak',
    jarak: '4 km away',
    hobi: ['Gym', 'Basket', 'Running'],
    bio: 'Gym 4x seminggu & main basket santai akhir pekan. Looking for a disciplined gym bro.',
    skill_level: 'Intermediate',
    availability: ['Malam', 'Akhir Pekan'],
    distance_pref: '≤ 15 km',
    interests: ['Fitness', 'Nutrition', 'Music'],
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

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
          nama: item.nama || 'Pengguna Baru',
          umur: item.umur || 24,
          foto_url: item.foto_url || DEMO_PROFILES[0].foto_url,
          alamat: item.alamat || 'GBK Senayan',
          jarak: item.jarak || '2 km',
          hobi: Array.isArray(item.hobi)
            ? item.hobi
            : (item.hobi ? item.hobi.split(',').map((s: string) => s.trim()) : ['Gym', 'Running']),
          bio: item.bio || 'Senang olahraga bersama. Mencari partner latihan rutin di sekitarku.',
          skill_level: item.skill_level || 'Intermediate',
          availability: item.availability || ['Pagi', 'Sore', 'Akhir Pekan'],
          distance_pref: item.distance_pref || '≤ 10 km',
          interests: item.interests || ['Health', 'Travel', 'Music', 'Food'],
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

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Micro-interaction button scales
  const passScale = useSharedValue(1);
  const interestedScale = useSharedValue(1);

  const passBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: passScale.value }],
  }));

  const interestedBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interestedScale.value }],
  }));

  const resetScrollPosition = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const swipedId = currentProfile?.id;
    setCurrentIndex((prev) => prev + 1);
    translateX.value = 0;
    translateY.value = 0;
    resetScrollPosition();

    if (swipedId) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          supabase.from('swipes').insert({
            swiper_id: data.user.id,
            swipee_id: swipedId,
            action: direction === 'right' ? 'like' : 'pass',
          });
        }
      });
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    'worklet';
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);

    if (direction === 'left') {
      translateX.value = withTiming(-SCREEN_WIDTH * 1.35, { duration: 240 }, () => {
        runOnJS(handleSwipeComplete)('left');
      });
    } else {
      translateX.value = withTiming(SCREEN_WIDTH * 1.35, { duration: 240 }, () => {
        runOnJS(handleSwipeComplete)('right');
      });
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.12;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        triggerSwipe('right');
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        triggerSwipe('left');
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-7, 0, 7]
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

  const getInterestIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('health') || lower.includes('sehat')) return 'heart-circle-outline';
    if (lower.includes('travel') || lower.includes('jalan')) return 'airplane-outline';
    if (lower.includes('music') || lower.includes('musik')) return 'musical-notes-outline';
    if (lower.includes('food') || lower.includes('kuliner')) return 'restaurant-outline';
    if (lower.includes('coffee') || lower.includes('kopi')) return 'cafe-outline';
    if (lower.includes('outdoor')) return 'compass-outline';
    return 'sparkles-outline';
  };

  const getSportIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('run') || lower.includes('lari')) return 'walk';
    if (lower.includes('gym') || lower.includes('fit')) return 'barbell';
    if (lower.includes('cycle') || lower.includes('sepeda')) return 'bicycle';
    if (lower.includes('badminton') || lower.includes('tennis')) return 'tennisball';
    return 'fitness';
  };

  return (
    <GestureHandlerRootView style={styles.rootContainer}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        
        {/* Friendly Header with Centered Wordmark */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerBrandText}>manuver</Text>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => router.push('/settings/filters')}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !currentProfile ? (
          /* Empty Deck State */
          <View style={styles.emptyContainer}>
            <View style={styles.glowingRingsOuter}>
              <View style={styles.glowingRingsInner}>
                <Ionicons name="flame" size={54} color={Colors.primary} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Area Selesai Dijelajahi!</Text>
            <Text style={styles.emptySubtitle}>
              Coba perluas radius atau rentang umur di filter untuk menemukan partner olahraga lainnya.
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
          /* Swiper & Scrollable Profile Deck */
          <View style={styles.deckContainer}>
            
            {/* Soft Background Card Preview */}
            {nextProfile && (
              <View style={[styles.card, styles.nextCard]}>
                <Image
                  source={{ uri: nextProfile.foto_url }}
                  style={styles.nextHeroPhoto}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Active Bumble-style Card with Vertical Scroll */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.card, animatedCardStyle]}>
                
                {/* Visual Feedback Stamps on Swipe */}
                <Animated.View style={[styles.stampBadge, styles.likeBadge, likeStampStyle]} pointerEvents="none">
                  <Text style={styles.likeBadgeText}>INTERESTED</Text>
                </Animated.View>
                <Animated.View style={[styles.stampBadge, styles.passBadge, passStampStyle]} pointerEvents="none">
                  <Text style={styles.passBadgeText}>PASS</Text>
                </Animated.View>

                {/* Vertically Scrollable Profile Body */}
                <ScrollView
                  ref={scrollRef}
                  style={styles.profileScrollView}
                  contentContainerStyle={styles.scrollContentContainer}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                >
                  {/* Hero Photo - Natural Full Photo */}
                  <View style={styles.heroPhotoWrapper}>
                    <Image
                      source={{ uri: currentProfile.foto_url }}
                      style={styles.heroPhoto}
                      resizeMode="cover"
                    />
                    {/* Seamless Bottom-Edge Fade into Card Surface */}
                    <LinearGradient
                      colors={['transparent', 'rgba(17, 20, 28, 0.45)', '#11141C']}
                      locations={[0, 0.55, 1]}
                      style={styles.photoGradient}
                    />
                  </View>

                  {/* Profile Details Content */}
                  <View style={styles.profileDetailsBody}>
                    
                    {/* Name, Age & Verified Badge */}
                    <View style={styles.nameRow}>
                      <Text style={styles.profileName}>
                        {currentProfile.nama}, {currentProfile.umur}
                      </Text>
                      <View style={styles.verifiedCheck}>
                        <Ionicons name="checkmark-sharp" size={13} color="#FFFFFF" />
                      </View>
                    </View>

                    {/* Quick Sport Chips immediately under identity */}
                    {currentProfile.hobi && currentProfile.hobi.length > 0 && (
                      <View style={styles.quickSportsRow}>
                        {currentProfile.hobi.map((item, idx) => (
                          <View key={idx} style={styles.quickSportChip}>
                            <Ionicons name={getSportIcon(item)} size={13} color={Colors.primary} />
                            <Text style={styles.quickSportText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Venue & Distance */}
                    <View style={styles.locationRow}>
                      <Ionicons name="location-sharp" size={14} color={Colors.primary} />
                      <Text style={styles.locationText}>
                        {currentProfile.alamat || 'GBK Senayan'} • {currentProfile.jarak || '2 km'}
                      </Text>
                    </View>

                    {/* Section 1: About Me */}
                    {currentProfile.bio ? (
                      <View style={styles.sectionBlock}>
                        <Text style={styles.sectionHeading}>About Me</Text>
                        <Text style={styles.aboutMeText}>{currentProfile.bio}</Text>
                      </View>
                    ) : null}

                    {/* Section 2: Sports I Play */}
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionHeading}>Sports I Play</Text>
                      <View style={styles.pillsRow}>
                        {(currentProfile.hobi || ['Running', 'Gym', 'Cycling']).map((sport, idx) => (
                          <View key={idx} style={styles.detailPill}>
                            <Ionicons name={getSportIcon(sport)} size={14} color={Colors.primary} />
                            <Text style={styles.detailPillText}>{sport}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Section 3: Skill Level */}
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionHeading}>Skill Level</Text>
                      <View style={styles.pillsRow}>
                        <View style={styles.detailPill}>
                          <Text style={styles.detailPillText}>{currentProfile.skill_level || 'Intermediate'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Section 4: Availability */}
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionHeading}>Availability</Text>
                      <View style={styles.pillsRow}>
                        {(currentProfile.availability || ['Pagi', 'Sore', 'Akhir Pekan']).map((time, idx) => (
                          <View key={idx} style={styles.detailPill}>
                            <Text style={styles.detailPillText}>{time}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Section 5: Distance Preference */}
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionHeading}>Distance Preference</Text>
                      <View style={styles.pillsRow}>
                        <View style={styles.detailPill}>
                          <Text style={styles.detailPillText}>{currentProfile.distance_pref || '≤ 10 km'}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Section 6: Interests */}
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionHeading}>Interests</Text>
                      <View style={styles.pillsRow}>
                        {(currentProfile.interests || ['Health', 'Travel', 'Music', 'Food']).map((interest, idx) => (
                          <View key={idx} style={styles.interestPill}>
                            <Ionicons name={getInterestIcon(interest)} size={15} color="#A2A7B8" />
                            <Text style={styles.interestPillText}>{interest}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                  </View>
                </ScrollView>
              </Animated.View>
            </GestureDetector>

            {/* Sticky Floating Bottom Action Buttons */}
            <View style={[styles.bottomActionContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <LinearGradient
                colors={['transparent', 'rgba(11, 13, 19, 0.88)', '#0B0D13']}
                locations={[0, 0.35, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <View style={styles.actionRow}>
                {/* PASS Action */}
                <View style={styles.actionCol}>
                  <Animated.View style={passBtnAnimStyle}>
                    <TouchableOpacity
                      style={[styles.actionCircle, styles.btnPass]}
                      onPress={() => triggerSwipe('left')}
                      onPressIn={() => {
                        passScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
                      }}
                      onPressOut={() => {
                        passScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                      }}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="close" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={styles.actionLabel}>Pass</Text>
                </View>

                {/* INTERESTED Action */}
                <View style={styles.actionCol}>
                  <Animated.View style={interestedBtnAnimStyle}>
                    <TouchableOpacity
                      style={[styles.actionCircle, styles.btnInterested]}
                      onPress={() => triggerSwipe('right')}
                      onPressIn={() => {
                        interestedScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
                      }}
                      onPressOut={() => {
                        interestedScale.value = withSpring(1, { damping: 15, stiffness: 300 });
                      }}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="walk" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={styles.actionLabel}>Interested</Text>
                </View>
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    height: 48,
    zIndex: 20,
  },
  headerSpacer: {
    width: 38,
  },
  headerBrandText: {
    fontFamily: Typography.fontHeading,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckContainer: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    paddingBottom: 8,
  },
  card: {
    width: SCREEN_WIDTH - 20,
    borderRadius: BorderRadius.card,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    bottom: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.45,
  },
  nextHeroPhoto: {
    width: '100%',
    height: HERO_PHOTO_HEIGHT,
  },
  profileScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 210, // Clears the floating action buttons cleanly
  },
  heroPhotoWrapper: {
    width: '100%',
    height: HERO_PHOTO_HEIGHT,
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  profileDetailsBody: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileName: {
    fontFamily: Typography.fontHeading,
    fontSize: 25,
    color: Colors.white,
    fontWeight: '700',
  },
  verifiedCheck: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quickSportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.pillBgActive,
    borderWidth: 1,
    borderColor: Colors.pillBorderActive,
  },
  quickSportText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: Colors.white,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 20,
  },
  locationText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
    marginBottom: 8,
  },
  aboutMeText: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.pillBorder,
  },
  detailPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: '#E3E7F0',
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.pillBorder,
  },
  interestPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: '#E3E7F0',
  },
  stampBadge: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 3,
    zIndex: 99,
  },
  likeBadge: {
    left: 24,
    borderColor: Colors.success,
    transform: [{ rotate: '-14deg' }],
  },
  likeBadgeText: {
    fontFamily: Typography.fontHeading,
    color: Colors.success,
    fontSize: 24,
    letterSpacing: 2,
    fontWeight: '800',
  },
  passBadge: {
    right: 24,
    borderColor: Colors.danger,
    transform: [{ rotate: '14deg' }],
  },
  passBadgeText: {
    fontFamily: Typography.fontHeading,
    color: Colors.danger,
    fontSize: 24,
    letterSpacing: 2,
    fontWeight: '800',
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    zIndex: 30,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  actionCol: {
    alignItems: 'center',
    gap: 6,
  },
  actionCircle: {
    width: 62,
    height: 62,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPass: {
    backgroundColor: '#1B1F2A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnInterested: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  actionLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: Colors.textSecondary,
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
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  glowingRingsInner: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 87, 47, 0.22)',
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
    lineHeight: 22,
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
