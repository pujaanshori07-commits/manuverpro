import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- SUB-COMPONENT 1: FLOATING CHAT TRIGGER BUTTON ---
interface AjakMainTriggerProps {
  onPress: () => void;
}

export function AjakMainTrigger({ onPress }: AjakMainTriggerProps) {
  return (
    <View style={styles.triggerWrapper}>
      <TouchableOpacity
        style={styles.triggerButton}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Ionicons name="flash" size={14} color="#FF5A1F" />
        <Text style={styles.triggerText}>Ajak Main</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- SUB-COMPONENT 2: BOTTOM SHEET FORM MODAL ---
interface AjakMainModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (invite: { sport: string; venue: string; dateTime: string }) => void;
}

const AVAILABLE_SPORTS = ['Badminton', 'Running', 'Gym', 'Tennis', 'Padel', 'Futsal'];

export function AjakMainModal({ visible, onClose, onSubmit }: AjakMainModalProps) {
  const [selectedSport, setSelectedSport] = useState('Badminton');
  const [venue, setVenue] = useState('');
  const [dateTime, setDateTime] = useState('Sabtu, 19:00 WIB');

  const handleSend = () => {
    if (!venue.trim()) return;
    onSubmit({ sport: selectedSport, venue: venue.trim(), dateTime });
    setVenue('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handleBar} />
          <Text style={styles.sheetTitle}>Rencanakan Sparing</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sport Pill Selector */}
            <Text style={styles.inputLabel}>PILIH OLAHRAGA</Text>
            <View style={styles.sportGrid}>
              {AVAILABLE_SPORTS.map((sport) => {
                const active = selectedSport === sport;
                return (
                  <TouchableOpacity
                    key={sport}
                    style={[styles.sportChip, active && styles.sportChipActive]}
                    onPress={() => setSelectedSport(sport)}
                  >
                    <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>
                      {sport}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Venue Input */}
            <Text style={styles.inputLabel}>LOKASI / VENUE</Text>
            <TextInput
              style={styles.darkInput}
              placeholder="Contoh: Lapangan Badminton Senayan"
              placeholderTextColor="#555B6E"
              value={venue}
              onChangeText={setVenue}
            />

            {/* Date & Time Input */}
            <Text style={styles.inputLabel}>WAKTU & JADWAL</Text>
            <TextInput
              style={styles.darkInput}
              placeholder="Contoh: Minggu, 08:00 WIB"
              placeholderTextColor="#555B6E"
              value={dateTime}
              onChangeText={setDateTime}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, !venue.trim() && styles.submitButtonDisabled]}
              onPress={handleSend}
              disabled={!venue.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.submitButtonText}>Kirim Undangan Main</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- SUB-COMPONENT 3: SPORTS TICKET CHAT BUBBLE ---
interface SparingTicketBubbleProps {
  sport: string;
  venue: string;
  dateTime: string;
  status?: 'pending' | 'accepted' | 'declined';
  isSender: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function SparingTicketBubble({
  sport,
  venue,
  dateTime,
  status = 'pending',
  isSender,
  onAccept,
  onDecline,
}: SparingTicketBubbleProps) {
  return (
    <View style={styles.ticketCard}>
      {/* Orange Accent Left Border is handled in styles */}
      <View style={styles.ticketHeader}>
        <View style={styles.ticketIconBox}>
          <Ionicons name="flash" size={16} color="#FF5A1F" />
        </View>
        <Text style={styles.ticketTitle}>Ajakan Main: {sport}</Text>
      </View>

      <View style={styles.ticketBody}>
        <View style={styles.ticketRow}>
          <Ionicons name="location-outline" size={14} color="#8F94A6" />
          <Text style={styles.ticketRowText} numberOfLines={1}>{venue}</Text>
        </View>
        <View style={styles.ticketRow}>
          <Ionicons name="time-outline" size={14} color="#8F94A6" />
          <Text style={styles.ticketRowText}>{dateTime}</Text>
        </View>
      </View>

      {/* Ticket Footer / Action Buttons */}
      {status === 'pending' && !isSender ? (
        <View style={styles.ticketActionRow}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={onDecline}
            activeOpacity={0.7}
          >
            <Text style={styles.declineText}>Tolak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onAccept}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptText}>Terima</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>
            Status:{' '}
            <Text
              style={[
                styles.statusValue,
                status === 'accepted' ? styles.statusAccepted : styles.statusPending,
              ]}
            >
              {status === 'accepted' ? 'Diterima ✓' : status === 'declined' ? 'Ditolak' : 'Menunggu Respons'}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Trigger Styles
  triggerWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1D24',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FF5A1F',
  },
  triggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheetContainer: {
    backgroundColor: '#1A1D24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8F94A6',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    backgroundColor: '#0B0D12',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sportChipActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    borderColor: '#FF5A1F',
  },
  sportChipText: {
    fontSize: 13,
    color: '#8F94A6',
    fontWeight: '600',
  },
  sportChipTextActive: {
    color: '#FF5A1F',
  },
  darkInput: {
    backgroundColor: '#0B0D12',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitButton: {
    backgroundColor: '#FF5A1F',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Ticket Chat Bubble Styles
  ticketCard: {
    backgroundColor: '#1A1D24',
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
    maxWidth: 290,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5A1F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  ticketIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketBody: {
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketRowText: {
    fontSize: 13,
    color: '#E0E3EB',
    fontWeight: '500',
    flex: 1,
  },
  ticketActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  declineButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0B0D12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8F94A6',
  },
  acceptButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FF5A1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusRow: {
    paddingTop: 2,
  },
  statusLabel: {
    fontSize: 12,
    color: '#8F94A6',
  },
  statusValue: {
    fontWeight: '700',
  },
  statusAccepted: {
    color: '#4ADE80',
  },
  statusPending: {
    color: '#FF9F0A',
  },
});
