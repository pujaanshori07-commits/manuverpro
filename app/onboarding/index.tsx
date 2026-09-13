import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Atmospheric radial glow behind the logo */}
      <LinearGradient
        colors={['rgba(255, 90, 31, 0.16)', 'rgba(11, 13, 18, 0.95)', '#0B0D12']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top spacer */}
        <View style={styles.topSpacer} />

        {/* Center Hero: Prominent Logo + Tagline */}
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Tagline section (no duplicated 'Manuver' text) */}
          <Text style={styles.tagline}>Bikin Manuvermu.</Text>
          <Text style={styles.subTagline}>
            Temukan partner olahraga & kencan di sekitarmu.
          </Text>
        </View>

        {/* Bottom CTA Block */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={() => router.push('/onboarding/flow')}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF5A1F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <Text style={styles.primaryBtnText}>Buat Akun Baru</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/onboarding/auth')}
          >
            <Text style={styles.secondaryBtnText}>
              Sudah punya akun? <Text style={styles.loginLink}>Masuk</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Dengan melanjutkan, kamu menyetujui{' '}
            <Text style={styles.termsLink}>Syarat & Ketentuan</Text> serta{' '}
            <Text style={styles.termsLink}>Kebijakan Privasi</Text>.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topSpacer: {
    height: 20,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  logoWrapper: {
    width: width * 0.85, // Massive sizing to match reference
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  subTagline: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8F94A6',
    textAlign: 'center',
    maxWidth: 280,
  },
  bottomSection: {
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    color: '#8F94A6',
    fontWeight: '500',
  },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  termsText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#555B6E',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  termsLink: {
    color: '#8F94A6',
    textDecorationLine: 'underline',
  },
});
