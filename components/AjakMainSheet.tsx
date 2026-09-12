import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SPORT_TAG_MAP } from '../app/(tabs)/index';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AjakMainSheetProps {
  visible: boolean;
  onClose: () => void;
  onSend: (inviteData: any) => void;
  partnerName: string;
}

export default function AjakMainSheet({ visible, onClose, onSend, partnerName }: AjakMainSheetProps) {
  const [selectedSport, setSelectedSport] = useState<string>('badminton');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [note, setNote] = useState('');

  const sports = Object.entries(SPORT_TAG_MAP);

  const handleSend = () => {
    if (!venue.trim()) {
      alert('Lokasi latihan harus diisi.');
      return;
    }

    onSend({
      sport: selectedSport,
      venue_name: venue.trim(),
      scheduled_at: date.toISOString(),
      note: note.trim() || null,
    });
    
    // Reset state after sending
    setVenue('');
    setNote('');
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const currentDate = new Date(date);
      currentDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(currentDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const currentDate = new Date(date);
      currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(currentDate);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              <View style={styles.sheetContent}>
                {/* Drag Handle */}
                <View style={styles.dragHandle} />

                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Ajak Sparing {partnerName}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.formContainer}>
                  
                  {/* Sport Picker */}
                  <Text style={styles.label}>Pilih Olahraga</Text>
                  <View style={styles.sportsGrid}>
                    {sports.map(([id, sport]) => (
                      <TouchableOpacity
                        key={id}
                        style={[styles.sportPill, selectedSport === id && styles.sportPillActive]}
                        onPress={() => setSelectedSport(id)}
                      >
                        <Ionicons 
                          name={sport.icon as any} 
                          size={16} 
                          color={selectedSport === id ? Colors.white : Colors.textSecondary} 
                        />
                        <Text style={[styles.sportPillText, selectedSport === id && styles.sportPillTextActive]}>
                          {sport.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Venue Input */}
                  <Text style={styles.label}>Lokasi (Venue)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: GBK Senayan"
                    placeholderTextColor={Colors.textMuted}
                    value={venue}
                    onChangeText={setVenue}
                  />

                  {/* Date & Time Picker */}
                  <View style={styles.dateTimeRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.label}>Tanggal</Text>
                      <TouchableOpacity 
                        style={styles.datePickerBtn}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                        <Text style={styles.datePickerText}>
                          {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.flex1}>
                      <Text style={styles.label}>Waktu</Text>
                      <TouchableOpacity 
                        style={styles.datePickerBtn}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <Ionicons name="time-outline" size={20} color={Colors.primary} />
                        <Text style={styles.datePickerText}>
                          {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {(showDatePicker || showTimePicker) && (
                    <DateTimePicker
                      value={date}
                      mode={showDatePicker ? "date" : "time"}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={showDatePicker ? handleDateChange : handleTimeChange}
                      themeVariant="dark"
                      minimumDate={new Date()}
                    />
                  )}

                  {/* Note */}
                  <Text style={styles.label}>Catatan (Opsional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Misal: Bawa shuttlecock ya!"
                    placeholderTextColor={Colors.textMuted}
                    value={note}
                    onChangeText={setNote}
                    multiline
                  />

                  {/* Submit */}
                  <TouchableOpacity 
                    style={[styles.submitBtn, !venue.trim() && styles.submitBtnDisabled]}
                    onPress={handleSend}
                    disabled={!venue.trim()}
                  >
                    <Text style={styles.submitBtnText}>Kirim Undangan</Text>
                    <Ionicons name="paper-plane" size={18} color={Colors.white} />
                  </TouchableOpacity>

                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  sheetContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 20,
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  formContainer: {
    gap: 16,
  },
  label: {
    fontFamily: Typography.fontMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: -8,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportPillActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    borderColor: Colors.primary,
  },
  sportPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sportPillTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontSemiBold,
  },
  input: {
    backgroundColor: Colors.surfaceInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: Typography.fontRegular,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  flex1: {
    flex: 1,
    gap: 16,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  datePickerText: {
    fontFamily: Typography.fontMedium,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 16,
    color: Colors.white,
  },
});
