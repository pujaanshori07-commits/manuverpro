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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_PHOTO_HEIGHT = Math.round(SCREEN_WIDTH * 1.25);

const DEMO_USER_DETAILS = {
  id: 'dinda-detail',
  nama: 'Dinda',
  umur: 24,
  pekerjaan: 'Brand Specialist at Tech Unicorn',
  alamat: 'Senopati, Jakarta Selatan',
  jarak: '3 km away',
  bio: 'Cari partner badminton santai atau sparring rutin di Jaksel / GBK. Biasanya lari pagi weekend di Sudirman atau gym malam sehabis kerja. Let’s stay active together! 💪🏸',
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85',
  ],
  favorite_venue: 'GBK Senayan Badminton Hall',
  preferred_time: 'Pagi (06:00 - 09:00)',
  sports: [
    { name: 'Badminton', level: 'Menengah', experience: '1–3 tahun' },
    { name: 'Running', level: 'Rutin', experience: '6 bln–1 thn' },
    { name: 'Gym & Fitness', level: 'Pemula', experience: '< 6 bulan' },
  ],
};

export default function UserDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { name, avatar } = useLocalSearchParams();

  const [activePhotoIdx] = useState(0);

  const user = {
    ...DEMO_USER_DETAILS,
    nama: (name as string) || DEMO_USER_DETAILS.nama,
    photos: avatar ? [avatar as string, ...DEMO_USER_DETAILS.photos.slice(1)] : DEMO_USER_DETAILS.photos,
  };

  const handleReport = () => {
    Alert.alert('Laporkan Profil', 'Pilih alasan untuk melaporkan partner ini ke tim pengawas.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Perilaku Tidak Sopan', style: 'destructive', onPress: () => Alert.alert('Terima kasih', 'Laporan kamu sedang ditinjau.') },
      { text: 'Spam atau Akun Palsu', style: 'destructive', onPress: () => Alert.alert('Terima kasih', 'Laporan kamu sedang ditinjau.') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Top Back & Report Controls */}
      <View style={[styles.floatingNav, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.circleIconBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.circleIconBtn}
          onPress={handleReport}
          activeOpacity={0.8}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Main Hero Photo */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: user.photos[activePhotoIdx] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(11, 13, 19, 0.4)', 'transparent', 'rgba(11, 13, 19, 0.95)', '#0B0D13']}
            locations={[0, 0.45, 0.85, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.heroNameText}>
                {user.nama}, {user.umur}
              </Text>
              <View style={styles.verifiedCheck}>
                <Ionicons name="checkmark-sharp" size={13} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={Colors.primary} />
              <Text style={styles.locationText}>
                {user.alamat} • {user.jarak}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio & About Me */}
        <View style={styles.bodySection}>
          <Text style={styles.sectionHeading}>TENTANG SAYA</Text>
          <Text style={styles.bioBody}>{user.bio}</Text>
        </View>

        {/* Sports & Skill Matrix */}
        <View style={styles.bodySection}>
          <Text style={styles.sectionHeading}>CABANG OLAHRAGA & KETERAMPILAN</Text>
          <View style={styles.sportsGrid}>
            {user.sports.map((sp, idx) => (
              <View key={idx} style={styles.sportCard}>
                <View style={styles.sportCardTop}>
                  <View style={styles.sportIconWrap}>
                    <Ionicons name="fitness" size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.sportCardTitle}>{sp.name}</Text>
                </View>
                <View style={styles.sportBadgeRow}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>Level: {sp.level}</Text>
                  </View>
                  <Text style={styles.sportCardExp}>{sp.experience}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Preferred Routine & Venue */}
        <View style={styles.bodySection}>
          <Text style={styles.sectionHeading}>RUTINITAS & LOKASI FAVORIT</Text>
          
          <View style={styles.routineRow}>
            <View style={styles.routineIconWrap}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routineTitle}>Jadwal Aktif</Text>
              <Text style={styles.routineSub}>{user.preferred_time}</Text>
            </View>
          </View>

          <View style={styles.routineRow}>
            <View style={styles.routineIconWrap}>
              <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.routineTitle}>Venue Sering Dikunjungi</Text>
              <Text style={styles.routineSub}>{user.favorite_venue}</Text>
            </View>
          </View>
        </View>

        {/* Secondary Story Photo */}
        {user.photos.length > 1 && (
          <View style={styles.bodySection}>
            <Text style={styles.sectionHeading}>GALERI AKTIVITAS</Text>
            <View style={styles.storyPhotoCard}>
              <Image
                source={{ uri: user.photos[1] }}
                style={styles.secondaryStoryPhoto}
                resizeMode="cover"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom CTA with Orange Glow */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <LinearGradient
          colors={['transparent', 'rgba(11, 13, 19, 0.95)', '#0B0D13']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={styles.chatActionBtn}
          onPress={() => router.back()}
          activeOpacity={0.88}
        >
          <Ionicons name="chatbubbles" size={19} color={Colors.white} />
          <Text style={styles.chatActionBtnText}>Kirim Pesan & Sparing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  floatingNav: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  circleIconBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(11, 13, 19, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_PHOTO_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroInfo: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.base,
    right: Spacing.base,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  heroNameText: {
    fontFamily: Typography.fontHeading,
    fontSize: 27,
    fontWeight: '700',
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
  bodySection: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.xl,
  },
  sectionHeading: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  bioBody: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: '#E1E4F0',
    lineHeight: 23,
  },
  sportsGrid: {
    gap: 10,
  },
  sportCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sportCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sportIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.pillBgActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportCardTitle: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  sportBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.pillBgActive,
  },
  levelBadgeText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: Colors.primary,
  },
  sportCardExp: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  routineIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 87, 47, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineTitle: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  routineSub: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  storyPhotoCard: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  secondaryStoryPhoto: {
    width: '100%',
    height: 240,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingTop: 16,
    zIndex: 40,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: BorderRadius.round,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 8,
  },
  chatActionBtnText: {
    fontFamily: Typography.fontSemiBold,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
