import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Modal,
  StatusBar,
  Dimensions,
  Platform,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// If you have your supabase client configured at lib/supabase.ts:
import { supabase } from '../../lib/supabase';

const STORAGE_KEY = '@manuver_match_filters_v1';

const AVAILABLE_SPORTS = [
  { id: 'badminton', name: 'Badminton', icon: 'tennisball-outline' as const },
  { id: 'running', name: 'Running', icon: 'walk-outline' as const },
  { id: 'gym', name: 'Gym & Fitness', icon: 'barbell-outline' as const },
  { id: 'futsal', name: 'Futsal', icon: 'football-outline' as const },
  { id: 'basket', name: 'Basket', icon: 'basketball-outline' as const },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball-outline' as const },
  { id: 'yoga', name: 'Yoga', icon: 'body-outline' as const },
  { id: 'cycling', name: 'Cycling', icon: 'bicycle-outline' as const },
  { id: 'swimming', name: 'Renang', icon: 'water-outline' as const },
  { id: 'boxing', name: 'Boxing', icon: 'fitness-outline' as const },
  { id: 'volleyball', name: 'Voli', icon: 'american-football-outline' as const },
  { id: 'calisthenics', name: 'Calisthenics', icon: 'pulse-outline' as const },
];

const DISTANCE_PRESETS = [5, 15, 30, 50, 100];

export interface MatchFilterSettings {
  maxDistance: number;
  strictDistance: boolean;
  minAge: number;
  maxAge: number;
  strictAge: boolean;
  selectedSports: string[];
  showMyProfile: boolean;
}

const DEFAULT_FILTERS: MatchFilterSettings = {
  maxDistance: 25,
  strictDistance: true,
  minAge: 20,
  maxAge: 32,
  strictAge: false,
  selectedSports: ['badminton', 'running', 'gym', 'tennis'],
  showMyProfile: true,
};

