import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);

  const { refreshProfile } = useAuth();

  const markOnboardingComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ location_asked: true, onboarding_complete: true })
          .eq('id', user.id);
        await refreshProfile();
      }
    } catch (e) {
      console.log('Failed to update onboarding status', e);
    }
  };

  const handleEnableLocation = async () => {
    try {
      setRequesting(true);
      // Optional: hook into expo-location (Location.requestForegroundPermissionsAsync)
      // For now, simulate rapid authorization & route to main app
      setTimeout(async () => {
        await markOnboardingComplete();
        setRequesting(false);
        router.replace('/(tabs)');
      }, 700);
    } catch (e) {
      console.error(e);
      setRequesting(false);
      // Even if it fails, proceed to tabs so we don't block
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
        {/* Top Header & Progress (Step 3 of 3) */}
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
            <View style={[styles.stepBar, styles.stepBarDone]} />
            <View style={[styles.stepBar, styles.stepBarActive]} />
          </View>

          <View style={styles.stepCounterWrap}>
            <Text style={styles.stepCounterText}>3/3</Text>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {/* Radar / Geospatial Visual Element */}
          <View style={styles.radarContainer}>
            {/* Outermost Radar Ring */}
            <View style={styles.radarRingOuter}>
              {/* Mid Radar Ring */}
              <View style={styles.radarRingMid}>
                {/* Inner Glow Center */}
                <View style={styles.radarRingCenter}>
                  <LinearGradient
                    colors={[Colors.primary, '#E6441D']}
                    style={styles.centerIconCircle}
                  >
                    <Ionicons name="navigate" size={32} color={Colors.white} />
                  </LinearGradient>
                </View>

                {/* Nearby Partner Floating Pin 1 */}
                <View style={[styles.floatingPin, styles.pinTopRight]}>
                  <Ionicons name="walk" size={14} color={Colors.white} />
                  <Text style={styles.pinText}>1.2 km</Text>
                </View>

                {/* Nearby Partner Floating Pin 2 */}
                <View style={[styles.floatingPin, styles.pinBottomLeft]}>
                  <Ionicons name="barbell" size={14} color={Colors.white} />
                  <Text style={styles.pinText}>2.8 km</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textSection}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagBadgeText}>PRECISE MATCHING</Text>
            </View>
            <Text style={styles.titleText}>Aktifkan Akses Lokasi</Text>
            <Text style={styles.descriptionText}>
              MANUVER menggunakan lokasimu untuk menemukan teman olahraga terdekat di sekitarmu — mulai dari lapangan badminton, gym, hingga rute lari terdekat.
            </Text>
          </View>

          {/* Privacy & Benefit Cards */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitTextWrap}>
                <Text style={styles.benefitTitle}>Privasi Terjaga</Text>
                <Text style={styles.benefitSubtitle}>
                  Lokasi spesifikmu tidak pernah dibagikan, hanya perkiraan jarak (radius KM).
                </Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <View style={styles.benefitIconWrap}>
                <Ionicons name="notifications" size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitTextWrap}>
                <Text style={styles.benefitTitle}>Notifikasi Partner Baru</Text>
                <Text style={styles.benefitSubtitle}>
                  Dapatkan info instan saat ada orang baru yang ingin olahraga bareng.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Big Bold Enable Location Button */}
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleEnableLocation}
            activeOpacity={0.88}
            disabled={requesting}
          >
            <LinearGradient
              colors={[Colors.primary, '#E6441D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {requesting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="location" size={20} color={Colors.white} />
                  <Text style={styles.enableButtonText}>Aktifkan Lokasi</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Skip Option */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Nanti Saja</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepProgressRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  stepBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  stepBarDone: {
    backgroundColor: Colors.primary,
    opacity: 0.5,
  },
  stepBarActive: {
    backgroundColor: Colors.primary,
  },
  stepCounterWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  stepCounterText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    justifyContent: 'center',
    gap: 24,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  radarRingOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 47, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 87, 47, 0.02)',
  },
  radarRingMid: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 47, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 87, 47, 0.04)',
  },
  radarRingCenter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255, 87, 47, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(23, 26, 33, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  pinTopRight: {
    top: -6,
    right: -14,
  },
  pinBottomLeft: {
    bottom: 2,
    left: -20,
  },
  pinText: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    color: Colors.textPrimary,
  },
  textSection: {
    alignItems: 'center',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 87, 47, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 47, 0.3)',
  },
  tagBadgeText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
  },
  titleText: {
    fontFamily: Typography.fontHeading,
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: Spacing.sm,
  },
  benefitsContainer: {
    gap: 10,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 26, 33, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  benefitIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 87, 47, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextWrap: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  benefitSubtitle: {
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  bottomArea: {
    paddingHorizontal: Spacing.base,
    gap: 12,
  },
  enableButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 8,
  },
  enableButtonText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.white,
    letterSpacing: 0.4,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipButtonText: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
