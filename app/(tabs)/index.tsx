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
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  withRepeat,
} from 'react-native-reanimated';

import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import MatchCelebration from '../../components/MatchCelebration';
import LocationPermissionModal from '../../components/LocationPermissionModal';
import SwipeCard, { SwipeCardRef } from '../../components/SwipeCard';
import RadarAnimation from '../../components/RadarAnimation';
import ProfileCardSummary from '../../components/ProfileCardSummary';
import ProfileBottomSheet from '../../components/ProfileBottomSheet';
import { useLocationManager } from '../../hooks/useLocationManager';
import { useProfiles } from '../../hooks/useProfiles';
import { Profile } from '../../types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
// Hero photo height matches 1.25x width for consistent mobile portrait presentation
const HERO_PHOTO_HEIGHT = Math.round((SCREEN_WIDTH - 20) * 1.25);
const SECOND_PHOTO_HEIGHT = Math.round((SCREEN_WIDTH - 20) * 1.15);

const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-1',
    nama: 'Pengguna Baru',
    umur: 24,
    foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80&crop=bottom',
    ],
    alamat: 'GBK Senayan',
    jarak: '2 km away',
    hobi: 'Gym & Fitness, Running, Badminton',
    prompt_question: 'Target olahraga bulan ini',
    prompt_answer: 'Rutinitas lari 5K sub-28 menit & konsisten gym 3x seminggu. Butuh partner yang gak gampang cancel!',
    bio: 'Senang olahraga bareng. Mencari partner latihan rutin di sekitarku dan ikut event lari bersama.',
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
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80',
    ],
    alamat: 'Senayan',
    jarak: '3 km away',
    hobi: 'Badminton, Running, Yoga',
    prompt_question: 'Partner sparing ideal buatku',
    prompt_answer: 'Yang mainnya seru, bisa rally panjang badminton, dan setelahnya ngopi bareng santai.',
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
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1000&q=80',
    ],
    alamat: 'Cilandak',
    jarak: '4 km away',
    hobi: 'Gym & Fitness, Basketball, Running',
    prompt_question: 'Gaya latihan favorit',
    prompt_answer: 'Push-Pull-Legs di gym, lanjut pickup game basket Sabtu sore. Disiplin tapi tetap enjoy!',
    bio: 'Gym 4x seminggu & main basket santai akhir pekan. Looking for a disciplined gym bro.',
    skill_level: 'Intermediate',
    availability: ['Malam', 'Akhir Pekan'],
    distance_pref: '≤ 15 km',
  }
];

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const swipeCardRef = useRef<SwipeCardRef>(null);

  const [detailSheetVisible, setDetailSheetVisible] = useState(false);

  const {
    profiles,
    loading: profilesLoading,
    matchData,
    myAvatarUrl,
    fetchProfiles,
    handleSwipeComplete,
    closeMatchModal,
  } = useProfiles();

  // Map Profile type to ProfileBottomSheet expected type
  const mapToBottomSheetProfile = (p: Profile) => {
    return {
      id: p.id,
      nama: p.nama,
      foto_url: p.foto_url,
      alamat: p.alamat || null,
      bio: p.bio || null,
      skill_level: p.skill_level,
      availability: p.availability ? p.availability.join(', ') : undefined,
      distance: p.jarak,
      distance_km: p.jarak,
      photos: p.photos || (p.foto_url ? [p.foto_url] : []),
      prompts: (p.prompt_question && p.prompt_answer) 
        ? [{ question_text: p.prompt_question, answer_text: p.prompt_answer }] 
        : undefined,
      user_sports: p.hobi ? p.hobi.split(',').map(h => ({ sports: { nama: h.trim() } })) : [],
    };
  };

  // Location Manager
  const [modalVisible, setModalVisible] = useState(false);
  const { permissionState, loading: locationLoading, requestPermissions, openSettings, getCurrentLocation } = useLocationManager();

  // Show contextual permission modal if never asked
  useEffect(() => {
    if (!locationLoading && permissionState === 'NOT_DETERMINED') {
      setModalVisible(true);
    }
  }, [locationLoading, permissionState]);

  const handleRequestLocation = async () => {
    const newState = await requestPermissions();
    if (newState === 'GRANTED') {
      setModalVisible(false);
      const loc = await getCurrentLocation();
      if (loc) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          await supabase.from('profiles').update({
            last_latitude: loc.coords.latitude,
            last_longitude: loc.coords.longitude,
          }).eq('id', userData.user.id);
        }
      }
      fetchProfiles();
    }
  };

  const loading = profilesLoading || locationLoading;

  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
    }, [fetchProfiles])
  );

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const resetScrollPosition = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const onSwipeComplete = async (direction: 'left' | 'right' | 'up') => {
    if (currentProfile) {
      await handleSwipeComplete(currentProfile, direction);
    }
    setCurrentIndex((prev) => prev + 1);
    resetScrollPosition();
  };

  const triggerSwipe = (direction: 'left' | 'right' | 'up') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (direction === 'left') {
      swipeCardRef.current?.swipeLeft();
    } else if (direction === 'right') {
      swipeCardRef.current?.swipeRight();
    } else if (direction === 'up') {
      swipeCardRef.current?.swipeUp();
    }
  };

  const getInterestIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('health') || lower.includes('sehat')) return 'heart-outline';
    if (lower.includes('travel') || lower.includes('jalan')) return 'airplane-outline';
    if (lower.includes('music') || lower.includes('musik')) return 'musical-notes-outline';
    if (lower.includes('food') || lower.includes('kuliner')) return 'restaurant-outline';
    if (lower.includes('coffee') || lower.includes('kopi')) return 'cafe-outline';
    if (lower.includes('outdoor')) return 'compass-outline';
    return 'sparkles-outline';
  };

  const getSportIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('run') || lower.includes('lari')) return 'walk-outline';
    if (lower.includes('gym') || lower.includes('fit') || lower.includes('barbell')) return 'barbell-outline';
    if (lower.includes('cycle') || lower.includes('sepeda')) return 'bicycle-outline';
    if (lower.includes('badminton') || lower.includes('tennis')) return 'tennisball-outline';
    if (lower.includes('basket')) return 'basketball-outline';
    if (lower.includes('futsal') || lower.includes('football')) return 'football-outline';
    return 'fitness-outline';
  };

  return (
    <>
      <GestureHandlerRootView style={styles.rootContainer}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
        
        {/* Header with Centered "manuver" Wordmark */}
        <View style={styles.header}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerBrandText}>manuver</Text>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => router.push('/settings/filters')}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !currentProfile ? (
          /* Empty Deck State */
          <View style={styles.emptyContainer}>
            <RadarAnimation />
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
          /* Deck Container */
          <View style={styles.deckContainer}>
            
            {/* Background Card Preview */}
            {nextProfile && (
              <View style={[styles.card, styles.nextCard]}>
                <Image
                  source={{ uri: nextProfile.photos?.[0] || nextProfile.foto_url }}
                  style={styles.nextHeroPhoto}
                  resizeMode="cover"
                />
              </View>
            )}

              {/* Active Card with Pan Gesture & Bumble Vertical Scroll */}
              <SwipeCard
                ref={swipeCardRef}
                onSwipedLeft={() => onSwipeComplete('left')}
                onSwipedRight={() => onSwipeComplete('right')}
                onSwipedUp={() => onSwipeComplete('up')}
              >
                <View style={styles.card}>
                  <ScrollView
                    ref={scrollRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                  >
                    {/* Profile Card UI Extracted */}
                    <ProfileCardSummary 
                      profile={currentProfile} 
                      onExpandPress={() => setDetailSheetVisible(true)} 
                    />
                  </ScrollView>
                </View>
              </SwipeCard>

            {/* Sticky Bottom Action Buttons */}
            <View style={[styles.bottomActionContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <LinearGradient
                colors={['transparent', 'rgba(9, 10, 13, 0.85)', '#090A0D']}
                locations={[0, 0.35, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />

              <View style={styles.actionRow}>
                {/* PASS */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={[styles.actionCircle, styles.btnPass]}
                    onPress={() => triggerSwipe('left')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.actionLabel}>Pass</Text>
                </View>

                {/* INTERESTED */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={[styles.actionCircle, styles.btnInterested]}
                    onPress={() => triggerSwipe('right')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="walk" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.actionLabel}>Interested</Text>
                </View>
              </View>
            </View>

          </View>
        )}
      </View>
    </GestureHandlerRootView>

      <LocationPermissionModal
        visible={modalVisible}
        state={permissionState}
        loading={locationLoading}
        onRequestPermission={handleRequestLocation}
        onOpenSettings={openSettings}
        onSkip={() => setModalVisible(false)}
      />

      <MatchCelebration
        visible={matchData !== null}
        matchData={matchData}
        myAvatarUrl={myAvatarUrl}
        onClose={closeMatchModal}
      />

      <ProfileBottomSheet
        visible={detailSheetVisible}
        profile={currentProfile}
        onClose={() => setDetailSheetVisible(false)}
        onSwipeAction={(action) => {
          setDetailSheetVisible(false);
          triggerSwipe(action);
        }}
      />
    </>
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
    fontFamily: 'Lato_900Black',
    fontSize: 24,
    color: '#FF5A36', // Signature Manuver Orange
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#171A21',
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
    position: 'relative',
    alignItems: 'center',
    paddingBottom: 8,
  },
  card: {
    width: SCREEN_WIDTH - 20,
    borderRadius: 24,
    backgroundColor: '#0F1117',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    bottom: 8,
  },
  nextCard: {
    transform: [{ scale: 0.96 }],
    opacity: 0.5,
  },
  nextHeroPhoto: {
    width: '100%',
    height: HERO_PHOTO_HEIGHT,
  },
  profileScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    // Generous bottom clearance ensuring the last section scrolls well above the action buttons
    paddingBottom: 210,
  },

  // Block 1: Hero Photo Wrapper
  heroPhotoWrapper: {
    width: '100%',
    height: HERO_PHOTO_HEIGHT,
    position: 'relative',
    backgroundColor: '#171A21',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  categoryBadgeWrapper: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  categoryBadge: {
    backgroundColor: '#00C48C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontFamily: Typography.fontHeading,
    fontSize: 10,
    fontWeight: '800',
    color: '#0B0D13',
    letterSpacing: 0.5,
  },
  heroOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: 16,
    paddingTop: 40,
    justifyContent: 'flex-end',
  },
  photoVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 17, 23, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  photoVerifiedText: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroProfileName: {
    fontFamily: Typography.fontHeading,
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00C48C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Details Body
  profileDetailsBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#0F1117',
  },

  // Bumble Style Separated Card Blocks
  bumbleCardBlock: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bumbleCardLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: '#8E94A4',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    fontWeight: '700',
  },

  // Block 2: Location Row & Quick Sport Pills
  locationLeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextCol: {
    flex: 1,
  },
  locationPrimaryText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationSecondaryText: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: '#8A8F9E',
    marginTop: 2,
  },
  quickSportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 90, 31, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.35)',
  },
  sportBadgeText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Block 3: Prompt Text
  promptAnswerText: {
    fontFamily: Typography.fontHeading,
    fontSize: 17,
    lineHeight: 25,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  bioSubSection: {
    marginTop: 14,
  },
  bioSubDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  bioSubHeading: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 11,
    color: '#8E94A4',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  bioSubText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    lineHeight: 20,
    color: '#C2C6D2',
  },

  // Blocks 4 & 6: Full Width Photos
  storyPhotoWrapper: {
    width: '100%',
    height: SECOND_PHOTO_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#171A21',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  storyPhotoImage: {
    width: '100%',
    height: '100%',
  },
  photoCaptionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  photoCaptionText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Block 5: Matrix Grid
  matrixRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  matrixColumn: {
    flex: 1,
  },
  matrixLabel: {
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    color: '#8A8F9E',
    marginBottom: 6,
  },
  matrixBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  matrixBadgeText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Pills and tags
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
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#E1E4EA',
    fontWeight: '500',
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  interestPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#E1E4EA',
    fontWeight: '500',
  },

  // Stamp Badges
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
    borderColor: '#00C48C',
    transform: [{ rotate: '-14deg' }],
  },
  likeBadgeText: {
    fontFamily: Typography.fontHeading,
    color: '#00C48C',
    fontSize: 24,
    letterSpacing: 2,
    fontWeight: '800',
  },
  passBadge: {
    right: 24,
    borderColor: '#FF3B30',
    transform: [{ rotate: '14deg' }],
  },
  passBadgeText: {
    fontFamily: Typography.fontHeading,
    color: '#FF3B30',
    fontSize: 24,
    letterSpacing: 2,
    fontWeight: '800',
  },

  // Bottom Sticky Actions
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
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPass: {
    backgroundColor: '#1E222B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  btnInterested: {
    backgroundColor: Colors.primary,
  },
  actionLabel: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#8E95A5',
    fontWeight: '600',
  },

  // Empty Deck View
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
