import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const router = useRouter();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'email' | 'phone') => {
    setLoadingProvider(provider);
    try {
      setTimeout(() => {
        setLoadingProvider(null);
        router.replace('/(tabs)');
      }, 700);
    } catch (e: any) {
      setLoadingProvider(null);
      Alert.alert('Gagal Masuk', e.message || 'Terjadi kendala.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Clean Logo Header (No duplicate text) */}
        <View style={styles.centerBrand}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.authPrompt}>Masuk untuk melanjutkan manuvermu</Text>
        </View>

        {/* Auth Buttons Stack */}
        <View style={styles.authStack}>
          {/* Quick Email */}
          <TouchableOpacity
            style={[styles.authBtn, styles.outlineBtn]}
            onPress={() => handleOAuthLogin('email')}
            disabled={loadingProvider !== null}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={19} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.authBtnText}>Quick sign in (Email)</Text>
          </TouchableOpacity>

          {/* Apple ID */}
          <TouchableOpacity
            style={[styles.authBtn, styles.appleBtn]}
            onPress={() => handleOAuthLogin('apple')}
            disabled={loadingProvider !== null}
            activeOpacity={0.8}
          >
            {loadingProvider === 'apple' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.authBtnText}>Continue with Apple ID</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Google */}
          <TouchableOpacity
            style={[styles.authBtn, styles.googleBtn]}
            onPress={() => handleOAuthLogin('google')}
            disabled={loadingProvider !== null}
            activeOpacity={0.8}
          >
            {loadingProvider === 'google' ? (
              <ActivityIndicator color="#0B0D12" />
            ) : (
              <>
                <Ionicons name="logo-google" size={18} color="#0B0D12" style={styles.btnIcon} />
                <Text style={[styles.authBtnText, styles.googleBtnText]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            style={[styles.authBtn, styles.outlineBtn]}
            onPress={() => handleOAuthLogin('phone')}
            disabled={loadingProvider !== null}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.authBtnText}>Use cell phone number</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
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
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  header: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A1D24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  centerBrand: {
    alignItems: 'center',
    marginVertical: 10,
  },
  logoBox: {
    width: width * 0.75, // Matches the large reference image
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  authPrompt: {
    fontSize: 13,
    color: '#8F94A6',
    marginTop: 6,
    textAlign: 'center',
  },
  authStack: {
    gap: 12,
    marginBottom: 10,
  },
  authBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  btnIcon: {
    position: 'absolute',
    left: 20,
  },
  authBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outlineBtn: {
    backgroundColor: '#14171E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  appleBtn: {
    backgroundColor: '#16181F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
  },
  googleBtnText: {
    color: '#0B0D12',
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 10 : 16,
  },
  termsText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#555B6E',
    textAlign: 'center',
  },
  termsLink: {
    color: '#8F94A6',
    textDecorationLine: 'underline',
  },
});
