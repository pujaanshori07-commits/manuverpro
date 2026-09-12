import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 440;

interface SportSkill {
  name: string;
  level: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const DEMO_USER_DETAILS = {
  id: 'dinda-detail',
  nama: 'Dinda',
  umur: 24,
  pekerjaan: 'Brand Specialist at Tech Unicorn',
  pendidikan: 'Universitas Indonesia',
  alamat: 'Senopati, Jakarta Selatan',
  jarak: '3 km away',
  bio: 'Cari partner badminton santai atau sparring rutin di Jaksel / GBK. Biasanya lari pagi weekend di Sudirman atau gym malam sehabis kerja. Let’s stay active together! 💪🏸',
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85',
  ],
  sports: [
    { name: 'Badminton', level: '1–3 tahun', icon: 'tennisball-outline' },
    { name: 'Running', level: '6 bln–1 thn', icon: 'walk-outline' },
    { name: 'Gym & Fitness', level: '3+ tahun', icon: 'barbell-outline' },
    { name: 'Tennis', level: '< 6 bulan', icon: 'baseball-outline' },
  ] as SportSkill[],
  preferences: {
    waktuAktif: ['Pagi (06-10)', 'Malam (18-22)'],
    tipeLatihan: 'Santai & Serius',
    frekuensi: '2-3x / minggu',
    genderPref: 'Semua',
    usiaPref: '22 – 32 tahun',
  },
  lifestyle: ['Non-smoker', 'Early Bird', 'Coffee Addict', 'Weekend Runner'],
};

