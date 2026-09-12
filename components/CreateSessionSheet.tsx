import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

interface CreateSessionSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SPORTS_OPTIONS = [
  { id: 'badminton', name: 'Badminton', icon: 'badminton' as const },
  { id: 'running', name: 'Running', icon: 'walk-outline' as const },
  { id: 'gym', name: 'Gym', icon: 'barbell-outline' as const },
  { id: 'tennis', name: 'Tennis', icon: 'tennisball-outline' as const },
  { id: 'futsal', name: 'Futsal', icon: 'football-outline' as const },
  { id: 'basket', name: 'Basket', icon: 'basketball-outline' as const },
];

const GENDER_OPTIONS: { id: 'any' | 'male' | 'female'; label: string }[] = [
  { id: 'any', label: 'Semua' },
  { id: 'male', label: 'Pria' },
  { id: 'female', label: 'Wanita' },
];

export default function CreateSessionSheet({
  visible,
  onClose,
  onCreated,
}: CreateSessionSheetProps) {
  const [sport, setSport] = useState<string>('badminton');
  const [title, setTitle] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [hoursAhead, setHoursAhead] = useState<number>(24); // default 24h from now
  const [slots, setSlots] = useState<number>(4);
  const [genderPref, setGenderPref] = useState<'any' | 'male' | 'female'>('any');
  const [skillNote, setSkillNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleIncrement = () => {
    if (slots < 10) setSlots((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (slots > 2) setSlots((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Perhatian', 'Harap isi judul sesi.');
      return;
    }
    if (!venue.trim()) {
      Alert.alert('Perhatian', 'Harap isi nama lapangan atau venue.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Autentikasi Diperlukan', 'Silakan login terlebih dahulu.');
        return;
      }

      // Calculate scheduled ISO timestamp (UTC)
      const scheduledTime = new Date(Date.now() + hoursAhead * 3600 * 1000).toISOString();

      // 1. Insert session into open_sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('open_sessions')
        .insert({
          creator_id: user.id,
          sport,
          title: title.trim(),
          venue_name: venue.trim(),
          scheduled_at: scheduledTime,
          duration_min: 120,
          slots_total: slots,
          slots_filled: 1, // Host is participant #1
          gender_pref: genderPref,
          skill_note: skillNote.trim() || null,
          status: 'open',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 2. Add creator into session_participants so trigger keeps count accurate
      if (sessionData) {
        await supabase.from('session_participants').insert({
          session_id: sessionData.id,
          user_id: user.id,
        });
      }

      Alert.alert('Sesi Dibuat', 'Sesi olahraga kamu sekarang sudah aktif di feed komunitas!');

      // Reset fields
      setTitle('');
      setVenue('');
      setSkillNote('');
      setSlots(4);
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating session:', err);
      Alert.alert('Gagal Membuat Sesi', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Buka Sesi Sparing</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#8F94A6" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollBody}
          >
            {/* 1. Sport Selection */}
            <Text style={styles.fieldLabel}>PILIH OLAHRAGA</Text>
            <View style={styles.sportsGrid}>
              {SPORTS_OPTIONS.map((item) => {
                const active = sport === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.sportPill, active && styles.sportPillActive]}
                    onPress={() => setSport(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={15}
                      color={active ? '#FF5A1F' : '#8F94A6'}
                    />
                    <Text
                      style={[
                        styles.sportPillText,
                        active && styles.sportPillTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Title */}
            <Text style={styles.fieldLabel}>JUDUL SESI</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Sparing Badminton Santai Ganda"
              placeholderTextColor="#555B6E"
              value={title}
              onChangeText={setTitle}
            />

            {/* 3. Venue */}
            <Text style={styles.fieldLabel}>LOKASI / VENUE</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Lapangan GBK Senayan"
              placeholderTextColor="#555B6E"
              value={venue}
              onChangeText={setVenue}
            />

            {/* 4. Quick Time Slot Preset */}
            <Text style={styles.fieldLabel}>JADWAL PELAKSANAAN</Text>
            <View style={styles.timePresetsRow}>
              {[
                { label: 'Hari Ini (Malam)', hours: 5 },
                { label: 'Besok Pagi', hours: 16 },
                { label: 'Besok Sore', hours: 24 },
                { label: 'Akhir Pekan', hours: 72 },
              ].map((slot) => {
                const active = hoursAhead === slot.hours;
                return (
                  <TouchableOpacity
                    key={slot.hours}
                    style={[styles.timePresetChip, active && styles.timePresetChipActive]}
                    onPress={() => setHoursAhead(slot.hours)}
                  >
                    <Text
                      style={[
                        styles.timePresetText,
                        active && styles.timePresetTextActive,
                      ]}
                    >
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Slots Stepper */}
            <View style={styles.stepperContainer}>
              <View>
                <Text style={styles.fieldLabelNoMargin}>TOTAL SLOT PESERTA</Text>
                <Text style={styles.stepperSub}>Termasuk host (Min 2, Maks 10)</Text>
              </View>

              <View style={styles.stepperControls}>
                <TouchableOpacity
                  style={[styles.stepperBtn, slots <= 2 && styles.stepperBtnDisabled]}
                  onPress={handleDecrement}
                  disabled={slots <= 2}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={slots <= 2 ? '#444857' : '#FFFFFF'}
                  />
                </TouchableOpacity>

                <Text style={styles.stepperValue}>{slots}</Text>

                <TouchableOpacity
                  style={[styles.stepperBtn, slots >= 10 && styles.stepperBtnDisabled]}
                  onPress={handleIncrement}
                  disabled={slots >= 10}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={slots >= 10 ? '#444857' : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 6. Gender Toggle */}
            <Text style={styles.fieldLabel}>PREFERENSI GENDER</Text>
            <View style={styles.genderToggleRow}>
              {GENDER_OPTIONS.map((g) => {
                const active = genderPref === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.genderSegment, active && styles.genderSegmentActive]}
                    onPress={() => setGenderPref(g.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.genderSegmentText,
                        active && styles.genderSegmentTextActive,
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 7. Skill Note */}
            <Text style={styles.fieldLabel}>CATATAN SKILL / BIAYA (OPSIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Contoh: Pemula ramah, sewa lapangan & shuttlecock dibagi rata."
              placeholderTextColor="#555B6E"
              multiline
              numberOfLines={2}
              value={skillNote}
              onChangeText={setSkillNote}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Publikasikan Sesi</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheetContainer: {
    backgroundColor: '#1A1D24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollBody: {
    paddingBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F94A6',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  fieldLabelNoMargin: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F94A6',
    letterSpacing: 0.8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportPillActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    borderColor: '#FF5A1F',
  },
  sportPillText: {
    fontSize: 13,
    color: '#8F94A6',
    fontWeight: '500',
  },
  sportPillTextActive: {
    color: '#FF5A1F',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0B0D12',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  timePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timePresetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0B0D12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timePresetChipActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    borderColor: '#FF5A1F',
  },
  timePresetText: {
    fontSize: 12,
    color: '#8F94A6',
    fontWeight: '600',
  },
  timePresetTextActive: {
    color: '#FF5A1F',
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0B0D12',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepperSub: {
    fontSize: 11,
    color: '#555B6E',
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#262933',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    backgroundColor: '#16181F',
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 20,
    textAlign: 'center',
  },
  genderToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0B0D12',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 4,
  },
  genderSegment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  genderSegmentActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    borderWidth: 1,
    borderColor: '#FF5A1F',
  },
  genderSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8F94A6',
  },
  genderSegmentTextActive: {
    color: '#FF5A1F',
    fontWeight: '700',
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF5A1F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
