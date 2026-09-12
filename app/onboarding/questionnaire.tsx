import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, 
  ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { COLORS, SIZES } from '../../constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const { width } = Dimensions.get('window');
const TOTAL_SLIDES = 15;


const EDUCATION_OPTIONS = ['🎓 Sedang Kuliah', '🎓 Baru Lulus', '📚 Lanjut Studi', '🎓 Pascasarjana', '🌍 Gap Year', '🏫 Pelajar'];
const WORK_OPTIONS = ['💼 Pegawai Tetap', '💻 Freelancer', '💼 Sambil Kuliah', '🚀 Wirausaha', '🔍 Pencari Kerja'];

export default function QuestionnaireScreen() {
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  // State for all answers
  const [nama, setNama] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState(new Date(2000, 0, 10));
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Custom date states for Android
  const [day, setDay] = useState('10');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState('2000');
  
  const [negara, setNegara] = useState('Indonesia');
  const [alamat, setAlamat] = useState('');
  
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  
  const [sports, setSports] = useState<any[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [customSportInput, setCustomSportInput] = useState('');
  const [showCustomSport, setShowCustomSport] = useState(false);
  
  const [skillLevel, setSkillLevel] = useState('');
  const [hobi, setHobi] = useState<string[]>([]);
  
  const [lookingFor1, setLookingFor1] = useState('');
  const [frequency, setFrequency] = useState('');
  const [waktu, setWaktu] = useState<string[]>([]);
  const [kepribadian, setKepribadian] = useState('');
  const [lookingFor2, setLookingFor2] = useState('');
  
  const [selectedBackgrounds, setSelectedBackgrounds] = useState<string[]>([]);
  
  const [bio, setBio] = useState('');

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase.from('sports').select('*');
      if (!error && data) {
        setSports(data);
      }
    } catch (e) {
      console.log('No sports table or error fetching sports', e);
    }
  };

  const handleCustomSport = async () => {
  if (!customSportInput.trim()) return;
  try {
    setSaving(true);
    const newSportName = customSportInput.trim();
    const { data, error } = await supabase.from('sports').insert([{ nama: newSportName, icon: '🏆' }]).select().single();
    if (error || !data) {
      throw error || new Error('Gagal menambahkan olahraga baru.');
    }
    // Tidak ada lagi fallback ID lokal (local_xxx): karena sport_id di DB
    // bertipe bigint, ID string palsu tidak pernah bisa benar-benar
    // tersimpan ke user_sports dan akan bikin seluruh RPC complete_onboarding
    // gagal saat submit terakhir. Kalau insert gagal, kasih tahu user saja.
    setSports([...sports, data]);
    toggleMulti(selectedSports, setSelectedSports, data.id, 5);
    setShowCustomSport(false);
    setCustomSportInput('');
  } catch (e: any) {
    Alert.alert('Gagal', 'Tidak bisa menambahkan olahraga baru saat ini. Coba pilih dari daftar yang tersedia, atau coba lagi nanti.');
  } finally {
    setSaving(false);
  }
};

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        setSaving(true);
        const uri = result.assets[0].uri;
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        
        const fileName = `${session?.user.id}-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, decode(base64), { contentType: 'image/jpeg' });
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setFotoUrl(publicUrl);
      } catch (error: any) {
        Alert.alert('Gagal', error.message || 'Gagal mengunggah foto');
      } finally {
        setSaving(false);
      }
    }
  };

  const toggleMulti = (arr: string[], setArr: any, item: string, max: number) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      if (arr.length < max) {
        setArr([...arr, item]);
      }
    }
  };

  const goToNextSlide = () => {
    setDirection('forward');
    setCurrentSlide(currentSlide + 1);
  };
  
  const goToPrevSlide = () => {
    setDirection('backward');
    if (currentSlide === 0) {
      router.back();
      return;
    }
    setCurrentSlide(currentSlide - 1);
  };

  // Navigasi antar slide sekarang murni lokal (tanpa network call).
// Semua jawaban tersimpan di state React sepanjang flow, baru dikirim
// sekali ke server saat user menekan tombol selesai di slide terakhir.
  const handleNext = () => {
    if (!canProceed() || (!isSkippable && !hasAnswered())) return;
    goToNextSlide();
  };

// Menyusun seluruh jawaban onboarding jadi satu payload untuk RPC
// `complete_onboarding` (lihat file SQL terlampir untuk definisi function-nya).
  const buildFinalPayload = () => {
    let isoDate = '';
    if (Platform.OS === 'android') {
      isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
      isoDate = tanggalLahir.toISOString().split('T')[0];
    }

    const edu = selectedBackgrounds.filter(item => EDUCATION_OPTIONS.includes(item)).join(', ');
    const work = selectedBackgrounds.filter(item => WORK_OPTIONS.includes(item)).join(', ');
    const combinedAvail = [frequency, ...waktu].filter(Boolean).join(', ');
    const combinedLooking = [lookingFor1, lookingFor2].filter(Boolean).join(' | ');

    // CATATAN: di kode lama, slide 10 (kepribadian) dan slide 13 (bio bebas)
    // sama-sama menulis ke kolom `bio` — karena disimpan berurutan, jawaban
    // slide 10 selalu tertimpa oleh slide 13 dan tidak pernah benar-benar
    // tersimpan. Untuk sekarang kita utamakan teks bio bebas (lebih personal),
    // dan pakai kepribadian sebagai fallback kalau bio dikosongkan/di-skip.
    const combinedBio = bio || kepribadian;

    // Filter defensif: pastikan hanya ID sport numerik valid yang dikirim ke
    // RPC (kolom sport_id bertipe bigint di DB). Ini menjaga dari kasus ID
    // lokal palsu (local_xxx) yang mungkin tersisa di state sebelum fix ini.
    const numericSportIds = selectedSports
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    return {
      p_nama: nama || null,
      p_tanggal_lahir: isoDate || null,
      p_negara: negara || null,
      p_alamat: alamat || null,
      p_foto_url: fotoUrl,
      p_skill_level: skillLevel || null,
      p_hobi: hobi.length > 0 ? hobi.join(', ') : null,
      p_looking_for: combinedLooking || null,
      p_availability: combinedAvail || null,
      p_bio: combinedBio || null,
      p_pendidikan: edu || null,
      p_pekerjaan: work || null,
      p_sport_ids: numericSportIds.length > 0 ? numericSportIds : null,
    };
  };

  const finishOnboarding = async () => {
    if (!session) return;
    setSaving(true);
    try {
      // Satu panggilan RPC transaksional: update profil + sinkronisasi
      // user_sports (delete+insert) + set onboarding_complete=true,
      // semua dalam satu transaksi Postgres (lihat SQL terlampir).
      const { error } = await supabase.rpc('complete_onboarding', buildFinalPayload());
      if (error) throw error;
      await refreshProfile();
      router.replace('/(tabs)/' as any);
    } catch (e: any) {
      Alert.alert(
        'Gagal Menyimpan',
        e.message || 'Terjadi kesalahan saat menyelesaikan onboarding. Coba lagi.'
      );
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentSlide) {
      case 0: return nama.trim().length > 0;
      case 1: 
        if (Platform.OS === 'android') {
          const d = parseInt(day);
          const m = parseInt(month);
          const y = parseInt(year);
          if (!d || !m || !y || y > new Date().getFullYear() || y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return false;
          const age = new Date().getFullYear() - y;
          return age >= 16;
        } else {
          const age = new Date().getFullYear() - tanggalLahir.getFullYear();
          return age >= 16;
        }
      case 2: return alamat.trim().length > 0;
      case 4: return selectedSports.length > 0;
      case 14: return true;
      default: return true; // Most are skippable, but if they want to click NEXT, we'll check if they selected
    }
  };

  const hasAnswered = () => {
    switch (currentSlide) {
      case 0: return nama.trim().length > 0;
      case 1: return true;
      case 2: return alamat.trim().length > 0;
      case 3: return !!fotoUrl;
      case 4: return selectedSports.length > 0;
      case 5: return !!skillLevel;
      case 6: return hobi.length > 0;
      case 7: return !!lookingFor1;
      case 8: return !!frequency;
      case 9: return waktu.length > 0;
      case 10: return !!kepribadian;
      case 11: return !!lookingFor2;
      case 12: return selectedBackgrounds.length > 0;
      case 13: return !!bio;
      case 14: return true;
      default: return true;
    }
  };

  const isSkippable = ![0, 1, 2, 4, 14].includes(currentSlide);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {currentSlide < 14 && (
          <View style={styles.topBar}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${((currentSlide + 1) / 15) * 100}%` }]} />
            </View>
            <TouchableOpacity style={styles.backButton} onPress={goToPrevSlide}>
              <Ionicons name="chevron-back" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flex: 1, position: 'relative' }}>
          <Animated.View
            key={currentSlide}
            entering={direction === 'forward' ? SlideInRight.duration(350) : SlideInLeft.duration(350)}
            exiting={direction === 'forward' ? SlideOutLeft.duration(300) : SlideOutRight.duration(300)}
            style={StyleSheet.absoluteFill}
          >
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
          {currentSlide === 0 && (
    <View>
{/* SLIDE 1 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Siapa namamu?</Text>
            <Text style={styles.subtitle}>Nama panggilanmu</Text>
            <TextInput style={styles.input} value={nama} onChangeText={setNama} placeholder="Ketik namamu..." placeholderTextColor={COLORS.secondaryText} autoFocus={currentSlide === 0} />
          </View>

              </View>
  )}

{currentSlide === 1 && (
    <View>
{/* SLIDE 2 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Kapan kamu lahir?</Text>
            <Text style={styles.subtitle}>Usia minimal 16 tahun.</Text>
            {Platform.OS === 'android' ? (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TextInput 
                  style={[styles.input, { flex: 1, textAlign: 'center' }]} 
                  placeholder="DD" 
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="numeric"
                  maxLength={2}
                  value={day}
                  onChangeText={setDay}
                />
                <TextInput 
                  style={[styles.input, { flex: 1, textAlign: 'center' }]} 
                  placeholder="MM" 
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="numeric"
                  maxLength={2}
                  value={month}
                  onChangeText={setMonth}
                />
                <TextInput 
                  style={[styles.input, { flex: 1.5, textAlign: 'center' }]} 
                  placeholder="YYYY" 
                  placeholderTextColor={COLORS.secondaryText}
                  keyboardType="numeric"
                  maxLength={4}
                  value={year}
                  onChangeText={setYear}
                />
              </View>
            ) : (
              <DateTimePicker
                value={tanggalLahir}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setTanggalLahir(date);
                }}
                maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 16))}
                textColor={COLORS.text}
              />
            )}
          </View>

              </View>
  )}

{currentSlide === 2 && (
    <View>
{/* SLIDE 3 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Kamu tinggal di mana?</Text>
            <Text style={styles.subtitle}>Kota tempat kamu beraktivitas</Text>
            <TextInput style={styles.input} value={negara} onChangeText={setNegara} placeholder="Negara (Default: Indonesia)" placeholderTextColor={COLORS.secondaryText} />
            <TextInput style={[styles.input, { marginTop: 16 }]} value={alamat} onChangeText={setAlamat} placeholder="Ketik nama Kota / Area..." placeholderTextColor={COLORS.secondaryText} />
          </View>

              </View>
  )}

{currentSlide === 3 && (
    <View>
{/* SLIDE 4 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Foto profilmu</Text>
            <Text style={styles.subtitle}>Tambahkan foto agar mudah dikenali</Text>
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                {fotoUrl ? (
                  <Image source={{ uri: fotoUrl }} style={styles.photo} />
                ) : (
                  <Ionicons name="camera" size={40} color={COLORS.secondaryText} />
                )}
              </TouchableOpacity>
            </View>
          </View>

              </View>
  )}

{currentSlide === 4 && (
    <View>
{/* SLIDE 5 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Olahraga apa yang kamu tekuni?</Text>
            <Text style={styles.subtitle}>Pilih hingga 5 olahraga.</Text>
            <ScrollView style={{ marginTop: 20 }}>
              <View style={styles.chipContainer}>
                {sports.map(sport => (
                  <TouchableOpacity 
                    key={sport.id} 
                    style={[styles.chip, selectedSports.includes(sport.id) && styles.chipSelected]}
                    onPress={() => toggleMulti(selectedSports, setSelectedSports, sport.id, 5)}
                  >
                    <Text style={[styles.chipText, selectedSports.includes(sport.id) && styles.chipTextSelected]}>
                      {sport.icon} {sport.nama}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {showCustomSport ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, width: '100%' }}>
                    <TextInput style={[styles.input, { flex: 1, paddingVertical: 8, marginBottom: 0 }]} value={customSportInput} onChangeText={setCustomSportInput} placeholder="Olahraga lain..." placeholderTextColor={COLORS.secondaryText} />
                    <TouchableOpacity onPress={handleCustomSport} style={{ marginLeft: 8, backgroundColor: COLORS.primary, padding: 12, borderRadius: 12 }}>
                      <Ionicons name="checkmark" size={20} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.chip} onPress={() => setShowCustomSport(true)}>
                    <Text style={styles.chipText}>+ Tambah olahraga lain</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>

              </View>
  )}

{currentSlide === 5 && (
    <View>
{/* SLIDE 6 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Level kemampuanmu?</Text>
            <Text style={styles.subtitle}>Jujur saja, tidak ada yang menghakimi.</Text>
            <View style={styles.optionsContainer}>
              {['🌱 Pemula — masih belajar', '⚡ Menengah — sudah rutin', '🏆 Mahir — kompetitif', '🥇 Pro — level profesional'].map(opt => (
                <TouchableOpacity key={opt} style={[styles.card, skillLevel === opt && styles.cardSelected]} onPress={() => setSkillLevel(opt)}>
                  <Text style={[styles.cardText, skillLevel === opt && styles.cardTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

              </View>
  )}

{currentSlide === 6 && (
    <View>
{/* SLIDE 7 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Kamu lebih suka olahraga seperti apa?</Text>
            <Text style={styles.subtitle}>Pilih maksimal 2 jenis.</Text>
            <View style={styles.optionsContainer}>
              {['🏢 Indoor (gym, badminton, tenis meja)', '🌳 Outdoor (lari, sepeda, hiking)', '👥 Tim (futsal, basket, voli)', '🧘 Solo (renang, yoga, kalistenik)'].map(opt => (
                <TouchableOpacity key={opt} style={[styles.card, hobi.includes(opt) && styles.cardSelected]} onPress={() => toggleMulti(hobi, setHobi, opt, 2)}>
                  <Text style={[styles.cardText, hobi.includes(opt) && styles.cardTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

              </View>
  )}

{currentSlide === 7 && (
    <View>
{/* SLIDE 8 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Apa tujuan utamamu di Manuver?</Text>
            <Text style={styles.subtitle}>Bantu kami mencarikan teman yang pas.</Text>
            <View style={styles.optionsContainer}>
              {['🏋️ Cari teman latihan rutin', '⚔️ Cari lawan tanding', '👥 Cari tim / grup olahraga', '🌱 Cari teman yang baru mulai olahraga'].map(opt => (
                <TouchableOpacity key={opt} style={[styles.card, lookingFor1 === opt && styles.cardSelected]} onPress={() => setLookingFor1(opt)}>
                  <Text style={[styles.cardText, lookingFor1 === opt && styles.cardTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

              </View>
  )}

{currentSlide === 8 && (
    <View>
{/* SLIDE 9 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Seberapa sering kamu berolahraga?</Text>
            <Text style={styles.subtitle}>Pilih frekuensi olahragamu.</Text>
            <View style={styles.optionsContainer}>
              {['🔥 Setiap hari', '💪 3–5x seminggu', '🚶 1–2x seminggu', '🌟 Baru mau mulai'].map(opt => (
                <TouchableOpacity key={opt} style={[styles.card, frequency === opt && styles.cardSelected]} onPress={() => setFrequency(opt)}>
                  <Text style={[styles.cardText, frequency === opt && styles.cardTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

              </View>
  )}

{currentSlide === 9 && (
    <View>
{/* SLIDE 10 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Kapan kamu biasanya berolahraga?</Text>
            <Text style={styles.subtitle}>Pilih maksimal 2 waktu.</Text>
            <View style={styles.optionsContainer}>
              {['🌅 Pagi (05.00–09.00)', '☀️ Siang (10.00–14.00)', '🌤️ Sore (15.00–18.00)', '🌙 Malam (19.00–22.00)'].map(opt => (
                <TouchableOpacity key={opt} style={[styles.card, waktu.includes(opt) && styles.cardSelected]} onPress={() => toggleMulti(waktu, setWaktu, opt, 2)}>
                  <Text style={[styles.cardText, waktu.includes(opt) && styles.cardTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

              </View>
  )}

{currentSlide === 10 && (
    <View>
{/* SLIDE 11 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Kepribadian olahragamu?</Text>
            <Text style={styles.subtitle}>Saat sedang berolahraga kamu itu...</Text>
            <View style={styles.optionsContainer}>
              {['😊 Santai — yang penting gerak dan ngobrol', '🎯 Serius — fokus target dan progress', '🌊 Fleksibel — tergantung suasana', '🔥 Kompetitif — suka tantangan dan menang'].map(opt => (
                <TouchableOpacity key={opt} style={[styles.card, kepribadian === opt && styles.cardSelected]} onPress={() => setKepribadian(opt)}>
                  <Text style={[styles.cardText, kepribadian === opt && styles.cardTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

              </View>
  )}

{currentSlide === 11 && (
    <View>
{/* SLIDE 12 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Yang paling penting dari teman olahraga?</Text>
            <Text style={styles.subtitle}>Pilih yang paling krusial buatmu.</Text>
            <View style={styles.optionsContainer}>
              {['✅ Konsisten & tidak ghosting jadwal', '⚖️ Skill level yang sebanding', '📍 Lokasi yang dekat', '💥 Semangat yang sama'].map(opt => (
                <TouchableOpacity key={opt} style={[styles.card, lookingFor2 === opt && styles.cardSelected]} onPress={() => setLookingFor2(opt)}>
                  <Text style={[styles.cardText, lookingFor2 === opt && styles.cardTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

              </View>
  )}

{currentSlide === 12 && (
    <View>
{/* SLIDE 13 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Latar Belakangmu</Text>
            <Text style={[styles.subtitle, { color: COLORS.text, fontWeight: '500' }]}>Pilih hingga 3 untuk menemukan teman dengan rutinitas serupa.</Text>
            
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16 }}>Pendidikan</Text>
              <View style={styles.chipContainer}>
                {EDUCATION_OPTIONS.map(opt => (
                  <TouchableOpacity 
                    key={opt}
                    style={[styles.chip, selectedBackgrounds.includes(opt) && styles.chipSelected, { borderRadius: 30, paddingVertical: 10, paddingHorizontal: 16 }]}
                    onPress={() => toggleMulti(selectedBackgrounds, setSelectedBackgrounds, opt, 3)}
                  >
                    <Text style={[styles.chipText, selectedBackgrounds.includes(opt) && styles.chipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 16, marginTop: 32 }}>Pekerjaan</Text>
              <View style={styles.chipContainer}>
                {WORK_OPTIONS.map(opt => (
                  <TouchableOpacity 
                    key={opt}
                    style={[styles.chip, selectedBackgrounds.includes(opt) && styles.chipSelected, { borderRadius: 30, paddingVertical: 10, paddingHorizontal: 16 }]}
                    onPress={() => toggleMulti(selectedBackgrounds, setSelectedBackgrounds, opt, 3)}
                  >
                    <Text style={[styles.chipText, selectedBackgrounds.includes(opt) && styles.chipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

    </View>
  )}

{currentSlide === 13 && (
    <View>
{/* SLIDE 14 */}
          <View style={styles.slide}>
            <Text style={styles.title}>Bio singkat</Text>
            <Text style={styles.subtitle}>Ceritakan sedikit tentang dirimu atau gaya olahragamu...</Text>
            <TextInput 
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
              value={bio} 
              onChangeText={text => { if (text.length <= 150) setBio(text); }} 
              placeholder="Saya suka lari pagi..." 
              placeholderTextColor={COLORS.secondaryText} 
              multiline
            />
            <Text style={{ color: COLORS.secondaryText, textAlign: 'right', marginTop: 8 }}>{bio.length}/150</Text>
          </View>

              </View>
  )}