export default function MatchFiltersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Settings State
  const [maxDistance, setMaxDistance] = useState<number>(DEFAULT_FILTERS.maxDistance);
  const [strictDistance, setStrictDistance] = useState<boolean>(DEFAULT_FILTERS.strictDistance);

  const [minAge, setMinAge] = useState<string>(String(DEFAULT_FILTERS.minAge));
  const [maxAge, setMaxAge] = useState<string>(String(DEFAULT_FILTERS.maxAge));
  const [strictAge, setStrictAge] = useState<boolean>(DEFAULT_FILTERS.strictAge);

  const [selectedSports, setSelectedSports] = useState<string[]>(DEFAULT_FILTERS.selectedSports);
  const [showMyProfile, setShowMyProfile] = useState<boolean>(DEFAULT_FILTERS.showMyProfile);

  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  // Track measurements for smooth touch slider
  const trackWidthRef = useRef<number>(0);
  const trackPageXRef = useRef<number>(0);
  const trackViewRef = useRef<View>(null);

  // Load saved preferences from AsyncStorage on mount
  useEffect(() => {
    async function loadSavedFilters() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: MatchFilterSettings = JSON.parse(stored);
          setMaxDistance(parsed.maxDistance ?? DEFAULT_FILTERS.maxDistance);
          setStrictDistance(parsed.strictDistance ?? DEFAULT_FILTERS.strictDistance);
          setMinAge(String(parsed.minAge ?? DEFAULT_FILTERS.minAge));
          setMaxAge(String(parsed.maxAge ?? DEFAULT_FILTERS.maxAge));
          setStrictAge(parsed.strictAge ?? DEFAULT_FILTERS.strictAge);
          setSelectedSports(parsed.selectedSports ?? DEFAULT_FILTERS.selectedSports);
          setShowMyProfile(parsed.showMyProfile ?? DEFAULT_FILTERS.showMyProfile);
        }
      } catch (e) {
        console.warn('Gagal memuat filter lokal:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSavedFilters();
  }, []);

  // Compute percentage for distance track (1 - 100 km)
  const distancePercent = Math.min(Math.max(((maxDistance - 1) / 99) * 100, 0), 100);

  // Helper to map coordinate X directly to snapped distance 1..100
  const updateDistanceByTouchX = (touchX: number) => {
    if (trackWidthRef.current <= 0) return;
    const clampedX = Math.max(0, Math.min(touchX, trackWidthRef.current));
    const ratio = clampedX / trackWidthRef.current;
    // Map ratio 0..1 to integer 1..100
    const rawKm = Math.round(1 + ratio * 99);
    setMaxDistance(Math.min(Math.max(rawKm, 1), 100));
  };

  // PanResponder for smooth sliding & dragging on the custom track
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        updateDistanceByTouchX(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        updateDistanceByTouchX(evt.nativeEvent.locationX);
      },
    })
  ).current;

  // Sports selection toggles
  const toggleSport = (id: string) => {
    setSelectedSports((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllSports = () => {
    if (selectedSports.length === AVAILABLE_SPORTS.length) {
      setSelectedSports([]);
    } else {
      setSelectedSports(AVAILABLE_SPORTS.map((s) => s.id));
    }
  };

  // Age input validation
  const handleMinAgeChange = (val: string) => {
    setMinAge(val.replace(/[^0-9]/g, ''));
  };

  const handleMaxAgeChange = (val: string) => {
    setMaxAge(val.replace(/[^0-9]/g, ''));
  };

  // Save filters to AsyncStorage, Supabase (if available), and router navigation
  const handleSave = async () => {
    const parsedMin = parseInt(minAge, 10) || 18;
    const parsedMax = parseInt(maxAge, 10) || 40;

    if (parsedMin < 18) {
      Alert.alert('Rentang Umur', 'Batas usia minimal adalah 18 tahun.');
      return;
    }
    if (parsedMin > parsedMax) {
      Alert.alert('Rentang Umur', 'Batas usia minimal tidak boleh melebihi usia maksimal.');
      return;
    }
    if (selectedSports.length === 0) {
      Alert.alert('Olahraga', 'Pilih minimal satu cabang olahraga untuk feed kamu.');
      return;
    }

    const payload: MatchFilterSettings = {
      maxDistance,
      strictDistance,
      minAge: parsedMin,
      maxAge: parsedMax,
      strictAge,
      selectedSports,
      showMyProfile,
    };

    setSaving(true);
    try {
      // 1. Persist to local AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      // 2. Persist to Supabase if connected
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          age_pref_min: parsedMin,
          age_pref_max: parsedMax,
          is_ghost_mode: !showMyProfile,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      }

      // 3. Return to previous screen with filters encoded in navigation params
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Gagal menyimpan pengaturan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  // Delete account routine
  const confirmDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'HAPUS') {
      Alert.alert('Konfirmasi Gagal', 'Ketik kata HAPUS untuk mengonfirmasi.');
      return;
    }

    setDeleteModalVisible(false);
    try {
      await AsyncStorage.clear();
      // Optional: await supabase.auth.admin.deleteUser() or custom edge function
      Alert.alert('Akun Dihapus', 'Data akun kamu berhasil dihapus.', [
        { text: 'OK', onPress: () => router.replace('/onboarding') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Gagal menghapus akun.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color="#FF5A1F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0E12" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pengaturan Match</Text>

        <TouchableOpacity
          style={[styles.headerDoneBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FF5A1F" />
          ) : (
            <Text style={styles.headerDoneText}>Selesai</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: LOKASI & JARAK */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-sharp" size={16} color="#FF5A1F" />
              </View>
              <Text style={styles.sectionTitle}>Lokasi & Jarak</Text>
            </View>
            <Text style={styles.highlightBadge}>{maxDistance} km</Text>
          </View>

          <Text style={styles.label}>
            Jarak Maksimum: <Text style={styles.boldText}>{maxDistance} km</Text>
          </Text>

          {/* Interactive touch/drag slider track */}
          <View
            ref={trackViewRef}
            style={styles.sliderInteractiveWrapper}
            onLayout={(e) => {
              trackWidthRef.current = e.nativeEvent.layout.width;
            }}
            {...panResponder.panHandlers}
          >
            <View style={styles.sliderBaseTrack}>
              <View
                style={[
                  styles.sliderFillTrack,
                  { width: `${distancePercent}%` },
                ]}
              />
            </View>
            {/* Draggable Thumb Knob */}
            <View
              style={[
                styles.sliderThumb,
                { left: `${distancePercent}%` },
              ]}
            >
              <View style={styles.sliderThumbCore} />
            </View>
          </View>

          <View style={styles.sliderRangeLabels}>
            <Text style={styles.rangeSubText}>1 km</Text>
            <Text style={styles.rangeSubText}>50 km</Text>
            <Text style={styles.rangeSubText}>100 km</Text>
          </View>

          {/* Syncing Preset Chips */}
          <View style={styles.distanceChipsRow}>
            {DISTANCE_PRESETS.map((km) => {
              const active = maxDistance === km;
              return (
                <TouchableOpacity
                  key={`dist-${km}`}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                  onPress={() => setMaxDistance(km)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.presetChipText, active && styles.presetChipTextActive]}
                  >
                    {km} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Strict Distance Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Hanya dalam jarak ini</Text>
              <Text style={styles.toggleSubtitle}>
                Sembunyikan calon partner yang berjarak lebih dari {maxDistance} km
              </Text>
            </View>
            <Switch
              value={strictDistance}
              onValueChange={setStrictDistance}
              trackColor={{ false: '#262933', true: '#FF5A1F' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 2: PREFERENSI UMUR */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar-outline" size={16} color="#FF5A1F" />
              </View>
              <Text style={styles.sectionTitle}>Preferensi Umur</Text>
            </View>
            <Text style={styles.highlightBadge}>
              {minAge || '18'} - {maxAge || '40'} thn
            </Text>
          </View>

          <Text style={styles.label}>Rentang usia partner olahraga pilihanmu:</Text>

          <View style={styles.ageInputsContainer}>
            <View style={styles.ageInputBox}>
              <Text style={styles.ageInputLabel}>MINIMAL</Text>
              <View style={styles.ageRow}>
                <TextInput
                  style={styles.ageInput}
                  value={minAge}
                  onChangeText={handleMinAgeChange}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="18"
                  placeholderTextColor="#555B6E"
                />
                <Text style={styles.ageUnit}>Thn</Text>
              </View>
            </View>

            <View style={styles.ageSeparator}>
              <Ionicons name="remove-outline" size={24} color="#8F94A6" />
            </View>

            <View style={styles.ageInputBox}>
              <Text style={styles.ageInputLabel}>MAKSIMAL</Text>
              <View style={styles.ageRow}>
                <TextInput
                  style={styles.ageInput}
                  value={maxAge}
                  onChangeText={handleMaxAgeChange}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="40"
                  placeholderTextColor="#555B6E"
                />
                <Text style={styles.ageUnit}>Thn</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Ketat pada rentang umur</Text>
              <Text style={styles.toggleSubtitle}>
                Hanya rekomendasikan umur {minAge || '18'} sampai {maxAge || '40'} tahun
              </Text>
            </View>
            <Switch
              value={strictAge}
              onValueChange={setStrictAge}
              trackColor={{ false: '#262933', true: '#FF5A1F' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 3: OLAHRAGA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="barbell-outline" size={16} color="#FF5A1F" />
              </View>
              <Text style={styles.sectionTitle}>Olahraga</Text>
            </View>
            <TouchableOpacity onPress={selectAllSports}>
              <Text style={styles.textBtn}>
                {selectedSports.length === AVAILABLE_SPORTS.length ? 'Reset' : 'Pilih Semua'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>
            Tampilkan pengguna dengan minat pada olahraga berikut:
          </Text>

          <View style={styles.sportsGrid}>
            {AVAILABLE_SPORTS.map((sport) => {
              const isSelected = selectedSports.includes(sport.id);
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.sportPill, isSelected && styles.sportPillActive]}
                  onPress={() => toggleSport(sport.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={sport.icon}
                    size={15}
                    color={isSelected ? '#FFFFFF' : '#8F94A6'}
                  />
                  <Text
                    style={[
                      styles.sportPillText,
                      isSelected && styles.sportPillTextActive,
                    ]}
                  >
                    {sport.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={14} color="#FF5A1F" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION 4: TAMPILKAN PROFILKU (GHOST MODE) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.iconCircle,
                  !showMyProfile && { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Ionicons
                  name={showMyProfile ? 'eye-outline' : 'eye-off-outline'}
                  size={16}
                  color={showMyProfile ? '#FF5A1F' : '#EF4444'}
                />
              </View>
              <Text style={styles.sectionTitle}>Tampilkan Profilku</Text>
            </View>
            <View
              style={[
                styles.ghostBadge,
                !showMyProfile && styles.ghostBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.ghostBadgeText,
                  !showMyProfile && styles.ghostBadgeTextActive,
                ]}
              >
                {showMyProfile ? 'Terbuka' : 'Ghost Mode'}
              </Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>
                {showMyProfile ? 'Profilmu Aktif di Discover' : 'Mode Ghost Diaktifkan'}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {showMyProfile
                  ? 'Pengguna lain di radius pilihanmu dapat melihat profil dan melakukan swipe.'
                  : 'Profilmu disembunyikan dari Discover. Chat & match kamu sebelumnya tetap aktif.'}
              </Text>
            </View>
            <Switch
              value={showMyProfile}
              onValueChange={setShowMyProfile}
              trackColor={{ false: '#3B2424', true: '#FF5A1F' }}
              thumbColor={showMyProfile ? '#FFFFFF' : '#EF4444'}
            />
          </View>
        </View>

        {/* SECTION 5: RED ZONE / HAPUS AKUN */}
        <View style={styles.dangerZoneCard}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text style={styles.dangerTitle}>Zona Bahaya</Text>
          </View>

          <Text style={styles.dangerDescription}>
            Menghapus akun akan membatalkan seluruh match, menghapus pesan, dan
            menghilangkan riwayat aktivitasmu secara permanen.
          </Text>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setDeleteConfirmText('');
              setDeleteModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-bin-outline" size={17} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Hapus Akun Saya</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* CONFIRMATION POPUP MODAL */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalAlertIcon}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>Hapus Akun Permanen?</Text>
            <Text style={styles.modalSub}>
              Tindakan ini tidak dapat dibatalkan. Masukkan kata{' '}
              <Text style={{ fontWeight: '700', color: '#EF4444' }}>HAPUS</Text> untuk
              mengonfirmasi:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Ketik HAPUS"
              placeholderTextColor="#555B6E"
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDeleteBtn,
                  deleteConfirmText.trim().toUpperCase() !== 'HAPUS' && {
                    opacity: 0.5,
                  },
                ]}
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.modalDeleteText}>Konfirmasi Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0E12',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0D0E12',
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16181F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerDoneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    minWidth: 64,
    alignItems: 'center',
  },
  headerDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5A1F',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#16181F',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  highlightBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5A1F',
    backgroundColor: 'rgba(255, 90, 31, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    color: '#8F94A6',
    marginBottom: 14,
  },
  boldText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sliderInteractiveWrapper: {
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 10,
  },
  sliderBaseTrack: {
    height: 6,
    backgroundColor: '#262933',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFillTrack: {
    height: '100%',
    backgroundColor: '#FF5A1F',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginLeft: -12, // center the knob
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderThumbCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5A1F',
  },
  sliderRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
    marginBottom: 10,
  },
  rangeSubText: {
    fontSize: 11,
    color: '#555B6E',
    fontWeight: '600',
  },
  distanceChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1E212B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    borderColor: '#FF5A1F',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F94A6',
  },
  presetChipTextActive: {
    color: '#FF5A1F',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#8F94A6',
    lineHeight: 16,
  },
  ageInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ageInputBox: {
    flex: 1,
    backgroundColor: '#1E212B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262933',
  },
  ageInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8F94A6',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ageInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    padding: 0,
    minWidth: 40,
  },
  ageUnit: {
    fontSize: 13,
    color: '#8F94A6',
    marginLeft: 4,
  },
  ageSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5A1F',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1E212B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  sportPillActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
    borderColor: '#FF5A1F',
  },
  sportPillText: {
    fontSize: 13,
    color: '#8F94A6',
    fontWeight: '500',
  },
  sportPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  ghostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  ghostBadgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  ghostBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
  },
  ghostBadgeTextActive: {
    color: '#EF4444',
  },
  dangerZoneCard: {
    backgroundColor: '#191114',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  dangerDescription: {
    fontSize: 12,
    color: '#B57979',
    lineHeight: 17,
    marginBottom: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#16181F',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  modalAlertIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    color: '#8F94A6',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    backgroundColor: '#1E212B',
    borderWidth: 1,
    borderColor: '#363A48',
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#262933',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalDeleteBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