export default function UserDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(
      event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activePhotoIndex) {
      setActivePhotoIndex(slide);
    }
  };

  const handleAction = (action: 'pass' | 'superlike' | 'like') => {
    if (action === 'like') {
      router.replace({
        pathname: '/match-celebration',
        params: {
          name: DEMO_USER_DETAILS.nama,
          partnerAvatar: DEMO_USER_DETAILS.photos[0],
          chatId: 'chat-new',
        },
      });
    } else {
      router.back();
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Laporkan atau Blokir Profil',
      'Pilih tindakan yang ingin kamu ambil untuk akun ini.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Blokir Pengguna',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Pengguna Diblokir', 'Kamu tidak akan melihat akun ini lagi.');
            router.back();
          },
        },
        {
          text: 'Laporkan Profil',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Terima Kasih', 'Laporanmu telah diterima dan sedang ditinjau.');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Top Nav (Back Button & More Options) */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + Spacing.xs }]}>
        <TouchableOpacity
          style={styles.headerGlassBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={24} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerGlassBtn}
          onPress={handleReport}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= 1. PHOTO CAROUSEL AREA ================= */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {DEMO_USER_DETAILS.photos.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Bottom Gradient Fade */}
          <LinearGradient
            colors={['transparent', 'rgba(9, 10, 13, 0.45)', Colors.background]}
            locations={[0.5, 0.8, 1.0]}
            style={styles.carouselGradient}
          />

          {/* Carousel Pagination Indicator Dots */}
          <View style={styles.paginationRow}>
            {DEMO_USER_DETAILS.photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activePhotoIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Floating Action Buttons over Image Bottom-Right */}
          <View style={styles.floatingActionRow}>
            {/* Pass / Dislike */}
            <TouchableOpacity
              style={[styles.floatingCircleBtn, styles.passBtn]}
              onPress={() => handleAction('pass')}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color={Colors.danger} />
            </TouchableOpacity>

            {/* Superlike */}
            <TouchableOpacity
              style={[styles.floatingCircleBtn, styles.starBtn]}
              onPress={() => handleAction('superlike')}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={20} color={Colors.white} />
            </TouchableOpacity>

            {/* Like */}
            <TouchableOpacity
              style={[styles.floatingCircleBtn, styles.likeBtn]}
              onPress={() => handleAction('like')}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================= 2. BIO & IDENTITY DETAILS ================= */}
        <View style={styles.profileBody}>
          {/* Name, Age & Verified Badge */}
          <View style={styles.nameHeaderRow}>
            <View style={styles.nameWrap}>
              <Text style={styles.nameText}>
                {DEMO_USER_DETAILS.nama}, {DEMO_USER_DETAILS.umur}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={12} color={Colors.white} />
              </View>
            </View>
            <View style={styles.activePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.activePillText}>Online Sekarang</Text>
            </View>
          </View>

          {/* Distance and Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color={Colors.primary} />
            <Text style={styles.locationText}>
              {DEMO_USER_DETAILS.alamat} •{' '}
              <Text style={styles.distanceHighlight}>{DEMO_USER_DETAILS.jarak}</Text>
            </Text>
          </View>

          {/* Occupation & Education Pills */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="briefcase-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaBadgeText}>{DEMO_USER_DETAILS.pekerjaan}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="school-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaBadgeText}>{DEMO_USER_DETAILS.pendidikan}</Text>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeaderTitle}>TENTANG SAYA</Text>
            <Text style={styles.bioText}>{DEMO_USER_DETAILS.bio}</Text>
          </View>

          {/* ================= 3. SPORTS PROFILE (FROM QUESTIONNAIRE) ================= */}
          <View style={styles.infoCard}>
            <View style={styles.cardTitleWithIcon}>
              <Ionicons name="fitness" size={18} color={Colors.primary} />
              <Text style={styles.cardHeaderTitle}>SPORTS PROFILE & SKILLS</Text>
            </View>

            <View style={styles.sportSkillsGrid}>
              {DEMO_USER_DETAILS.sports.map((sport, index) => (
                <View key={index} style={styles.sportSkillCard}>
                  <View style={styles.sportIconWrap}>
                    <Ionicons name={sport.icon} size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.sportSkillInfo}>
                    <Text style={styles.sportSkillName}>{sport.name}</Text>
                    <Text style={styles.sportSkillExp}>{sport.level}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ================= 4. TRAINING & SCHEDULE PREFERENCES ================= */}
          <View style={styles.infoCard}>
            <View style={styles.cardTitleWithIcon}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.cardHeaderTitle}>PREFERENSI PARTNER & JADWAL</Text>
            </View>

            <View style={styles.prefGrid}>
              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>Waktu Olahraga</Text>
                <View style={styles.prefTagsWrap}>
                  {DEMO_USER_DETAILS.preferences.waktuAktif.map((w, idx) => (
                    <View key={idx} style={styles.prefPill}>
                      <Text style={styles.prefPillText}>{w}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>Tipe Latihan</Text>
                <Text style={styles.prefValue}>
                  {DEMO_USER_DETAILS.preferences.tipeLatihan}
                </Text>
              </View>

              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>Frekuensi</Text>
                <Text style={styles.prefValue}>
                  {DEMO_USER_DETAILS.preferences.frekuensi}
                </Text>
              </View>

              <View style={styles.prefRow}>
                <Text style={styles.prefLabel}>Rentang Usia Partner</Text>
                <Text style={styles.prefValue}>
                  {DEMO_USER_DETAILS.preferences.usiaPref}
                </Text>
              </View>
            </View>
          </View>

          {/* ================= 5. LIFESTYLE PILLS ================= */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeaderTitle}>LIFESTYLE & HABITS</Text>
            <View style={styles.lifestyleWrap}>
              {DEMO_USER_DETAILS.lifestyle.map((item, idx) => (
                <View key={idx} style={styles.lifestylePill}>
                  <Text style={styles.lifestyleText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ================= 6. REPORT & BLOCK ================= */}
          <View style={styles.reportSection}>
            <TouchableOpacity
              style={styles.reportGhostBtn}
              onPress={handleReport}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={16} color={Colors.danger} />
              <Text style={styles.reportGhostBtnText}>Laporkan atau Blokir Dinda</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  headerGlassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 10, 13, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollArea: {
    flex: 1,
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    position: 'relative',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
  },
  carouselGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  paginationRow: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.base,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  floatingActionRow: {
    position: 'absolute',
    bottom: 16,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  floatingCircleBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  passBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1D24',
    borderColor: '#2A2E38',
  },
  starBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  likeBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  profileBody: {
    paddingHorizontal: Spacing.base,
    gap: 16,
    marginTop: -8,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontFamily: Typography.fontHeading,
    fontSize: 28,
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activePillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    color: Colors.success,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  distanceHighlight: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontSemiBold,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(23, 26, 33, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  metaBadgeText: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: 'rgba(23, 26, 33, 0.65)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  bioText: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  sportSkillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportSkillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 17, 21, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minWidth: '47%',
  },
  sportIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 87, 47, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportSkillInfo: {
    gap: 2,
  },
  sportSkillName: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  sportSkillExp: {
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  prefGrid: {
    gap: 12,
  },
  prefRow: {
    gap: 6,
  },
  prefLabel: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textMuted,
  },
  prefValue: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  prefTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prefPill: {
    backgroundColor: 'rgba(255, 87, 47, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 47, 0.28)',
  },
  prefPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    color: Colors.primary,
  },
  lifestyleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lifestylePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lifestyleText: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reportSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  reportGhostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  reportGhostBtnText: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: Colors.danger,
  },
});
