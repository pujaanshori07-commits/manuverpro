import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useAuth } from './_layout';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GRID_GAP = 10;
const SLOT_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

type Sport = {
  id: number;
  nama: string;
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
};

const COUNTRIES = [
  'Indonesia', 'Malaysia', 'Singapura', 'Thailand', 'Filipina', 'Vietnam',
  'Brunei', 'Kamboja', 'Laos', 'Myanmar', 'India', 'Jepang',
  'Korea Selatan', 'Tiongkok', 'Taiwan', 'Hong Kong',
];

const JENJANG_PENDIDIKAN = ['D3', 'S1', 'S2', 'S3', 'Lainnya'];
const MAX_PHOTOS = 6;

export default function EditProfileScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [nama, setNama] = useState('');
  const [date, setDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [alamat, setAlamat] = useState('');
  const [hobi, setHobi] = useState('');
  const [pekerjaan, setPekerjaan] = useState('');
  const [bio, setBio] = useState('');

  // Multi-Photo state (up to 6 photos)
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  // Form Fields
  const [negara, setNegara] = useState('Indonesia');
  const [showNegaraPicker, setShowNegaraPicker] = useState(false);
  const [jenjang, setJenjang] = useState('');
  const [showJenjangPicker, setShowJenjangPicker] = useState(false);
  const [institusi, setInstitusi] = useState('');

  // Sports list & user selected sports
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSports, setSelectedSports] = useState<number[]>([]);

  // Add custom sport modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customSportName, setCustomSportName] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !profile) return;

    // Load initial profile data
    setNama(profile.nama || '');
    setAlamat(profile.alamat || '');
    setNegara(profile.negara || 'Indonesia');
    setHobi(profile.hobi || '');
    setPekerjaan(profile.pekerjaan || '');
    setBio(profile.bio || '');

    // Initialize photos array (fallback to foto_url if photos column is not populated yet)
    const rawPhotos = (profile as any)?.photos;
    if (Array.isArray(rawPhotos) && rawPhotos.length > 0) {
      setPhotos(rawPhotos.slice(0, MAX_PHOTOS));
    } else if (profile.foto_url) {
      setPhotos([profile.foto_url]);
    } else {
      setPhotos([]);
    }

    // Parsing pendidikan
    if (profile.pendidikan) {
      const idx = profile.pendidikan.indexOf(' - ');
      if (idx !== -1) {
        const possibleJenjang = profile.pendidikan.substring(0, idx);
        if (JENJANG_PENDIDIKAN.includes(possibleJenjang)) {
          setJenjang(possibleJenjang);
          setInstitusi(profile.pendidikan.substring(idx + 3));
        } else {
          setJenjang('');
          setInstitusi(profile.pendidikan);
        }
      } else {
        if (JENJANG_PENDIDIKAN.includes(profile.pendidikan)) {
          setJenjang(profile.pendidikan);
          setInstitusi('');
        } else {
          setJenjang('');
          setInstitusi(profile.pendidikan);
        }
      }
    } else {
      setJenjang('');
      setInstitusi('');
    }

    if (profile.tanggal_lahir) {
      setDate(new Date(profile.tanggal_lahir));
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch all sports
        const { data: allSports, error: sportsError } = await supabase
          .from('sports')
          .select('id, nama, icon')
          .order('nama', { ascending: true });
        if (sportsError) throw sportsError;
        if (allSports) setSports(allSports as Sport[]);

        // Fetch user selected sports IDs
        const { data: userSportsData, error: userSportsError } = await supabase
          .from('user_sports')
          .select('sport_id')
          .eq('user_id', session.user.id);

        if (userSportsError) throw userSportsError;

        if (userSportsData) {
          const ids = userSportsData.map((us) => us.sport_id);
          setSelectedSports(ids);
        }
      } catch (err: any) {
        console.error('Error loading edit profile data:', err);
        setErrorMsg(err.message || 'Gagal memuat profil. Coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session, profile]);

  const toggleSport = (id: number) => {
    setSelectedSports((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  };

  // Pick an image and immediately upload it
  const handlePickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Batas Maksimal', `Kamu dapat mengunggah maksimal ${MAX_PHOTOS} foto.`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Izin dibutuhkan',
          'Maaf, kami membutuhkan akses galeri foto untuk menambahkan foto profil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const nextIndex = photos.length;
        uploadImage(result.assets[0].uri, nextIndex);
      }
    } catch (err: any) {
      Alert.alert('Terjadi kesalahan', err.message);
    }
  };

  const uploadImage = async (imageUri: string, targetSlot: number) => {
    if (!session) return;
    setUploadingSlot(targetSlot);
    try {
      // 1. Read base64 via expo-file-system
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `photo_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Get public URL with timestamp cache-buster
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      setPhotos((prev) => [...prev, cacheBustedUrl]);
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Gagal mengunggah foto', err.message);
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    Alert.alert(
      'Hapus Foto',
      'Apakah kamu yakin ingin menghapus foto ini dari profilmu?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
          },
        },
      ]
    );
  };

  const handleAddCustomSport = async () => {
    const trimmedSport = customSportName.trim();
    if (!trimmedSport) return Alert.alert('Nama olahraga tidak boleh kosong');

    try {
      const { data: existing, error: checkError } = await supabase
        .from('sports')
        .select('id, nama')
        .ilike('nama', trimmedSport);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        const matchedSport = existing[0];
        if (!selectedSports.includes(matchedSport.id)) {
          setSelectedSports((prev) => [...prev, matchedSport.id]);
        }
        setIsModalVisible(false);
        setCustomSportName('');
        return;
      }

      const { data: newSport, error: insertError } = await supabase
        .from('sports')
        .insert({ nama: trimmedSport })
        .select()
        .single();

      if (insertError) throw insertError;

      if (newSport) {
        setSports((prev) => [...prev, newSport].sort((a, b) => a.nama.localeCompare(b.nama)));
        setSelectedSports((prev) => [...prev, newSport.id]);
      }

      setIsModalVisible(false);
      setCustomSportName('');
    } catch (err: any) {
      Alert.alert('Gagal menambah olahraga', err.message);
    }
  };

  const handleSave = async () => {
    if (!session || !profile) return;
    if (!nama.trim()) return Alert.alert('Nama tidak boleh kosong');

    const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) return Alert.alert('Umur belum cukup', 'Usia minimal adalah 18 tahun');

    if (selectedSports.length === 0) return Alert.alert('Pilih minimal satu olahraga');

    setSaving(true);
    try {
      const tanggalLahir = date.toISOString().split('T')[0];

      let combinedPendidikan = null;
      if (jenjang || institusi.trim()) {
        combinedPendidikan = [jenjang, institusi.trim()].filter(Boolean).join(' - ');
      }

      // Primary avatar is the first photo in the array
      const primaryAvatar = photos.length > 0 ? photos[0] : null;

      // 1. Update profil with both photos array and legacy foto_url
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nama: nama.trim(),
          tanggal_lahir: tanggalLahir,
          alamat: alamat.trim(),
          negara: negara,
          hobi: hobi.trim(),
          pendidikan: combinedPendidikan,
          pekerjaan: pekerjaan.trim() || null,
          bio: bio.trim() || null,
          foto_url: primaryAvatar,
          photos: photos,
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 2. Sync user_sports
      const { error: deleteSportsError } = await supabase
        .from('user_sports')
        .delete()
        .eq('user_id', session.user.id);

      if (deleteSportsError) throw deleteSportsError;

      const rows = selectedSports.map((sportId) => ({
        user_id: session.user.id,
        sport_id: sportId,
      }));

      const { error: insertSportsError } = await supabase.from('user_sports').insert(rows);
      if (insertSportsError) throw insertSportsError;

      Alert.alert('Berhasil', 'Profil Anda berhasil diperbarui!');
      await refreshProfile();
      router.back();
    } catch (err: any) {
      Alert.alert('Gagal menyimpan profil', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF5A2A" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#FF5A2A', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
        <Text style={{ color: '#888A90', textAlign: 'center', marginHorizontal: 20 }}>{errorMsg}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FF5A2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT PROFIL</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Modern 3x2 Photo Grid Section */}
      <View style={styles.photoGridSection}>
        <View style={styles.photoGridHeader}>
          <Text style={styles.photoGridTitle}>FOTO PROFIL & AKTIVITAS</Text>
          <Text style={styles.photoGridSubtitle}>
            Unggah hingga 6 foto. Foto pertama adalah foto utama di Discover.
          </Text>
        </View>

        <View style={styles.photoGrid}>
          {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
            const photoUrl = photos[index];
            const isUploading = uploadingSlot === index;
            const isFirstSlot = index === 0;

            if (photoUrl) {
              return (
                <View key={index} style={[styles.photoSlot, isFirstSlot && styles.photoSlotPrimary]}>
                  <Image source={{ uri: photoUrl }} style={styles.slotImage} resizeMode="cover" />
                  
                  {/* Primary Hero Label */}
                  {isFirstSlot && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Utama</Text>
                    </View>
                  )}

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.deleteBadge}
                    onPress={() => handleRemovePhoto(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.photoSlot,
                  styles.emptyPhotoSlot,
                  isFirstSlot && styles.photoSlotPrimary,
                ]}
                onPress={handlePickImage}
                disabled={uploadingSlot !== null}
                activeOpacity={0.7}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FF5A2A" />
                ) : (
                  <>
                    <View style={styles.addIconCircle}>
                      <Ionicons name="add" size={20} color="#FF5A2A" />
                    </View>
                    {isFirstSlot && (
                      <Text style={styles.addSlotHelperText}>Foto Utama</Text>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Form Inputs Section */}
      <View style={styles.inputsSection}>
        <Text style={styles.label}>Nama Lengkap / Panggilan</Text>
        <TextInput
          style={styles.input}
          placeholder="Nama Anda"
          placeholderTextColor="#666"
          value={nama}
          onChangeText={setNama}
        />

        <Text style={styles.label}>Tanggal Lahir</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonText}>{date.toISOString().split('T')[0]}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            themeVariant="dark"
            maximumDate={new Date()}
          />
        )}

        <Text style={styles.label}>Negara</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowNegaraPicker(true)}>
          <Text style={styles.dropdownButtonText}>{negara}</Text>
          <Ionicons name="chevron-down" size={20} color="#888A90" />
        </TouchableOpacity>

        <Text style={styles.label}>Domisili / Kota</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Jakarta Selatan, Surabaya"
          placeholderTextColor="#666"
          value={alamat}
          onChangeText={setAlamat}
        />

        <Text style={styles.label}>Pendidikan</Text>
        <View style={styles.educationRow}>
          <TouchableOpacity
            style={[styles.dropdownButton, styles.jenjangButton]}
            onPress={() => setShowJenjangPicker(true)}
          >
            <Text style={styles.dropdownButtonText}>{jenjang || 'Jenjang'}</Text>
            <Ionicons name="chevron-down" size={16} color="#888A90" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, styles.institusiInput]}
            placeholder="Universitas / Sekolah"
            placeholderTextColor="#666"
            value={institusi}
            onChangeText={setInstitusi}
          />
        </View>

        <Text style={styles.label}>Pekerjaan</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Software Engineer, Mahasiswa"
          placeholderTextColor="#666"
          value={pekerjaan}
          onChangeText={setPekerjaan}
        />

        <Text style={styles.label}>Bio Singkat</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Ceritakan sedikit tentang dirimu dan olahraga favoritmu..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
          value={bio}
          onChangeText={setBio}
        />

        <Text style={styles.label}>Hobi & Minat Lainnya</Text>
        <TextInput
          style={styles.input}
          placeholder="Contoh: Musik, Fotografi, Ngopi"
          placeholderTextColor="#666"
          value={hobi}
          onChangeText={setHobi}
        />

        {/* Sports Matrix Section */}
        <View style={styles.sportsHeaderRow}>
          <Text style={styles.label}>Cabang Olahraga yang Dimainkan</Text>
          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Text style={styles.addSportText}>+ Lainnya</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sportsContainer}>
          {sports.map((sport) => {
            const isSelected = selectedSports.includes(sport.id);
            return (
              <TouchableOpacity
                key={sport.id}
                style={[styles.sportChip, isSelected && styles.sportChipSelected]}
                onPress={() => toggleSport(sport.id)}
                activeOpacity={0.7}
              >
                {sport.icon ? (
                  <MaterialCommunityIcons
                    name={sport.icon}
                    size={18}
                    color={isSelected ? '#FFFFFF' : '#888A90'}
                    style={{ marginRight: 6 }}
                  />
                ) : (
                  <Ionicons
                    name="fitness-outline"
                    size={18}
                    color={isSelected ? '#FFFFFF' : '#888A90'}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={[styles.sportChipText, isSelected && styles.sportChipTextSelected]}>
                  {sport.nama}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedSports.length === 0 && (
          <Text style={styles.errorHint}>Pilih minimal satu cabang olahraga.</Text>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (saving || uploadingSlot !== null) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || uploadingSlot !== null}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Custom Sport Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Olahraga Baru</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nama olahraga (misal: Wall Climbing)"
              placeholderTextColor="#666"
              value={customSportName}
              onChangeText={setCustomSportName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsModalVisible(false);
                  setCustomSportName('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleAddCustomSport}
              >
                <Text style={styles.modalButtonTextSave}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Selection Modal */}
      <Modal visible={showNegaraPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Pilih Negara</Text>
              <TouchableOpacity onPress={() => setShowNegaraPicker(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {COUNTRIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerItem}
                  onPress={() => {
                    setNegara(item);
                    setShowNegaraPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, negara === item && styles.pickerItemTextSelected]}>
                    {item}
                  </Text>
                  {negara === item && <Ionicons name="checkmark" size={20} color="#FF5A2A" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Education Level Selection Modal */}
      <Modal visible={showJenjangPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Pilih Jenjang</Text>
              <TouchableOpacity onPress={() => setShowJenjangPicker(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {JENJANG_PENDIDIKAN.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerItem}
                  onPress={() => {
                    setJenjang(item);
                    setShowJenjangPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, jenjang === item && styles.pickerItemTextSelected]}>
                    {item}
                  </Text>
                  {jenjang === item && <Ionicons name="checkmark" size={20} color="#FF5A2A" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0B0D12',
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0B0D12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1F26',
    backgroundColor: '#0B0D12',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  photoGridSection: {
    paddingHorizontal: GRID_PADDING,
    marginTop: 20,
    marginBottom: 8,
  },
  photoGridHeader: {
    marginBottom: 12,
  },
  photoGridTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  photoGridSubtitle: {
    color: '#888A90',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  photoSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE * 1.25,
    borderRadius: 14,
    backgroundColor: '#161920',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  photoSlotPrimary: {
    borderColor: 'rgba(255, 90, 42, 0.5)',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoSlot: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12141A',
  },
  addIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 90, 42, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlotHelperText: {
    color: '#888A90',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 6,
  },
  deleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 13, 18, 0.85)',
    borderWidth: 1,
    borderColor: '#FF5A2A',
  },
  mainBadgeText: {
    color: '#FF5A2A',
    fontSize: 10,
    fontWeight: '700',
  },
  inputsSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#161920',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#161920',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  dropdownButton: {
    backgroundColor: '#161920',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dropdownButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  educationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  jenjangButton: {
    flex: 1.2,
  },
  institusiInput: {
    flex: 2,
  },
  sportsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addSportText: {
    color: '#FF5A2A',
    fontSize: 13,
    fontWeight: '600',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161920',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportChipSelected: {
    backgroundColor: 'rgba(255, 90, 42, 0.16)',
    borderColor: '#FF5A2A',
  },
  sportChipText: {
    color: '#888A90',
    fontSize: 13,
    fontWeight: '500',
  },
  sportChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorHint: {
    color: '#FF3B30',
    fontSize: 11,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#FF5A2A',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 20,
    shadowColor: '#FF5A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#161920',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#0B0D12',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalButtonSave: {
    backgroundColor: '#FF5A2A',
  },
  modalButtonTextCancel: {
    color: '#888A90',
    fontSize: 13,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pickerModalContent: {
    backgroundColor: '#161920',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  pickerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerItemText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  pickerItemTextSelected: {
    color: '#FF5A2A',
    fontWeight: 'bold',
  },
});
