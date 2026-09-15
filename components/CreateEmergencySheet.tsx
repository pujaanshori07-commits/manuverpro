import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../app/_layout';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SPORTS = ['Badminton', 'Padel', 'Futsal', 'Tennis', 'Basket', 'Running'];

export default function CreateEmergencySheet({ visible, onClose, onSuccess }: Props) {
  const { session } = useAuth();
  const [sport, setSport] = useState('Badminton');
  const [venue, setVenue] = useState('');
  const [slotsNeeded, setSlotsNeeded] = useState(1);
  const [fee, setFee] = useState('');
  const [contactWa, setContactWa] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!venue.trim()) {
      Alert.alert('Perhatian', 'Nama tempat/lapangan wajib diisi.');
      return;
    }
    if (!contactWa.trim()) {
      Alert.alert('Perhatian', 'Nomor WhatsApp wajib diisi untuk koordinasi darurat.');
      return;
    }

    setSubmitting(true);
    try {
      // Default play time: 2 hours from now
      const playTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      // Expiry: 4 hours from now
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

      const parsedFee = fee ? parseInt(fee.replace(/[^0-9]/g, ''), 10) : 0;

      const { error } = await supabase.from('emergency_slots').insert({
        creator_id: session?.user.id,
        sport,
        venue_name: venue.trim(),
        play_time: playTime.toISOString(),
        expires_at: expiresAt.toISOString(),
        slots_needed: slotsNeeded,
        fee_per_person: isNaN(parsedFee) ? 0 : parsedFee,
        contact_wa: contactWa.trim(),
        note: note.trim() || null,
        status: 'active',
      });

      if (error) throw error;

      Alert.alert('⚡ Panggilan Darurat Terpasang!', 'Pemain terdekat akan melihat panggilan slot kamu.');
      setVenue('');
      setFee('');
      setContactWa('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal membuat slot darurat');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.dragBar} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Pasang Slot Darurat (SOS)</Text>
              <Text style={styles.subtitle}>Teman batal main? Isi kekosongan sekarang.</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sport Picker */}
            <Text style={styles.label}>PILIH OLAHRAGA</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map((s) => {
                const isSelected = sport === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sportChip, isSelected && styles.sportChipActive]}
                    onPress={() => setSport(s)}
                  >
                    <Text style={[styles.sportChipText, isSelected && styles.sportChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Venue */}
            <Text style={styles.label}>NAMA LAPANGAN / VENUE</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Chandra Wijaya Hall A, Serpong"
              placeholderTextColor={Colors.textMuted}
              value={venue}
              onChangeText={setVenue}
            />

            {/* Slots & Fee */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>BUTUH BERAPA ORANG?</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSlotsNeeded((prev) => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.stepperVal}>{slotsNeeded}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSlotsNeeded((prev) => Math.min(5, prev + 1))}
                  >
                    <Ionicons name="add" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.label}>PATUNGAN / ORANG</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Rp 35.000 (0 jika free)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={fee}
                  onChangeText={setFee}
                />
              </View>
            </View>

            {/* WhatsApp */}
            <Text style={styles.label}>NOMOR WHATSAPP KOORDINASI</Text>
            <TextInput
              style={styles.input}
              placeholder="0812xxxxxxxx"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={contactWa}
              onChangeText={setContactWa}
            />

            {/* Note */}
            <Text style={styles.label}>CATATAN SINGKAT (OPSIONAL)</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Contoh: Raket disediain, level intermediate santai"
              placeholderTextColor={Colors.textMuted}
              multiline
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>🚨 Siarkan SOS Sekarang</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.base,
    maxHeight: '85%',
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  label: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  sportChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.pillBg,
    borderWidth: 1,
    borderColor: Colors.pillBorder,
  },
  sportChipActive: {
    backgroundColor: 'rgba(255, 87, 47, 0.15)',
    borderColor: Colors.primary,
  },
  sportChipText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sportChipTextActive: {
    color: Colors.primary,
    fontFamily: Typography.fontHeading,
  },
  input: {
    backgroundColor: Colors.elevatedSurface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  row: {
    flexDirection: 'row',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevatedSurface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  stepperBtn: {
    padding: 10,
  },
  stepperVal: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: '#D63031',
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginVertical: Spacing.base,
  },
  submitBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: '#FFF',
  },
});