{currentSlide === 14 && (
    <View>
{/* SLIDE 15 */}
          <View style={[styles.slide, { justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 2, borderColor: COLORS.primary }}>
              <Ionicons name="flame" size={60} color={COLORS.primary} />
            </View>
            <Text style={[styles.title, { textAlign: 'center', fontSize: 36 }]}>Jadikan Olahraga Bagian Termudah dalam Hidupmu</Text>
            <Text style={[styles.subtitle, { textAlign: 'center', fontSize: 18, marginTop: 16 }]}>Temukan partner olahragamu sekarang. Ribuan orang sedang menunggumu di sekitarmu.</Text>
            
            <TouchableOpacity style={[styles.nextButton, { width: '100%', marginTop: 60, paddingVertical: 18 }]} onPress={finishOnboarding} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.background} /> : <Text style={[styles.nextText, { fontSize: 18 }]}>MULAI PETUALANGANMU ⚡</Text>}
            </TouchableOpacity>
          </View>

    </View>
  )}

            </ScrollView>
          </Animated.View>
        </View>

        {/* Footer Navigation (hidden on slide 15) */}
        {currentSlide < 14 && (
          <View style={styles.footer}>
            {isSkippable ? (
              <TouchableOpacity style={styles.skipButton} onPress={() => { goToNextSlide(); }} disabled={saving}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}

            {currentSlide === 12 && (
              <Text style={{ color: COLORS.secondaryText, fontSize: 14, fontWeight: '600' }}>
                {selectedBackgrounds.length}/3 dipilih
              </Text>
            )}

            <TouchableOpacity 
              style={[styles.nextButton, (!canProceed() || !hasAnswered()) && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={saving || !canProceed() || (!isSkippable && !hasAnswered())}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={(!canProceed() || (!isSkippable && !hasAnswered())) ? COLORS.secondaryText : COLORS.background} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { paddingTop: Platform.OS === 'android' ? 20 : 0 },
  progressBarContainer: { height: 4, backgroundColor: COLORS.surface, width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  backButton: { padding: 20 },
  slide: { width, paddingHorizontal: 32, paddingTop: 10 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 8, lineHeight: 40 },
  subtitle: { fontSize: 16, color: COLORS.secondaryText, marginBottom: 32 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.borderRadius,
    padding: 16,
    color: COLORS.text,
    fontSize: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16
  },
  datePickerButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerText: { color: COLORS.text, fontSize: 18 },
  photoContainer: { width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  
  optionsContainer: { gap: 16 },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.elevatedSurface,
  },
  cardText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  cardTextSelected: { color: COLORS.primary },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: COLORS.background },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 16,
  },
  skipButton: { paddingVertical: 12, paddingHorizontal: 16, marginLeft: -16 },
  skipText: { fontSize: 16, color: COLORS.secondaryText, fontWeight: '600' },
  nextButton: {
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
  nextText: { fontSize: 16, color: COLORS.background, fontWeight: '900' },
});
