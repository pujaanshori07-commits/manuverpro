import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Platform, Image, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useAuth } from './_layout';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Sport = { id: number; nama: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'] };

const COUNTRIES = [
  'Indonesia', 'Malaysia', 'Singapura', 'Thailand', 'Filipina', 'Vietnam', 
  'Brunei', 'Kamboja', 'Laos', 'Myanmar', 'India', 'Jepang', 
  'Korea Selatan', 'Tiongkok', 'Taiwan', 'Hong Kong'
];

const JENJANG_PENDIDIKAN = [
  'D3', 'S1', 'S2', 'S3', 'Lainnya'
];

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
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

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
  const [uploading, setUploading] = useState(false);
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
    setFotoUrl(profile.foto_url || null);

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
        const { data: allSports, error: sportsError } = await supabase.from('sports').select('id, nama, icon').order('nama', { ascending: true });
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

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin dibutuhkan', 'Maaf, kami membutuhkan akses galeri foto Anda untuk mengunggah foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Terjadi kesalahan', err.message);
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!session) return;
    setUploading(true);
    try {
      // 1. Membaca file sebagai string base64 via expo-file-system
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      // 2. Mengunggah ArrayBuffer yang didekodekan dari base64 ke Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 3. Ambil URL Publik
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Gunakan cache-busting timestamp agar gambar baru tidak diblokir oleh cache (layar tidak hitam/stale)
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      setFotoUrl(cacheBustedUrl);
      Alert.alert('Sukses', 'Foto profil berhasil diunggah!');
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Gagal mengunggah foto', err.message);
    } finally {
      setUploading(false);
    }
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

      // Gabungkan Jenjang dan Institusi Pendidikan
      let combinedPendidikan = null;
      if (jenjang || institusi.trim()) {
        combinedPendidikan = [jenjang, institusi.trim()].filter(Boolean).join(' - ');
      }

      // 1. Update profil
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
          foto_url: fotoUrl,
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
        <Text style={{ color: '#FFFFFF', textAlign: 'center', paddingHorizontal: 20 }}>{errorMsg}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#1D2028', borderRadius: 8 }} 
          onPress={() => {
             setErrorMsg(null);
             // Let the useEffect run again since it depends on session and profile,
             // or ideally we could just call loadData. To trigger it we can set loading true, 
             // but loadData is defined inside useEffect. So we'll just reload the screen.
             router.replace('/edit-profile');
          }}
        >
          <Text style={{ color: '#FFFFFF' }}>Try Again</Text>
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

      {/* Avatar Edit Section */}
      <View style={styles.avatarSection}>
        {uploading ? (
          <View style={styles.avatarPlaceholder}>
            <ActivityIndicator size="small" color="#FF5A2A" />
          </View>
        ) : fotoUrl ? (
          <Image source={{ uri: fotoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {nama ? nama.substring(0, 2).toUpperCase() : '??'}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage} disabled={uploading}>
          <Text style={styles.changePhotoText}>{uploading ? 'Mengunggah...' : 'Ubah Foto Profil'}</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs Section */}
      <View style={styles.inputsSection}>
        <Text style={styles.label}>Nama Lengkap / Panggilan</Text>
        <TextInput style={styles.input} placeholder="Nama Anda" placeholderTextColor="#666" value={nama} onChangeText={setNama} />

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
        <TextInput style={styles.input} placeholder="Kota tempat tinggal Anda" placeholderTextColor="#666" value={alamat} onChangeText={setAlamat} />

        {/* Pendidikan Section - Split */}
        <Text style={styles.label}>Jenjang Pendidikan (Opsional)</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowJenjangPicker(true)}>
          <Text style={styles.dropdownButtonText}>{jenjang || 'Pilih Jenjang'}</Text>
          <Ionicons name="chevron-down" size={20} color="#888A90" />
        </TouchableOpacity>

        <Text style={styles.label}>Nama Institusi Pendidikan (Opsional)</Text>
        <TextInput style={styles.input} placeholder="Contoh: Universitas Padjadjaran, SMAN 1 Bandung" placeholderTextColor="#666" value={institusi} onChangeText={setInstitusi} />

        <Text style={styles.label}>Pekerjaan</Text>
        <TextInput style={styles.input} placeholder="Contoh: Software Engineer, Mahasiswa" placeholderTextColor="#666" value={pekerjaan} onChangeText={setPekerjaan} />

        <Text style={styles.label}>Bio Singkat (Maks 150 Karakter)</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Ceritakan tentang Anda..." 
          placeholderTextColor="#666" 
          value={bio} 
          onChangeText={setBio} 
          maxLength={150} 
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Hobi & Minat</Text>
        <TextInput style={styles.input} placeholder="Hobi Anda" placeholderTextColor="#666" value={hobi} onChangeText={setHobi} />

        {/* Sports Chips */}
        <Text style={styles.label}>Minat Olahraga</Text>
        <View style={styles.sportsWrap}>
          {sports.map((sport) => {
            const active = selectedSports.includes(sport.id);
            return (
              <TouchableOpacity key={sport.id} style={[styles.sportChip, active && styles.sportChipActive]} onPress={() => toggleSport(sport.id)}>
                <MaterialCommunityIcons name={sport.icon || 'trophy-outline'} size={14} color={active ? '#FFFFFF' : '#888A90'} style={{ marginRight: 4 }} />
                <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>{sport.nama}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.sportChip, styles.addSportChip]} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.addSportChipText}>+ Tambah olahraga lain</Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || uploading}>
          <Text style={styles.saveButtonText}>{saving ? 'Menyimpan...' : 'Simpan Profil'}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Custom Sport */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Tambah Olahraga Lain</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Masukkan nama olahraga"
              placeholderTextColor="#666"
              value={customSportName}
              onChangeText={setCustomSportName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => {
                setIsModalVisible(false);
                setCustomSportName('');
              }}>
                <Text style={styles.modalButtonCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleAddCustomSport}>
                <Text style={styles.modalButtonSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Dropdown Negara */}
      <Modal visible={showNegaraPicker} transparent animationType="slide">
        <View style={styles.bottomSheetBackground}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Pilih Negara</Text>
              <TouchableOpacity onPress={() => setShowNegaraPicker(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetList}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.bottomSheetItem, negara === c && styles.bottomSheetItemActive]} 
                  onPress={() => {
                    setNegara(c);
                    setShowNegaraPicker(false);
                  }}
                >
                  <Text style={[styles.bottomSheetItemText, negara === c && styles.bottomSheetItemTextActive]}>{c}</Text>
                  {negara === c && <Ionicons name="checkmark" size={20} color="#FF5A2A" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Dropdown Jenjang Pendidikan */}
      <Modal visible={showJenjangPicker} transparent animationType="slide">
        <View style={styles.bottomSheetBackground}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Pilih Jenjang Pendidikan</Text>
              <TouchableOpacity onPress={() => setShowJenjangPicker(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetList}>
              {JENJANG_PENDIDIKAN.map((j) => (
                <TouchableOpacity 
                  key={j} 
                  style={[styles.bottomSheetItem, jenjang === j && styles.bottomSheetItemActive]} 
                  onPress={() => {
                    setJenjang(j);
                    setShowJenjangPicker(false);
                  }}
                >
                  <Text style={[styles.bottomSheetItemText, jenjang === j && styles.bottomSheetItemTextActive]}>{j}</Text>
                  {jenjang === j && <Ionicons name="checkmark" size={20} color="#FF5A2A" />}
                </TouchableOpacity>
              ))}
              {jenjang !== '' && (
                <TouchableOpacity 
                  style={[styles.bottomSheetItem, { borderTopWidth: 1, borderColor: '#2E323A' }]} 
                  onPress={() => {
                    setJenjang('');
                    setShowJenjangPicker(false);
                  }}
                >
                  <Text style={[styles.bottomSheetItemText, { color: '#F44336' }]}>Hapus Pilihan</Text>
                </TouchableOpacity>
              )}
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
    paddingTop: 60,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FF5A2A',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1C1F26',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5A2A',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  changePhotoButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: '#FF5A2A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputsSection: {
    paddingHorizontal: 24,
    marginTop: 12,
  },
  label: {
    color: '#E1E3E6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1A1D24',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2E323A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#1A1D24',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#2E323A',
  },
  dateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dropdownButton: {
    backgroundColor: '#1A1D24',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2E323A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  sportsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1D24',
    borderWidth: 1,
    borderColor: '#2E323A',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sportChipActive: {
    backgroundColor: '#FF5A2A',
    borderColor: '#FF5A2A',
  },
  sportChipText: {
    color: '#888A90',
    fontSize: 13,
    fontWeight: '500',
  },
  sportChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addSportChip: {
    borderStyle: 'dashed',
    borderColor: '#FF5A2A',
  },
  addSportChipText: {
    color: '#FF5A2A',
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF5A2A',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 36,
    alignItems: 'center',
    shadowColor: '#FF5A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Modal styles
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#1A1D24',
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2E323A',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#0B0D12',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2E323A',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2E323A',
  },
  modalButtonCancelText: {
    color: '#888A90',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonSave: {
    backgroundColor: '#FF5A2A',
  },
  modalButtonSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Bottom Sheet Picker styles (Negara & Jenjang)
  bottomSheetBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#1A1D24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#2E323A',
    borderBottomWidth: 0,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#2E323A',
  },
  bottomSheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSheetList: {
    flexGrow: 0,
  },
  bottomSheetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#2E323A',
  },
  bottomSheetItemActive: {
    backgroundColor: 'rgba(255, 90, 42, 0.05)',
  },
  bottomSheetItemText: {
    color: '#888A90',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSheetItemTextActive: {
    color: '#FF5A2A',
    fontWeight: 'bold',
  },
});
