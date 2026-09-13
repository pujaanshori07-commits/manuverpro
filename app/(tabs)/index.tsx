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
  Pressable,
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
const HERO_PHOTO_HEIGHT = Math.round(SCREEN_WIDTH * 1.28);
const STORY_PHOTO_HEIGHT = 320;

// Natural physics spring config for swipe resets
const SPRING_CONFIG = {
  damping: 14,
  stiffness: 120,
  mass: 0.85,
};

interface Profile {
  id: string;
  nama: string;
  umur?: number;
  photos: string[];
  alamat?: string;
  jarak?: string;
  hobi?: string[];
  bio?: string;
  skill_level?: string;
  availability?: string[];
  distance_pref?: string;
  interests?: string[];
  sports_prompt?: {
    question: string;
    answer: string;
  };
}

const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-1',
    nama: 'Dinda',
    umur: 24,
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85',
    ],
    alamat: 'GBK Senayan',
    jarak: '2 km away',
    hobi: ['Gym', 'Running', 'Badminton'],
    bio: 'Senang olahraga bareng. Biasanya lari pagi di Sudirman atau gym malam sehabis kerja. Let’s stay active together! 🏸💪',
    skill_level: 'Intermediate (1–3 tahun)',
    availability: ['Pagi (06:00)', 'Malam (19:00)', 'Akhir Pekan'],
    distance_pref: '≤ 10 km',
    interests: ['Health & Fitness', 'Travel', 'Coffee', 'Music'],
    sports_prompt: {
      question: 'Target olahraga & sparring gue',
      answer: 'Cari teman latihan yang konsisten. Gak harus pro, yang penting hadir tepat waktu dan gak mager!',
    },
  },
  {
    id: 'demo-2',
    nama: 'Reza',
    umur: 26,
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1000&q=85',
    ],
    alamat: 'Cilandak Sport Center',
    jarak: '4 km away',
    hobi: ['Gym', 'Basket', 'Running'],
    bio: 'Gym 4x seminggu, sabtu main basket santai. Looking for a disciplined gym bro & regular running buddy.',
    skill_level: 'Advanced (> 3 tahun)',
    availability: ['Sore (17:00)', 'Akhir Pekan'],
    distance_pref: '≤ 15 km',
    interests: ['Strength Training', 'Nutrition', 'Sneakers', 'Outdoor'],
    sports_prompt: {
      question: 'Rutinitas minggu pagi gue',
      answer: 'Lari 5K–10K santai di car-free day terus sarapan lontong sayur atau ngopi bareng.',
    },
  },
  {
    id: 'demo-3',
    nama: 'Nadia',
    umur: 25,
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=1000&q=85',
    ],
    alamat: 'Kuningan',
    jarak: '3 km away',
    hobi: ['Tennis', 'Pilates', 'Running'],
    bio: 'Weekend tennis drill & pilates morning. Mencari partner rally santai yang asik diajak ngobrol!',
    skill_level: 'Beginner - Intermediate',
    availability: ['Pagi (07:00)', 'Sabtu - Minggu'],
    distance_pref: '≤ 8 km',
    interests: ['Pilates', 'Matcha', 'Wellness', 'Tennis'],
    sports_prompt: {
      question: 'Latihan paling ideal versi gue',
      answer: 'Satu jam rally tennis intens, lanjut cooling down sambil ngobrol santai.',
    },
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
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
        const formatted: Profile[] = data.map((item: any, idx: number) => {
          const fallback = DEMO_PROFILES[idx % DEMO_PROFILES.length];
          const photoArray = Array.isArray(item.photos) && item.photos.length > 0
            ? item.photos
            : item.foto_url
              ? [item.foto_url, fallback.photos[1], fallback.photos[2]]
              : fallback.photos;

          return {
            id: item.id,
            nama: item.nama || fallback.nama,
            umur: item.umur || fallback.umur,
            photos: photoArray,
            alamat: item.alamat || fallback.alamat,
            jarak: item.jarak || fallback.jarak,
            hobi: Array.isArray(item.hobi)
              ? item.hobi
              : item.hobi
                ? item.hobi.split(',').map((s: string) => s.trim())
                : fallback.hobi,
            bio: item.bio || fallback.bio,
            skill_level: item.skill_level || fallback.skill_level,
            availability: item.availability || fallback.availability,
            distance_pref: item.distance_pref || fallback.distance_pref,
            interests: item.interests || fallback.interests,
            sports_prompt: fallback.sports_prompt,
          };
        });
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

  const resetCardState = () => {
    setActivePhotoIdx(0);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const swipedId = currentProfile?.id;
    setCurrentIndex((prev) => prev + 1);
    translateX.value = 0;
    translateY.value = 0;
    resetCardState();

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

  // Carousel navigation handlers
  const handlePrevPhoto = () => {
    if (activePhotoIdx > 0) {
      Haptics.selectionAsync();
      setActivePhotoIdx((prev) => prev - 1);
    }
  };

  const handleNextPhoto = () => {
    const maxIdx = (currentProfile?.photos?.length || 1) - 1;
    if (activePhotoIdx < maxIdx) {
      Haptics.selectionAsync();
      setActivePhotoIdx((prev) => prev + 1);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-22, 22])
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
    if (lower.includes('health') || lower.includes('fitness')) return 'heart-circle-outline';
    if (lower.includes('travel') || lower.includes('jalan')) return 'airplane-outline';
    if (lower.includes('music') || lower.includes('musik')) return 'musical-notes-outline';
    if (lower.includes('food') || lower.includes('kuliner')) return 'restaurant-outline';
    if (lower.includes('coffee') || lower.includes('ngopi')) return 'cafe-outline';
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
            activeOpacity={0.75}
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
          /* Swiper & Interleaved Story Deck */
          <View style={styles.deckContainer}>
            
            {/* Background Card Preview */}
            {nextProfile && (
              <View style={[styles.card, styles.nextCard]}>
                <Image
                  source={{ uri: nextProfile.photos[0] }}
                  style={styles.nextHeroPhoto}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Active Card with Gesture and Scroll Container */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.card, animatedCardStyle]}>
                
                {/* LIKE / PASS Visual Feedback Stamps */}
                <Animated.View style={[styles.stampBadge, styles.likeBadge, likeStampStyle]} pointerEvents="none">
                  <Text style={styles.likeBadgeText}>INTERESTED</Text>
                </Animated.View>
                <Animated.View style={[styles.stampBadge, styles.passBadge, passStampStyle]} pointerEvents="none">
                  <Text style={styles.passBadgeText}>PASS</Text>
                </Animated.View>

                {/* Vertically Scrollable Interleaved Story */}
                <ScrollView
                  ref={scrollRef}
                  style={styles.profileScrollView}
                  contentContainerStyle={styles.scrollContentContainer}
                  showsVerticalScrollIndicator={false}
                  bounces={true}
                >
                  {/* BLOCK 1: Hero Photo + Stories Carousel + Identity Overlay */}
                  <View style={styles.heroPhotoWrapper}>
                    <Image
                      source={{ uri: currentProfile.photos[activePhotoIdx] || currentProfile.photos[0] }}
                      style={styles.heroPhoto}
                      resizeMode="cover"
                    />

                    {/* Top Segmented Instagram/Bumble Progress Bar */}
                    <View style={styles.storySegmentContainer}>
                      {currentProfile.photos.map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.storySegmentBar,
                            idx === activePhotoIdx && styles.storySegmentBarActive,
                          ]}
                        />
                      ))}
                    </View>

                    {/* Left & Right Tap Zones for Instant Photo Flipping */}
                    <View style={styles.touchZonesOverlay}>
                      <Pressable
                        style={styles.leftTouchZone}
                        onPress={handlePrevPhoto}
                      />
                      <Pressable
                        style={styles.rightTouchZone}
                        onPress={handleNextPhoto}
                      />
                    </View>

                    {/* Smooth Bottom Gradient Fade */}
                    <LinearGradient
                      colors={['transparent', 'rgba(17, 20, 28, 0.45)', '#11141C']}
                      locations={[0, 0.6, 1]}
                      style={styles.photoGradient}
                      pointerEvents="none"
                    />

                    {/* Identity Overlay over Hero Photo */}
                    <View style={styles.heroIdentityOverlay} pointerEvents="none">
                      <View style={styles.nameRow}>
                        <Text style={styles.profileName}>
                          {currentProfile.nama}, {currentProfile.umur}
                        </Text>
                        <View style={styles.verifiedCheck}>
                          <Ionicons name="checkmark-sharp" size={13} color="#FFFFFF" />
                        </View>
                      </View>

                      {/* Quick Sport Chips */}
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
                          {currentProfile.alamat || 'GBK Senayan'} • {currentProfile.jarak || '2 km away'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* BLOCK 2: Authentic Sports-Specific Prompt Card */}
                  {currentProfile.sports_prompt && (
                    <View style={styles.promptCard}>
                      <View style={styles.promptHeaderRow}>
                        <Ionicons name="flame" size={16} color={Colors.primary} />
                        <Text style={styles.promptQuestion}>
                          {currentProfile.sports_prompt.question}
                        </Text>
                      </View>
                      <Text style={styles.promptAnswer}>
                        "{currentProfile.sports_prompt.answer}"
                      </Text>
                    </View>
                  )}

                  {/* BLOCK 3: In-Action Sport Shot (Photo 2) */}
                  {currentProfile.photos[1] && (
                    <View style={styles.storyPhotoWrapper}>
                      <Image
                        source={{ uri: currentProfile.photos[1] }}
                        style={styles.storyPhoto}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(17, 20, 28, 0.7)']}
                        style={styles.storyPhotoCaptionGradient}
                      >
                        <Text style={styles.storyPhotoCaption}>In Training • Sesi Rutin</Text>
                      </LinearGradient>
                    </View>
                  )}

                  {/* BLOCK 4: Skill Level & Availability Matrix Card */}
                  <View style={styles.matrixCard}>
                    <Text style={styles.sectionHeading}>CABANG & JADWAL SPAR</Text>
                    
                    {/* Sports Played Pills */}
                    <View style={styles.pillsRow}>
                      {(currentProfile.hobi || ['Running', 'Gym']).map((sport, idx) => (
                        <View key={idx} style={styles.detailPill}>
                          <Ionicons name={getSportIcon(sport)} size={14} color={Colors.primary} />
                          <Text style={styles.detailPillText}>{sport}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Skill Level & Preferred Time */}
                    <View style={styles.matrixDetailsGroup}>
                      <View style={styles.matrixRow}>
                        <Ionicons name="medal-outline" size={16} color={Colors.primary} />
                        <Text style={styles.matrixLabel}>Level:</Text>
                        <Text style={styles.matrixValue}>{currentProfile.skill_level || 'Intermediate'}</Text>
                      </View>

                      <View style={styles.matrixRow}>
                        <Ionicons name="time-outline" size={16} color={Colors.primary} />
                        <Text style={styles.matrixLabel}>Waktu:</Text>
                        <Text style={styles.matrixValue}>
                          {(currentProfile.availability || ['Pagi', 'Akhir Pekan']).join(' • ')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* BLOCK 5: Lifestyle / Approachable Shot (Photo 3) */}
                  {currentProfile.photos[2] && (
                    <View style={styles.storyPhotoWrapper}>
                      <Image
                        source={{ uri: currentProfile.photos[2] }}
                        style={styles.storyPhoto}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(17, 20, 28, 0.7)']}
                        style={styles.storyPhotoCaptionGradient}
                      >
                        <Text style={styles.storyPhotoCaption}>Off the court • Rehat & Kopi</Text>
                      </LinearGradient>
                    </View>
                  )}

                  {/* BLOCK 6: About Me & Preferences Card */}
                  <View style={styles.aboutCard}>
                    <Text style={styles.sectionHeading}>TENTANG SAYA</Text>
                    <Text style={styles.aboutMeText}>{currentProfile.bio}</Text>

                    <Text style={[styles.sectionHeading, { marginTop: 18 }]}>MINAT & LIFESTYLE</Text>
                    <View style={styles.pillsRow}>
                      {(currentProfile.interests || ['Health', 'Travel', 'Music', 'Food']).map((interest, idx) => (
                        <View key={idx} style={styles.interestPill}>
                          <Ionicons name={getInterestIcon(interest)} size={15} color="#A2A7B8" />
                          <Text style={styles.interestPillText}>{interest}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.distanceMetaRow}>
                      <Ionicons name="navigate-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.distanceMetaText}>
                        Preferensi radius jarak: {currentProfile.distance_pref || '≤ 10 km'}
                      </Text>
                    </View>
                  </View>

                </ScrollView>
              </Animated.View>
            </GestureDetector>

            {/* Sticky Floating Bottom Action Buttons (Pass | Interested) */}
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
    paddingBottom: 220, // generous bottom padding to float above sticky action buttons
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
  storySegmentContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 5,
    zIndex: 10,
  },
  storySegmentBar: {
    flex: 1,
    height: 3.5,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  storySegmentBarActive: {
    backgroundColor: '#FFFFFF',
  },
  touchZonesOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 5,
  },
  leftTouchZone: {
    width: '40%',
    height: '80%',
  },
  rightTouchZone: {
    width: '60%',
    height: '80%',
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    zIndex: 6,
  },
  heroIdentityOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    zIndex: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileName: {
    fontFamily: Typography.fontHeading,
    fontSize: 26,
    color: Colors.white,
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
    marginBottom: 8,
  },
  quickSportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
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
  },
  locationText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  promptCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderLeftWidth: 3.5,
    borderLeftColor: Colors.primary,
  },
  promptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  promptQuestion: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptAnswer: {
    fontFamily: Typography.fontMedium,
    fontSize: 14,
    color: Colors.white,
    lineHeight: 22,
  },
  storyPhotoWrapper: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    height: STORY_PHOTO_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  storyPhoto: {
    width: '100%',
    height: '100%',
  },
  storyPhotoCaptionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  storyPhotoCaption: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  matrixCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sectionHeading: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
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
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.pillBorder,
  },
  detailPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#E3E7F0',
  },
  matrixDetailsGroup: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: 8,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matrixLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  matrixValue: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  aboutCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  aboutMeText: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.pillBorder,
  },
  interestPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#E3E7F0',
  },
  distanceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  distanceMetaText: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textMuted,
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
