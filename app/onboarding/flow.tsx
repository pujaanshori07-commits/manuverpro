import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  PanResponder,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_STEPS = 5;

// Available sports catalog - Aligned strictly with edit-profile.tsx SPORT_TAG_MAP
const SPORTS_CATALOG = [
  { id: 'badminton', name: 'Badminton', icon: 'tennisball-outline' as const },
  { id: 'lari', name: 'Lari', icon: 'walk-outline' as const },
  { id: 'gym', name: 'Gym / Fitness', icon: 'barbell-outline' as const },
  { id: 'futsal', name: 'Futsal', icon: 'football-outline' as const },
  { id: 'minisoccer', name: 'Mini Soccer', icon: 'football-outline' as const },
  { id: 'basket', name: 'Basket', icon: 'basketball-outline' as const },
  { id: 'voli', name: 'Voli', icon: 'basketball-outline' as const },
  { id: 'tenis', name: 'Tenis', icon: 'tennisball-outline' as const },
  { id: 'sepeda', name: 'Bersepeda', icon: 'bicycle-outline' as const },
  { id: 'yoga', name: 'Yoga', icon: 'body-outline' as const },
  { id: 'renang', name: 'Berenang', icon: 'water-outline' as const },
];

const EXPERIENCE_OPTIONS = [
  { id: '< 6 bln', label: '< 6 bulan' },
  { id: '6 bln-1 thn', label: '6 bln – 1 thn' },
  { id: '1-3 thn', label: '1 – 3 tahun' },
  { id: '3+ thn', label: '3+ tahun' },
];

