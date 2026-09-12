import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';

interface SportItem {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PRESET_SPORTS: SportItem[] = [
  { id: 'badminton', name: 'Badminton', icon: 'tennisball-outline' },
  { id: 'running', name: 'Running', icon: 'walk-outline' },
  { id: 'gym', name: 'Gym & Fitness', icon: 'barbell-outline' },
  { id: 'futsal', name: 'Futsal', icon: 'football-outline' },
  { id: 'basket', name: 'Basket', icon: 'basketball-outline' },
  { id: 'yoga', name: 'Yoga', icon: 'body-outline' },
  { id: 'tennis', name: 'Tennis', icon: 'baseball-outline' },
  { id: 'cycling', name: 'Cycling', icon: 'bicycle-outline' },
  { id: 'swimming', name: 'Renang', icon: 'water-outline' },
  { id: 'boxing', name: 'Boxing', icon: 'fitness-outline' },
  { id: 'volleyball', name: 'Voli', icon: 'volleyball-outline' },
  { id: 'calisthenics', name: 'Calisthenics', icon: 'pulse-outline' },
];

const EXPERIENCE_OPTIONS = ['< 6 bulan', '6 bln–1 thn', '1–3 tahun', '3+ tahun'];
const GENDER_OPTIONS = ['Pria', 'Wanita', 'Semua'];
const TIME_OPTIONS = [
  'Pagi (06-10)',
  'Siang (10-14)',
  'Sore (14-18)',
  'Malam (18-22)',
];
const TRAINING_TYPES = ['Santai', 'Serius', 'Kompetisi'];
const FREQUENCY_OPTIONS = ['1x/minggu', '2-3x/minggu', 'Setiap Hari'];

export default function QuestionnaireScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Section 1: Sports
  const [selectedSports, setSelectedSports] = useState<string[]>(['badminton', 'running']);
  const [otherSport, setOtherSport] = useState('');

  // Section 2: Experience per selected sport
  const [sportExperience, setSportExperience] = useState<Record<string, string>>({
    badminton: '1–3 tahun',
    running: '6 bln–1 thn',
  });

  // Section 3: Partner Preference
  const [genderPref, setGenderPref] = useState('Semua');
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('40');
  const [activeTimes, setActiveTimes] = useState<string[]>(['Sore (14-18)', 'Malam (18-22)']);
  const [trainingType, setTrainingType] = useState('Santai');
  const [frequency, setFrequency] = useState('2-3x/minggu');

  // Section 4: Basic Profile
  const [nickname, setNickname] = useState('');
  const [myAge, setMyAge] = useState('');
  const [myHobbies, setMyHobbies] = useState('');
  const [myBio, setMyBio] = useState('');

  // Handlers
  const toggleSport = (name: string) => {
    if (selectedSports.includes(name)) {
      setSelectedSports(selectedSports.filter((s) => s !== name));
      const nextExp = { ...sportExperience };
      delete nextExp[name];
      setSportExperience(nextExp);
    } else {
      setSelectedSports([...selectedSports, name]);
      setSportExperience({ ...sportExperience, [name]: '< 6 bulan' });
    }
  };

  const handleAddOtherSport = () => {
    const trimmed = otherSport.trim();
    if (trimmed && !selectedSports.includes(trimmed)) {
      setSelectedSports([...selectedSports, trimmed]);
      setSportExperience({ ...sportExperience, [trimmed]: '< 6 bulan' });
      setOtherSport('');
    }
  };

  const toggleActiveTime = (time: string) => {
    if (activeTimes.includes(time)) {
      setActiveTimes(activeTimes.filter((t) => t !== time));
    } else {
      setActiveTimes([...activeTimes, time]);
    }
  };

  const isAgeInvalid = myAge !== '' && (parseInt(myAge, 10) < 18 || isNaN(parseInt(myAge, 10)));

  const handleContinue = () => {
    if (isAgeInvalid) return;
    router.push('/onboarding/location');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
        {/* Top Header & Progress (Step 2 of 3) */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.stepProgressRow}>
            <View style={[styles.stepBar, styles.stepBarDone]} />
            <View style={[styles.stepBar, styles.stepBarActive]} />
            <View style={styles.stepBar} />
          </View>

          <View style={styles.stepCounterWrap}>
            <Text style={styles.stepCounterText}>2/3</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Headline */}
          <View style={styles.titleSection}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>PARTNER MATCHING SETUP</Text>
            </View>
            <Text style={styles.titleText}>Sesuaikan Olahragamu</Text>
            <Text style={styles.subtitleText}>
              Beri tahu kami aktivitas, gaya bermain, dan kriteria partner yang kamu cari.
            </Text>
          </View>

          {/* ================= SECTION 1: SPORTS SELECTION ================= */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleGroup}>
                <Ionicons name="fitness" size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>1. Pilihan Olahraga</Text>
              </View>
              <Text style={styles.counterBadge}>{selectedSports.length} dipilih</Text>
            </View>

