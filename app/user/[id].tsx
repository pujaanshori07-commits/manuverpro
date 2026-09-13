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
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_PHOTO_HEIGHT = 440;

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

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

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

      {/* Floating Top Back & Report Buttons */}
      <View style={[styles.floatingNav, { top: insets.top + 6 }]}>
        <TouchableOpacity style={styles.circleIconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleIconBtn} onPress={handleReport}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* Main Hero Photo */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: user.photos[activePhotoIdx] }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(9, 10, 13, 0.4)', 'transparent', 'rgba(9, 10, 13, 0.95)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.heroNameText}>
                {user.nama}, {user.umur}
              </Text>
              <Ionicons name="checkmark-circle" size={22} color="#00C48C" />
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={Colors.primary} />
              <Text style={styles.locationText}>
                {user.alamat} • {user.jarak}
              </Text>
            </View>
          </View>
        </View>

        {/* Bio & Personality */}
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
                  <Ionicons name="fitness-outline" size={18} color={Colors.primary} />
                  <Text style={styles.sportCardTitle}>{sp.name}</Text>
                </View>
                <Text style={styles.sportCardLevel}>Level: {sp.level}</Text>
                <Text style={styles.sportCardExp}>Pengalaman: {sp.experience}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Preferred Routine & Venue */}
        <View style={styles.bodySection}>
          <Text style={styles.sectionHeading}>RUTINITAS & LOKASI FAVORIT</Text>
          
          <View style={styles.routineRow}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routineTitle}>Jadwal Aktif</Text>
              <Text style={styles.routineSub}>{user.preferred_time}</Text>
            </View>
          </View>

          <View style={styles.routineRow}>
            <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
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
            <Image
              source={{ uri: user.photos[1] }}
              style={styles.secondaryStoryPhoto}
              resizeMode="cover"
            />
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.chatActionBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubbles-outline" size={18} color={Colors.white} />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 10, 13, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bodySection: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  bioBody: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  sportsGrid: {
    gap: 8,
  },
  sportCard: {
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  sportCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sportCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  sportCardLevel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  sportCardExp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  routineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  routineSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  secondaryStoryPhoto: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.md,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 10, 13, 0.95)',
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  chatActionBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