export default function OnboardingFlowScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { refreshProfile } = useAuth();

  // Current Step (0 to 4)
  const [currentStep, setCurrentStep] = useState(0);

  // Onboarding Form States
  const [houseRulesAccepted, setHouseRulesAccepted] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>(['badminton', 'lari']);
  const [sportExperience, setSportExperience] = useState<Record<string, string>>({
    badminton: '1-3 thn',
    lari: '6 bln-1 thn',
  });
  const [ageRange, setAgeRange] = useState<[number, number]>([20, 32]);
  const [genderPref, setGenderPref] = useState<'all' | 'men' | 'women'>('all');
  const [submitting, setSubmitting] = useState(false);

  // Radar Pulse Animation Shared Values
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);

  useEffect(() => {
    // Continuous staggered pulsing radar rings
    pulse1.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false);
    setTimeout(() => {
      pulse2.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false);
    }, 800);
    setTimeout(() => {
      pulse3.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false);
    }, 1600);
  }, []);

  const goToStep = (stepIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCurrentStep(stepIndex);
    scrollRef.current?.scrollTo({ x: stepIndex * SCREEN_WIDTH, animated: true });
  };

  const handleNext = () => {
    if (currentStep === 0 && !houseRulesAccepted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Syarat & Ketentuan', 'Silakan setujui House Rules sebelum melanjutkan.');
      return;
    }
    if (currentStep === 1 && selectedSports.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Pilih Olahraga', 'Pilih minimal 1 olahraga favoritmu.');
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    } else {
      if (router.canGoBack()) router.back();
    }
  };

  const toggleSport = (sportId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedSports((prev) => {
      const exists = prev.includes(sportId);
      if (exists) {
        return prev.filter((id) => id !== sportId);
      } else {
        if (!sportExperience[sportId]) {
          setSportExperience((exp) => ({ ...exp, [sportId]: '1-3 thn' }));
        }
        return [...prev, sportId];
      }
    });
  };

  const setExperienceForSport = (sportId: string, level: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSportExperience((prev) => ({ ...prev, [sportId]: level }));
  };

  const finishOnboarding = async () => {
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      // Structure selected sports and experience into JSON array
      const sportsPayload = selectedSports.map((sportId) => ({
        sport_id: sportId,
        experience: sportExperience[sportId] || '1-3 thn',
      }));

      // Call the atomic Supabase RPC
      const { data, error } = await supabase.rpc('complete_user_onboarding', {
        p_primary_sport: selectedSports[0] || 'badminton',
        p_sports: sportsPayload,
        p_age_pref_min: ageRange[0],
        p_age_pref_max: ageRange[1],
        p_gender_pref: genderPref,
        p_location_granted: true,
        p_latitude: null, // Pass device coordinates if expo-location is used
        p_longitude: null,
      });

      if (error) {
        console.error('Error completing onboarding:', error.message);
        Alert.alert('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan preferensimu. Silakan coba lagi.');
        return;
      }

      // Refresh user profile in app context and redirect to Discover
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Unexpected onboarding error:', err);
      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Dual Thumb Slider PanResponder for Age Range (Step 4) ---
  const SLIDER_WIDTH = SCREEN_WIDTH - 64;
  const MIN_AGE = 18;
  const MAX_AGE = 50;

  const ageToX = (age: number) => {
    return ((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * SLIDER_WIDTH;
  };
  const xToAge = (x: number) => {
    const raw = MIN_AGE + (x / SLIDER_WIDTH) * (MAX_AGE - MIN_AGE);
    return Math.round(Math.max(MIN_AGE, Math.min(MAX_AGE, raw)));
  };

  const [panMin] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const currentMinX = ageToX(ageRange[0]);
        const newX = currentMinX + gestureState.dx;
        const newAge = xToAge(newX);
        if (newAge < ageRange[1] && newAge >= MIN_AGE) {
          setAgeRange([newAge, ageRange[1]]);
        }
      },
    })
  );

  const [panMax] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const currentMaxX = ageToX(ageRange[1]);
        const newX = currentMaxX + gestureState.dx;
        const newAge = xToAge(newX);
        if (newAge > ageRange[0] && newAge <= MAX_AGE) {
          setAgeRange([ageRange[0], newAge]);
        }
      },
    })
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F1118', '#0B0D13', '#08090D']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Header & Segmented Progress Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {currentStep + 1} / {TOTAL_STEPS}
            </Text>
          </View>
        </View>

        {/* Bumble-style Segmented Progress Bar */}
        <View style={styles.segmentedProgressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
            const isActive = index <= currentStep;
            return (
              <View key={index} style={styles.progressSegmentTrack}>
                <View
                  style={[
                    styles.progressSegmentFill,
                    isActive && styles.progressSegmentActive,
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false} // Only advances via verified next buttons
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
      >
        {/* ========================================================= */}
        {/* SCREEN 1: HOUSE RULES (Frosted Glassmorphism Card)         */}
        {/* ========================================================= */}
        <View style={styles.carouselSlide}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.slideScrollContent}
          >
            <View style={styles.titleSection}>
              <View style={styles.brandIconWrapper}>
                <Text style={styles.brandLetter}>M</Text>
              </View>
              <Text style={styles.heroTitle}>Selamat Datang di{'\n'}MANUVER</Text>
              <Text style={styles.heroSubtitle}>
                Sebelum mulai, bacalah standar komunitas kami agar olahraga bareng tetap seru, aman, dan saling menghormati.
              </Text>
            </View>

            {/* Glassmorphic Rules Container */}
            <View style={styles.glassCard}>
              <View style={styles.ruleRow}>
                <View style={styles.ruleIconPill}>
                  <Ionicons name="shield-checkmark" size={18} color="#FF5A2A" />
                </View>
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleHeading}>Keamanan & Privasi</Text>
                  <Text style={styles.ruleBody}>
                    Data pribadimu terlindungi. Lokasi presisimu tidak akan pernah dibagikan ke orang lain.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleRow}>
                <View style={styles.ruleIconPill}>
                  <Ionicons name="heart" size={18} color="#FF5A2A" />
                </View>
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleHeading}>Komunitas Sportif</Text>
                  <Text style={styles.ruleBody}>
                    Hormati jadwal sparring, tepati waktu permainan, dan jangan ghosting partner olahraga.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleRow}>
                <View style={styles.ruleIconPill}>
                  <Ionicons name="people" size={18} color="#FF5A2A" />
                </View>
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleHeading}>Zero Harassment</Text>
                  <Text style={styles.ruleBody}>
                    Pelecehan atau perilaku tidak pantas akan berakibat pada pemblokiran akun permanen.
                  </Text>
                </View>
              </View>
            </View>

            {/* Checkbox agreement */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setHouseRulesAccepted(!houseRulesAccepted);
              }}
              style={styles.checkboxAgreementRow}
            >
              <View style={[styles.checkboxBox, houseRulesAccepted && styles.checkboxBoxChecked]}>
                {houseRulesAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                Saya menyetujui <Text style={styles.highlightText}>Syarat & Ketentuan</Text> serta{' '}
                <Text style={styles.highlightText}>Kebijakan Privasi</Text> MANUVER.
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ========================================================= */}
        {/* SCREEN 2: SPORTS SELECTION (Grid of Big Bouncing Pills)    */}
        {/* ========================================================= */}
        <View style={styles.carouselSlide}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.slideScrollContent}
          >
            <View style={styles.titleSection}>
              <View style={styles.chipTag}>
                <Text style={styles.chipTagText}>PILIH OLAHRAGA</Text>
              </View>
              <Text style={styles.heroTitle}>Apa Olahraga{'\n'}Favoritmu?</Text>
              <Text style={styles.heroSubtitle}>
                Pilih cabang olahraga yang sering kamu mainkan untuk mencocokkan dengan teman satu circle.
              </Text>
            </View>

            <View style={styles.sportsGrid}>
              {SPORTS_CATALOG.map((sport) => {
                const isSelected = selectedSports.includes(sport.id);
                return (
                  <SportPill
                    key={sport.id}
                    sport={sport}
                    isSelected={isSelected}
                    onPress={() => toggleSport(sport.id)}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ========================================================= */}
        {/* SCREEN 3: EXPERIENCE LEVEL (Progressive per Selected Sport)*/}
        {/* ========================================================= */}
        <View style={styles.carouselSlide}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.slideScrollContent}
          >
            <View style={styles.titleSection}>
              <View style={styles.chipTag}>
                <Text style={styles.chipTagText}>SKILL LEVEL</Text>
              </View>
              <Text style={styles.heroTitle}>Seberapa Sering{'\n'}Kamu Berlatih?</Text>
              <Text style={styles.heroSubtitle}>
                Kami menggunakan data ini agar kamu menemukan lawan sparring yang seimbang dan seru.
              </Text>
            </View>

            {selectedSports.map((sportId) => {
              const sportObj = SPORTS_CATALOG.find((s) => s.id === sportId);
              const sportName = sportObj ? sportObj.name : sportId;
              const currentExp = sportExperience[sportId] || '1-3 thn';

              return (
                <View key={sportId} style={styles.experienceCard}>
                  <View style={styles.experienceCardHeader}>
                    <Ionicons
                      name={sportObj?.icon || 'fitness-outline'}
                      size={18}
                      color="#FF5A2A"
                    />
                    <Text style={styles.experienceCardTitle}>
                      Sudah berapa lama bermain <Text style={{ color: '#FF5A2A' }}>{sportName}</Text>?
                    </Text>
                  </View>

                  <View style={styles.experiencePillsRow}>
                    {EXPERIENCE_OPTIONS.map((opt) => {
                      const isChosen = currentExp === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => setExperienceForSport(sportId, opt.id)}
                          style={[
                            styles.expPill,
                            isChosen && styles.expPillSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.expPillText,
                              isChosen && styles.expPillTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ========================================================= */}
        {/* SCREEN 4: PREFERENCES (Custom Dual-Thumb Age Slider)      */}
        {/* ========================================================= */}
        <View style={styles.carouselSlide}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.slideScrollContent}
          >
            <View style={styles.titleSection}>
              <View style={styles.chipTag}>
                <Text style={styles.chipTagText}>PREFERENSI PARTNER</Text>
              </View>
              <Text style={styles.heroTitle}>Kriteria Partner{'\n'}Olahraga</Text>
              <Text style={styles.heroSubtitle}>
                Sesuaikan rentang usia dan preferensi partner yang ingin kamu temukan di feed Discover.
              </Text>
            </View>

            {/* Custom Dual-Thumb Age Slider Card */}
            <View style={styles.preferenceCard}>
              <View style={styles.prefHeaderRow}>
                <Text style={styles.prefSectionTitle}>Rentang Usia</Text>
                <Text style={styles.prefValueDisplay}>
                  {ageRange[0]} – {ageRange[1]} tahun
                </Text>
              </View>

              {/* Slider Track Container */}
              <View style={styles.sliderWrapper}>
                <View style={styles.sliderTrackBackground} />
                {/* Active Highlight Range */}
                <View
                  style={[
                    styles.sliderTrackActive,
                    {
                      left: ageToX(ageRange[0]),
                      width: Math.max(0, ageToX(ageRange[1]) - ageToX(ageRange[0])),
                    },
                  ]}
                />

                {/* Left Thumb (Min Age) */}
                <View
                  {...panMin.panHandlers}
                  style={[
                    styles.sliderThumb,
                    { left: ageToX(ageRange[0]) - 14 },
                  ]}
                >
                  <View style={styles.sliderThumbInner} />
                </View>

                {/* Right Thumb (Max Age) */}
                <View
                  {...panMax.panHandlers}
                  style={[
                    styles.sliderThumb,
                    { left: ageToX(ageRange[1]) - 14 },
                  ]}
                >
                  <View style={styles.sliderThumbInner} />
                </View>
              </View>

              <View style={styles.sliderLabelsRow}>
                <Text style={styles.sliderLabelText}>18 thn</Text>
                <Text style={styles.sliderLabelText}>35 thn</Text>
                <Text style={styles.sliderLabelText}>50+ thn</Text>
              </View>
            </View>

            {/* Gender Preference */}
            <View style={styles.preferenceCard}>
              <Text style={styles.prefSectionTitle}>Tampilkan Partner</Text>
              <View style={styles.genderOptionsRow}>
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'men', label: 'Pria' },
                  { id: 'women', label: 'Wanita' },
                ].map((item) => {
                  const isSelected = genderPref === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setGenderPref(item.id as any);
                      }}
                      style={[
                        styles.genderPill,
                        isSelected && styles.genderPillSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderPillText,
                          isSelected && styles.genderPillTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* ========================================================= */}
        {/* SCREEN 5: LOCATION RADAR (Concentric Pulsing Animation)   */}
        {/* ========================================================= */}
        <View style={styles.carouselSlide}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.slideScrollContent}
          >
            {/* Center Pulsing Radar Animation */}
            <View style={styles.radarContainer}>
              <RadarRing pulse={pulse1} />
              <RadarRing pulse={pulse2} />
              <RadarRing pulse={pulse3} />

              {/* Simulated Nearby Buddy Pins */}
              <View style={[styles.nearbyBuddyPin, { top: 32, right: 38 }]}>
                <Ionicons name="walk" size={12} color="#FFFFFF" />
                <Text style={styles.nearbyBuddyText}>1.2 km</Text>
              </View>
              <View style={[styles.nearbyBuddyPin, { bottom: 44, left: 32 }]}>
                <Ionicons name="barbell" size={12} color="#FFFFFF" />
                <Text style={styles.nearbyBuddyText}>2.8 km</Text>
              </View>

              {/* Center Radar Compass Pointer */}
              <View style={styles.radarCenterCore}>
                <LinearGradient
                  colors={['#FF6B35', '#FF5A2A']}
                  style={styles.radarCompassGradient}
                >
                  <Ionicons name="navigate" size={26} color="#FFFFFF" />
                </LinearGradient>
              </View>
            </View>

            <View style={[styles.titleSection, { marginTop: 24 }]}>
              <View style={styles.chipTag}>
                <Text style={styles.chipTagText}>PRECISE MATCHING</Text>
              </View>
              <Text style={styles.heroTitle}>Aktifkan Akses{'\n'}Lokasi</Text>
              <Text style={styles.heroSubtitle}>
                MANUVER menggunakan lokasimu untuk menampilkan teman olahraga terdekat di sekitarmu — mulai dari lapangan badminton, gym, hingga rute lari terdekat.
              </Text>
            </View>

            {/* Privacy Feature Highlights */}
            <View style={styles.glassCard}>
              <View style={styles.ruleRow}>
                <View style={styles.ruleIconPill}>
                  <Ionicons name="shield-checkmark" size={16} color="#FF5A2A" />
                </View>
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleHeading}>Privasi Terjaga</Text>
                  <Text style={styles.ruleBody}>
                    Lokasi spesifikmu tidak pernah dibagikan, hanya perkiraan jarak radius kilometer.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleRow}>
                <View style={styles.ruleIconPill}>
                  <Ionicons name="notifications" size={16} color="#FF5A2A" />
                </View>
                <View style={styles.ruleTextContainer}>
                  <Text style={styles.ruleHeading}>Notifikasi Partner Baru</Text>
                  <Text style={styles.ruleBody}>
                    Dapatkan info instan saat ada orang baru yang ingin olahraga bareng di sekitarmu.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View
        style={[
          styles.bottomStickyBar,
          { paddingBottom: Math.max(insets.bottom + 12, 28) },
        ]}
      >
        <Pressable
          onPress={handleNext}
          disabled={submitting}
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
            <Text style={styles.primaryButtonText}>
              {currentStep === TOTAL_STEPS - 1
                ? submitting
                  ? 'Menyiapkan Akun...'
                  : 'Aktifkan & Mulai'
                : currentStep === 0
                ? 'Setuju & Lanjut'
                : 'Lanjutkan'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        {currentStep === TOTAL_STEPS - 1 && (
          <Pressable
            onPress={finishOnboarding}
            style={styles.skipButton}
          >
            <Text style={styles.skipButtonText}>Nanti Saja</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// --- Dynamic Bouncing Sport Pill Component ---
function SportPill({
  sport,
  isSelected,
  onPress,
}: {
  sport: { id: string; name: string; icon: keyof typeof Ionicons.glyphMap };
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Quick, satisfying bounce
    scale.value = withSpring(0.92, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    });
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.sportPillBase,
          isSelected ? styles.sportPillSelected : styles.sportPillUnselected,
        ]}
      >
        <Ionicons
          name={sport.icon}
          size={18}
          color={isSelected ? '#FF5A2A' : '#8A8F9E'}
        />
        <Text
          style={[
            styles.sportPillText,
            isSelected ? styles.sportPillTextSelected : styles.sportPillTextUnselected,
          ]}
        >
          {sport.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// --- Expanding Radar Ring Component ---
function RadarRing({ pulse }: { pulse: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulse.value, [0, 1], [0.6, 2.2]);
    const opacity = interpolate(pulse.value, [0, 0.4, 1], [0.6, 0.25, 0]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return <Animated.View style={[styles.radarRing, animatedStyle]} />;
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D13',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E929E',
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  progressSegmentTrack: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressSegmentFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#FF5A2A',
  },
  progressSegmentActive: {
    width: '100%',
  },

  // Carousel
  carousel: {
    flex: 1,
  },
  carouselSlide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 120,
  },

  // Title Section
  titleSection: {
    marginBottom: 26,
  },
  brandIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandLetter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  chipTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 90, 42, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 42, 0.25)',
    marginBottom: 10,
  },
  chipTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF5A2A',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: Platform.OS === 'ios' ? '900' : 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#8E92A2',
  },

  // Step 1: House Rules Card
  glassCard: {
    backgroundColor: '#141720',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 18,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  ruleIconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 90, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ruleBody: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8A8F9E',
  },
  checkboxAgreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#FF5A2A',
    borderColor: '#FF5A2A',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#A0A4B0',
  },
  highlightText: {
    color: '#FF5A2A',
    fontWeight: '700',
  },

  // Step 2: Sports Grid
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportPillBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.2,
  },
  sportPillUnselected: {
    backgroundColor: '#151821',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportPillSelected: {
    backgroundColor: 'rgba(255, 90, 42, 0.14)',
    borderColor: '#FF5A2A',
  },
  sportPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sportPillTextUnselected: {
    color: '#C0C3CC',
  },
  sportPillTextSelected: {
    color: '#FF5A2A',
    fontWeight: '700',
  },

  // Step 3: Experience Cards
  experienceCard: {
    backgroundColor: '#141720',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  experienceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  experienceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E2EC',
    flex: 1,
  },
  experiencePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  expPillSelected: {
    backgroundColor: 'rgba(255, 90, 42, 0.18)',
    borderColor: '#FF5A2A',
  },
  expPillText: {
    fontSize: 12,
    color: '#8E929E',
    fontWeight: '600',
  },
  expPillTextSelected: {
    color: '#FF5A2A',
    fontWeight: '700',
  },

  // Step 4: Preferences & Dual-Thumb Slider
  preferenceCard: {
    backgroundColor: '#141720',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  prefHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  prefSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prefValueDisplay: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5A2A',
  },
  sliderWrapper: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 10,
  },
  sliderTrackBackground: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
  },
  sliderTrackActive: {
    position: 'absolute',
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF5A2A',
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  sliderThumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5A2A',
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 8,
  },
  sliderLabelText: {
    fontSize: 11,
    color: '#656A78',
  },
  genderOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  genderPillSelected: {
    backgroundColor: 'rgba(255, 90, 42, 0.18)',
    borderColor: '#FF5A2A',
  },
  genderPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8F9E',
  },
  genderPillTextSelected: {
    color: '#FF5A2A',
    fontWeight: '700',
  },

  // Step 5: Pulsing Radar
  radarContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#FF5A2A',
  },
  radarCenterCore: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0B0D13',
    padding: 4,
    shadowColor: '#FF5A2A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 10,
  },
  radarCompassGradient: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyBuddyPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(26, 29, 36, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  nearbyBuddyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Bottom Sticky Bar
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(11, 13, 19, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 14,
    gap: 8,
  },
  primaryButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF5A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
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
    fontWeight: '800',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#7D818E',
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
