import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from './_layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = Spacing.base;
const CARD_PADDING = Spacing.lg;
const GRID_GAP = Spacing.md;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2) - (CARD_PADDING * 2) - 2; // -2 for borders
const PHOTO_SIZE = Math.floor((AVAILABLE_WIDTH - GRID_GAP) / 2) - 1; // -1 for flex safety
const MAX_PHOTOS = 4;

const SPORTS_OPTIONS = [
  { id: 'Badminton', label: 'Badminton', icon: 'tennisball-outline' as const },
  { id: 'Running', label: 'Running', icon: 'walk-outline' as const },
  { id: 'Gym', label: 'Gym & Fitness', icon: 'barbell-outline' as const },
  { id: 'Futsal', label: 'Futsal', icon: 'football-outline' as const },
  { id: 'Mini Soccer', label: 'Mini Soccer', icon: 'football-outline' as const },
  { id: 'Basket', label: 'Basketball', icon: 'basketball-outline' as const },
  { id: 'Tennis', label: 'Tennis', icon: 'tennisball-outline' as const },
  { id: 'Padel', label: 'Padel', icon: 'tennisball-outline' as const },
  { id: 'Bicycle', label: 'Bersepeda', icon: 'bicycle-outline' as const },
  { id: 'Swimming', label: 'Berenang', icon: 'water-outline' as const },
  { id: 'Yoga', label: 'Yoga & Pilates', icon: 'flower-outline' as const },
  { id: 'Volleyball', label: 'Voli', icon: 'basketball-outline' as const },
  { id: 'Table Tennis', label: 'Tenis Meja', icon: 'tennisball-outline' as const },
  { id: 'Boxing', label: 'Boxing / Muay Thai', icon: 'body-outline' as const },
  { id: 'Martial Arts', label: 'Bela Diri', icon: 'body-outline' as const },
  { id: 'Golf', label: 'Golf', icon: 'golf-outline' as const },
  { id: 'Hiking', label: 'Mendaki', icon: 'trail-sign-outline' as const },
  { id: 'Wall Climbing', label: 'Wall Climbing', icon: 'analytics-outline' as const },
  { id: 'Calisthenics', label: 'Calisthenics', icon: 'barbell-outline' as const },
  { id: 'Zumba', label: 'Senam / Zumba', icon: 'musical-notes-outline' as const },
  { id: 'eSports', label: 'eSports', icon: 'game-controller-outline' as const },
  { id: 'Lainnya', label: 'Lainnya', icon: 'ellipsis-horizontal-outline' as const },
];

