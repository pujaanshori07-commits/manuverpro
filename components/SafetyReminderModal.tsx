import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../constants/DesignSystem';

interface SafetyReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SafetyReminderModal({ visible, onClose, onConfirm }: SafetyReminderModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Meeting a New Partner?</Text>
          <Text style={styles.subtitle}>Keep your sports session safe & enjoyable:</Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Meet at a public sports venue or gym</Text>
            <Text style={styles.bulletText}>• Tell a friend or family member your location</Text>
            <Text style={styles.bulletText}>• Bring your own equipment and water bottle</Text>
            <Text style={styles.bulletText}>• Trust your instincts — leave anytime if unsafe</Text>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>Got it, Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 87, 47, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  bulletList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  bulletText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    lineHeight: 22,
  },
  confirmButton: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
});