            <View style={styles.pillsWrap}>
              {PRESET_SPORTS.map((sport) => {
                const selected = selectedSports.includes(sport.name);
                return (
                  <TouchableOpacity
                    key={sport.id}
                    style={[styles.glassPill, selected && styles.glassPillActive]}
                    onPress={() => toggleSport(sport.name)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={sport.icon}
                      size={16}
                      color={selected ? Colors.white : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.glassPillText,
                        selected && styles.glassPillTextActive,
                      ]}
                    >
                      {sport.name}
                    </Text>
                    {selected && (
                      <Ionicons name="checkmark-circle" size={14} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Sport Input */}
            <View style={styles.customSportRow}>
              <TextInput
                style={styles.customSportInput}
                value={otherSport}
                onChangeText={setOtherSport}
                placeholder="Olahraga lainnya... (misal: Padel, Muay Thai)"
                placeholderTextColor={Colors.textMuted}
                onSubmitEditing={handleAddOtherSport}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.customSportAddBtn}
                onPress={handleAddOtherSport}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= SECTION 2: EXPERIENCE ================= */}
          {selectedSports.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleGroup}>
                <Ionicons name="ribbon-outline" size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>2. Tingkat Pengalaman</Text>
              </View>

              <View style={styles.experienceList}>
                {selectedSports.map((sport) => (
                  <View key={sport} style={styles.experienceItem}>
                    <Text style={styles.experienceQuestion}>
                      Sudah berapa lama kamu bermain{' '}
                      <Text style={styles.sportHighlight}>{sport}</Text>?
                    </Text>

                    <View style={styles.expPillsRow}>
                      {EXPERIENCE_OPTIONS.map((opt) => {
                        const active = sportExperience[sport] === opt;
                        return (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.expChip, active && styles.expChipActive]}
                            onPress={() =>
                              setSportExperience({
                                ...sportExperience,
                                [sport]: opt,
                              })
                            }
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.expChipText,
                                active && styles.expChipTextActive,
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ================= SECTION 3: PARTNER PREFERENCE ================= */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="people-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>3. Preferensi Partner</Text>
            </View>

            {/* Gender Preference */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>GENDER PARTNER</Text>
              <View style={styles.segmentedRow}>
                {GENDER_OPTIONS.map((g) => {
                  const active = genderPref === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                      onPress={() => setGenderPref(g)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          active && styles.segmentBtnTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Age Range */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>USIA PARTNER (MIN 18)</Text>
              <View style={styles.ageInputRow}>
                <View style={styles.ageInputBox}>
                  <Text style={styles.ageInputPrefix}>Min</Text>
                  <TextInput
                    style={styles.ageTextInput}
                    value={minAge}
                    onChangeText={setMinAge}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <Text style={styles.ageDivider}>—</Text>
                <View style={styles.ageInputBox}>
                  <Text style={styles.ageInputPrefix}>Max</Text>
                  <TextInput
                    style={styles.ageTextInput}
                    value={maxAge}
                    onChangeText={setMaxAge}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              </View>
            </View>

            {/* Active Time */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>WAKTU AKTIF BIASA OLAHRAGA</Text>
              <View style={styles.pillsWrap}>
                {TIME_OPTIONS.map((time) => {
                  const active = activeTimes.includes(time);
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.glassPill, active && styles.glassPillActive]}
                      onPress={() => toggleActiveTime(time)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={active ? Colors.white : Colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.glassPillText,
                          active && styles.glassPillTextActive,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Training Type */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>TIPE LATIHAN</Text>
              <View style={styles.segmentedRow}>
                {TRAINING_TYPES.map((type) => {
                  const active = trainingType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                      onPress={() => setTrainingType(type)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          active && styles.segmentBtnTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Frequency */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>FREKUENSI OLAHRAGA</Text>
              <View style={styles.segmentedRow}>
                {FREQUENCY_OPTIONS.map((f) => {
                  const active = frequency === f;
                  return (
                    <TouchableOpacity
                      key={f}
                      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                      onPress={() => setFrequency(f)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentBtnText,
                          active && styles.segmentBtnTextActive,
                        ]}
                      >
                        {f}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ================= SECTION 4: BASIC PROFILE ================= */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="card-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>4. Profil Discovery Card</Text>
            </View>

            {/* Nama Panggilan */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>NAMA PANGGILAN</Text>
              <TextInput
                style={styles.glassInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="Contoh: Budi, Dinda, Reza"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Umur Kamu */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>UMUR KAMU (MIN 18)</Text>
              <TextInput
                style={[styles.glassInput, isAgeInvalid && styles.inputErrorBorder]}
                value={myAge}
                onChangeText={setMyAge}
                placeholder="Masukkan umurmu (misal: 25)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={2}
              />
              {isAgeInvalid && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.danger} />
                  <Text style={styles.errorText}>
                    Umur minimal harus 18 tahun untuk mendaftar.
                  </Text>
                </View>
              )}
            </View>

            {/* Hobi Lainnya */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>HOBI LAINNYA (DIPISAH KOMA)</Text>
              <TextInput
                style={styles.glassInput}
                value={myHobbies}
                onChangeText={setMyHobbies}
                placeholder="Contoh: Kopi, Membaca, Masak, Gaming"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Bio Singkat */}
            <View style={styles.subFieldGroup}>
              <Text style={styles.fieldLabel}>DESKRIPSI SINGKAT DIRIMU</Text>
              <TextInput
                style={[styles.glassInput, styles.textArea]}
                value={myBio}
                onChangeText={setMyBio}
                placeholder="Ceritakan rutinitas olahraga atau partner seperti apa yang asik diajak main bareng..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Floating Bottom Orange Gradient CTA */}
        <View
          style={[
            styles.floatingFooter,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TouchableOpacity
            style={[styles.continueButton, isAgeInvalid && styles.buttonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.88}
            disabled={isAgeInvalid}
          >
            <LinearGradient
              colors={
                isAgeInvalid
                  ? ['#555', '#444']
                  : [Colors.primary, '#E6441D']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Text style={styles.continueButtonText}>Lanjutkan</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingBottom: Spacing.md, gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  stepProgressRow: { flex: 1, flexDirection: 'row', gap: 6 },
  stepBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  stepBarDone: { backgroundColor: Colors.primary, opacity: 0.5 },
  stepBarActive: { backgroundColor: Colors.primary },
  stepCounterWrap: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.sm, backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  stepCounterText: { fontFamily: Typography.fontSemiBold, fontSize: 12, color: Colors.textSecondary },
  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, gap: 20 },
  titleSection: { gap: 8 },
  tagBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255, 87, 47, 0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.xs, borderWidth: 1, borderColor: 'rgba(255, 87, 47, 0.28)' },
  tagBadgeText: { fontFamily: Typography.fontSemiBold, fontSize: 10, color: Colors.primary, letterSpacing: 0.8 },
  titleText: { fontFamily: Typography.fontHeading, fontSize: 26, color: Colors.textPrimary, lineHeight: 32 },
  subtitleText: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  sectionCard: { backgroundColor: 'rgba(23, 26, 33, 0.65)', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', padding: Spacing.base, gap: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: Typography.fontHeading, fontSize: 15, color: Colors.textPrimary },
  counterBadge: { fontFamily: Typography.fontSemiBold, fontSize: 12, color: Colors.primary },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  glassPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: BorderRadius.round, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  glassPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  glassPillText: { fontFamily: Typography.fontMedium, fontSize: 12, color: Colors.textSecondary },
  glassPillTextActive: { color: Colors.white, fontFamily: Typography.fontSemiBold },
  customSportRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  customSportInput: { flex: 1, backgroundColor: 'rgba(15, 17, 21, 0.7)', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: 14, paddingVertical: 10, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 13 },
  customSportAddBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  experienceList: { gap: 14 },
  experienceItem: { gap: 8, backgroundColor: 'rgba(15, 17, 21, 0.5)', padding: 12, borderRadius: BorderRadius.md },
  experienceQuestion: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textPrimary },
  sportHighlight: { fontFamily: Typography.fontHeading, color: Colors.primary },
  expPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.round, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' },
  expChipActive: { backgroundColor: 'rgba(255, 87, 47, 0.2)', borderColor: Colors.primary },
  expChipText: { fontFamily: Typography.fontRegular, fontSize: 11, color: Colors.textSecondary },
  expChipTextActive: { color: Colors.primary, fontFamily: Typography.fontSemiBold },
  subFieldGroup: { gap: 8 },
  fieldLabel: { fontFamily: Typography.fontSemiBold, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.8 },
  segmentedRow: { flexDirection: 'row', backgroundColor: 'rgba(15, 17, 21, 0.7)', borderRadius: BorderRadius.round, padding: 3, borderWidth: 1, borderColor: Colors.surfaceBorder },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.round },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentBtnText: { fontFamily: Typography.fontMedium, fontSize: 12, color: Colors.textSecondary },
  segmentBtnTextActive: { color: Colors.white, fontFamily: Typography.fontSemiBold },
  ageInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ageInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15, 17, 21, 0.7)', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: 14 },
  ageInputPrefix: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textMuted, marginRight: 8 },
  ageTextInput: { flex: 1, paddingVertical: 12, color: Colors.textPrimary, fontFamily: Typography.fontSemiBold, fontSize: 14 },
  ageDivider: { color: Colors.textMuted, fontSize: 16 },
  glassInput: { backgroundColor: 'rgba(15, 17, 21, 0.7)', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: Spacing.base, paddingVertical: 12, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 14 },
  inputErrorBorder: { borderColor: Colors.danger },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  errorText: { fontFamily: Typography.fontRegular, fontSize: 11, color: Colors.danger },
  textArea: { minHeight: 80, paddingTop: 12 },
  floatingFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(9, 10, 13, 0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: Spacing.base, paddingTop: 12 },
  continueButton: { borderRadius: BorderRadius.round, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  buttonDisabled: { opacity: 0.6 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  continueButtonText: { fontFamily: Typography.fontHeading, fontSize: 15, color: Colors.white, letterSpacing: 0.4 },
});