const SKILL_LEVELS = [
  { id: 'Casual', label: 'Casual / Fun', desc: 'Olahraga santai & membangun jejaring' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Rutin bermain & menguasai teknik' },
  { id: 'Kompetitif', label: 'Competitive', desc: 'Siap uji tanding dan sparing terukur' },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, refreshProfile } = useAuth();

  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState('Intermediate');
  const [saving, setSaving] = useState(false);
  const [customSport, setCustomSport] = useState('');
  const [isLainnyaActive, setIsLainnyaActive] = useState(false);

  // States for Custom Scrollbar
  const [contentHeight, setContentHeight] = useState(1);
  const [scrollViewHeight, setScrollViewHeight] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio || '');
    setLookingFor((profile as any).looking_for || '');
    setSkillLevel((profile as any).skill_level || 'Intermediate');

    const rawPhotos = (profile as any)?.photos;
    if (Array.isArray(rawPhotos) && rawPhotos.length > 0) {
      setPhotos(rawPhotos.slice(0, MAX_PHOTOS));
    } else if (profile.foto_url) {
      setPhotos([profile.foto_url]);
    } else {
      setPhotos([]);
    }

    let initialSports: string[] = [];
    if (Array.isArray(profile.hobi)) {
      initialSports = profile.hobi;
    } else if (typeof profile.hobi === 'string' && profile.hobi) {
      try {
        initialSports = JSON.parse(profile.hobi);
        if (!Array.isArray(initialSports)) throw new Error('Not array');
      } catch {
        initialSports = profile.hobi.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    
    const customOptions = initialSports.filter(s => !SPORTS_OPTIONS.some(o => o.id === s) && s !== 'Lainnya');
    if (customOptions.length > 0) {
      setIsLainnyaActive(true);
      setCustomSport(customOptions[0]);
      if (!initialSports.includes('Lainnya')) {
        initialSports.push('Lainnya');
      }
    }
    
    setSelectedSports(initialSports.filter(s => SPORTS_OPTIONS.some(o => o.id === s)));
  }, [profile]);

  const toggleSport = (sportId: string) => {
    if (sportId === 'Lainnya') {
      if (selectedSports.includes('Lainnya')) {
        setIsLainnyaActive(false);
        setCustomSport('');
        setSelectedSports(selectedSports.filter((id) => id !== 'Lainnya'));
      } else {
        if (selectedSports.length >= 4) {
          Alert.alert('Batas Olahraga', 'Pilih maksimal 4 cabang olahraga utama.');
          return;
        }
        setIsLainnyaActive(true);
        setSelectedSports([...selectedSports, 'Lainnya']);
      }
      return;
    }

    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter((id) => id !== sportId));
    } else {
      if (selectedSports.length >= 4) {
        Alert.alert('Batas Olahraga', 'Pilih maksimal 4 cabang olahraga utama.');
        return;
      }
      setSelectedSports([...selectedSports, sportId]);
    }
  };

  const handlePickImage = async () => {
    try {
      const remainingSlots = MAX_PHOTOS - photos.length;
      if (remainingSlots <= 0) {
        Alert.alert('Slot Penuh', 'Maksimal 4 foto sudah terisi.');
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Dibutuhkan', 'Izinkan akses foto untuk memilih gambar profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets) return;

      setUploadingIndex(-1); // Indicates global uploading state
      const userId = session?.user?.id;
      if (!userId) throw new Error('Sesi tidak valid');

      const uploadedUrls: string[] = [];

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        if (!asset.base64) continue;

        const fileName = `${userId}/${Date.now()}_img${i}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, decode(asset.base64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      setPhotos((prev) => {
        const newPhotos = [...prev, ...uploadedUrls];
        return newPhotos.slice(0, MAX_PHOTOS); // pastikan maksimal 4
      });
    } catch (err: any) {
      Alert.alert('Upload Gagal', err.message || 'Gagal mengunggah foto');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleMakePrimary = (index: number) => {
    if (index === 0) return; // Already primary
    setPhotos((prev) => {
      const newPhotos = [...prev];
      const selected = newPhotos[index];
      // Remove from current position and move to the front
      newPhotos.splice(index, 1);
      newPhotos.unshift(selected);
      return newPhotos;
    });
  };

  const handleSave = async () => {


    try {
      setSaving(true);
      const userId = session?.user?.id;
      if (!userId) throw new Error('Sesi kedaluwarsa');

      const primaryPhoto = photos[0] || profile?.foto_url || '';

      let finalSports = selectedSports.filter(s => s !== 'Lainnya');
      if (isLainnyaActive && customSport.trim()) {
        finalSports.push(customSport.trim());
      } else if (isLainnyaActive) {
        finalSports.push('Lainnya');
      }

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        bio: bio.trim(),
        looking_for: lookingFor.trim(),
        skill_level: skillLevel,
        hobi: finalSports,
        photos: photos,
        foto_url: primaryPhoto,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await refreshProfile();
      router.back();
    } catch (err: any) {
      Alert.alert('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.barTitle}>Edit Profil</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveAction}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveActionText}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >


        {/* Section 1: Photos */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Text style={Typography.sectionTitle}>Foto & Aktivitas</Text>
            <Text style={Typography.caption}>{photos.length}/4 Foto</Text>
          </View>
          <Text style={[Typography.metadata, { marginBottom: Spacing.base }]}>
            Foto pertama akan menjadi representasi utama profil olahragamu.
          </Text>

          <View style={styles.grid}>
            {Array.from({ length: MAX_PHOTOS }).map((_, idx) => {
              const photo = photos[idx];
              const isUploading = uploadingIndex === idx;
              const isPrimary = idx === 0;

              if (photo) {
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.photoCard, isPrimary && styles.photoCardPrimary]}
                    activeOpacity={0.9}
                    onPress={() => handleMakePrimary(idx)}
                  >
                    <Image source={{ uri: photo }} style={styles.photoImg} />
                    {isPrimary && (
                      <View style={styles.badgePrimary}>
                        <Text style={styles.badgePrimaryText}>Utama</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.btnRemove}
                      onPress={() => handleRemovePhoto(idx)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.photoCard, styles.photoCardEmpty, isPrimary && styles.photoCardPrimaryEmpty]}
                  onPress={handlePickImage}
                  disabled={uploadingIndex !== null}
                  activeOpacity={0.7}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons
                        name="add"
                        size={22}
                        color={isPrimary ? Colors.primary : Colors.textMuted}
                      />
                      <Text style={[styles.emptyLabel, isPrimary && { color: Colors.primary }]}>
                        {isPrimary ? 'Foto Utama' : 'Tambah'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 4: About / Bio */}
        <View style={styles.cardContainer}>
          <Text style={Typography.sectionTitle}>About me</Text>
          <Text style={[Typography.metadata, { marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
            Ceritakan preferensi latihan, jadwal kosong, atau gaya bermainmu.
          </Text>

          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tuliskan bio singkat..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Section 5: Looking For */}
        <View style={styles.cardContainer}>
          <Text style={Typography.sectionTitle}>Looking for</Text>
          <Text style={[Typography.metadata, { marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
            Apa yang kamu cari dari aplikasi ini? (Contoh: Teman lari, lawan sparring)
          </Text>

          <TextInput
            style={[styles.input, styles.bioInput]}
            value={lookingFor}
            onChangeText={setLookingFor}
            placeholder="Contoh: Mencari teman lari santai di akhir pekan..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>
      {/* Section 2: Sports Identity */}
        <View style={styles.cardContainer}>
          <Text style={Typography.sectionTitle}>My sports</Text>
          <Text style={[Typography.metadata, { marginTop: Spacing.xs, marginBottom: Spacing.md }]}>
            Pilih cabang olahraga yang aktif kamu mainkan.
          </Text>

          <View style={{ height: 190, borderWidth: 1, borderColor: '#272C38', borderRadius: 12, padding: Spacing.sm, flexDirection: 'row' }}>
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              onContentSizeChange={(_, h) => setContentHeight(h > 0 ? h : 1)}
              onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height > 0 ? e.nativeEvent.layout.height : 1)}
              onScroll={(e) => setScrollOffset(e.nativeEvent.contentOffset.y)}
            >
              <View style={styles.chipsRow}>
                {SPORTS_OPTIONS.map((sport) => {
                  const active = selectedSports.includes(sport.id);
                  return (
                    <TouchableOpacity
                      key={sport.id}
                      style={[styles.sportChip, active && styles.sportChipActive]}
                      onPress={() => toggleSport(sport.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={sport.icon}
                        size={15}
                        color={active ? Colors.primary : Colors.textSecondary}
                        style={{ marginRight: Spacing.xs }}
                      />
                      <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>
                        {sport.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Custom Thick Scrollbar */}
            {contentHeight > scrollViewHeight && (
              <View style={{ width: 6, backgroundColor: '#181C26', borderRadius: 3, marginLeft: Spacing.sm }}>
                <View 
                  style={{ 
                    width: 6, 
                    borderRadius: 3, 
                    backgroundColor: '#6C727F', // Gray color like user requested
                    height: Math.max(scrollViewHeight * (scrollViewHeight / contentHeight), 30), // Minimum thumb height
                    transform: [{ 
                      translateY: scrollOffset * ((scrollViewHeight - Math.max(scrollViewHeight * (scrollViewHeight / contentHeight), 30)) / (contentHeight - scrollViewHeight || 1))
                    }]
                  }} 
                />
              </View>
            )}
          </View>

          {isLainnyaActive && (
            <TextInput
              style={[styles.input, { marginTop: Spacing.md }]}
              value={customSport}
              onChangeText={setCustomSport}
              placeholder="Ketik olahraga lainnya (Misal: Golf, Renang)"
              placeholderTextColor={Colors.textMuted}
            />
          )}

          <Text style={[Typography.sectionTitle, { marginTop: Spacing.xl, fontSize: 17 }]}>
            Level Permainan
          </Text>
          <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
            {SKILL_LEVELS.map((lvl) => {
              const active = skillLevel === lvl.id;
              return (
                <TouchableOpacity
                  key={lvl.id}
                  style={[styles.skillBox, active && styles.skillBoxActive]}
                  onPress={() => setSkillLevel(lvl.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioCircle, active && styles.radioCircleActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.skillTitle, active && { color: Colors.textPrimary }]}>
                      {lvl.label}
                    </Text>
                    <Text style={styles.skillDesc}>{lvl.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

                </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  barTitle: {
    ...Typography.sectionTitle,
    fontSize: 18,
  },
  saveAction: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
  },
  saveActionText: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: '#FFFFFF',
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.25,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.elevatedSurface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    position: 'relative',
  },
  photoCardPrimary: {
    borderColor: Colors.primary,
  },
  photoCardEmpty: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCardPrimaryEmpty: {
    borderColor: 'rgba(255, 90, 54, 0.4)',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  badgePrimary: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePrimaryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Lato_700Bold',
    textTransform: 'uppercase',
  },
  btnRemove: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(8, 10, 15, 0.75)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLabel: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chipBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.chipBorder,
  },
  sportChipActive: {
    backgroundColor: Colors.chipBgActive,
    borderColor: Colors.chipBorderActive,
  },
  sportChipText: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: Colors.textSecondary,
  },
  sportChipTextActive: {
    color: Colors.textPrimary,
  },
  skillBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevatedSurface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  skillBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 90, 54, 0.05)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  skillTitle: {
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    color: Colors.textSecondary,
  },
  skillDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  fieldGroup: {
    marginTop: Spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surfaceInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  bioInput: {
    height: 96,
    textAlignVertical: 'top',
  },
});
