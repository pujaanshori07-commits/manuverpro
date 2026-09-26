import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../constants/theme';
import { PermissionState } from '../hooks/useLocationManager';

interface LocationPermissionModalProps {
  visible: boolean;
  state: PermissionState;
  loading: boolean;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
  onSkip: () => void;
}

export default function LocationPermissionModal({
  visible,
  state,
  loading,
  onRequestPermission,
  onOpenSettings,
  onSkip,
}: LocationPermissionModalProps) {
  
  let title = 'Temukan Partner Terdekat';
  let description = 'MANUVER menggunakan lokasi Anda untuk menampilkan teman olahraga di sekitar Anda — mulai dari lapangan badminton hingga gym terdekat.';
  let primaryAction = 'Aktifkan Lokasi';
  let primaryActionFunc = onRequestPermission;
  let iconName: keyof typeof Ionicons.glyphMap = 'location';

  if (state === 'BLOCKED') {
    title = 'Akses Lokasi Diblokir';
    description = 'Akses lokasi telah dinonaktifkan secara permanen. Aktifkan melalui pengaturan perangkat Anda untuk menemukan teman olahraga di sekitarmu.';
    primaryAction = 'Buka Pengaturan';
    primaryActionFunc = onOpenSettings;
    iconName = 'settings';
  } else if (state === 'SERVICES_DISABLED') {
    title = 'GPS Anda Nonaktif';
    description = 'Layanan lokasi (GPS) pada perangkat Anda saat ini sedang dimatikan. Mohon aktifkan di pengaturan untuk mencari partner di dekatmu.';
    primaryAction = 'Buka Pengaturan';
    primaryActionFunc = onOpenSettings;
    iconName = 'navigate-circle';
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[Colors.primary, '#E6441D']}
              style={styles.iconGradient}
            >
              <Ionicons name={iconName} size={32} color={Colors.white} />
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={primaryActionFunc}
              activeOpacity={0.8}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.primary, '#E6441D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>{primaryAction}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSkip}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Nanti Saja</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 10, 13, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#171A21',
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fontHeading,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  actionContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    borderRadius: BorderRadius.pill,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: Typography.fontHeading,
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: Typography.fontMedium,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
