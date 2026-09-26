import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../lib/supabase';
import { useAuth } from './_layout';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/DesignSystem';

const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

// We will generate redirect URL dynamically inside the component

// Robust query and hash fragment parser for React Native custom schemes
function parseParamsFromUrl(url: string) {
  const params: Record<string, string> = {};
  const segments = url.split(/[\?\#]/);
  
  for (let i = 1; i < segments.length; i++) {
    segments[i].split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        try {
          params[key] = decodeURIComponent(value.replace(/\+/g, ' '));
        } catch {
          params[key] = value;
        }
      }
    });
  }

  return {
    params,
    errorCode: params.error_description || params.error || null,
  };
}

export default function LoginScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'landing' | 'options' | 'email_input' | 'check_email'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fallback deep link listener
  useEffect(() => {
    const handleDeepLink = (event: Linking.EventType) => {
      if (
        event.url &&
        (event.url.includes('code=') ||
          event.url.includes('access_token=') ||
          event.url.includes('error='))
      ) {
        createSessionFromUrl(event.url);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const createSessionFromUrl = async (url: string) => {
    try {
      const { params, errorCode } = parseParamsFromUrl(url);

      if (errorCode) {
        Alert.alert('OAuth Error', errorCode);
        return;
      }

      setIsLoading(true);

      // 1. Recovery Flow (User clicked reset password link)
      if (params.type === 'recovery' && params.access_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token || '',
        });
        if (error) throw error;
        router.push('/reset-password');
        return;
      }

      // 2. PKCE Flow (exchange authorization code)
      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) throw error;
        return;
      }

      // 3. Implicit Flow (access_token & refresh_token)
      if (params.access_token) {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token || '',
        });
        if (error) throw error;
        return;
      }

      Alert.alert('Auth Error', 'No authorization code or tokens received in redirect.');
    } catch (e: any) {
      Alert.alert('Session Parse Error', e.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Generate redirect URI dynamically to ensure it captures the correct scheme for both Expo Go and Dev Client
      const currentRedirectUrl = Linking.createURL('login');
      
      console.log('DEBUG: Generated Redirect URL ->', currentRedirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: currentRedirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return Alert.alert('Login Failed', error.message);
      }

      // Pass showInRecents: true to prevent Android task affinity freezing
      const result = await WebBrowser.openAuthSessionAsync(
        data.url!,
        currentRedirectUrl,
        { showInRecents: true }
      );

      if (result.type === 'success' && result.url) {
        await createSessionFromUrl(result.url);
      } else {
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Auth Launch Error', err.message || 'Could not start Google login.');
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !email.includes('@')) {
      return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    }
    if (!password) {
      return Alert.alert('Invalid Password', 'Please enter your password.');
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        Alert.alert(
          'Email / Password Salah', 
          'Pastikan email dan password Anda benar. Jika Anda baru mendaftar, pastikan Anda sudah mengklik link verifikasi di email Anda.',
          [
            { text: 'Coba Lagi', style: 'cancel' },
            { text: 'Lupa Password?', onPress: () => router.push('/forgot-password') }
          ]
        );
      } else {
        Alert.alert('Gagal Masuk', error.message);
      }
    }
  };

  const handleDummyAction = () => {
    Alert.alert('Coming Soon', 'This login method is not available yet.');
  };

  if (session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.primary, marginTop: 12, fontWeight: '600' }}>
          Mengarahkan...
        </Text>
      </View>
    );
  }

  const renderLogo = () => (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: width * 0.65, height: width * 0.65 }}
        resizeMode="contain"
      />
      <Text style={styles.taglineText}>Swipe. Match. Play.</Text>
    </View>
  );

  const renderFooter = () => (
    <Text style={styles.footerText}>
      By continuing, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and{' '}
      <Text style={styles.linkText}>Privacy Policy</Text>.
    </Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* --- STEP 1: LANDING SCREEN --- */}
        {step === 'landing' && (
          <View style={styles.content}>
            <View style={styles.centerSection}>{renderLogo()}</View>
            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push('/register')}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Create an account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setStep('options')}
                activeOpacity={0.6}
              >
                <Text style={styles.secondaryButtonText}>I have an account</Text>
              </TouchableOpacity>
              {renderFooter()}
            </View>
          </View>
        )}

        {/* --- STEP 2: OPTIONS SCREEN --- */}
        {step === 'options' && (
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('landing')}>
              <Ionicons name="chevron-back" size={28} color={COLORS.text} />
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 20, alignItems: 'center' }}>
              <Image
                source={require('../assets/images/logo.png')}
                style={{ width: width * 0.65, height: width * 0.65 }}
                resizeMode="contain"
              />
              <Text style={styles.taglineTextSmall}>Temukan Partner Sparingmu</Text>
            </View>

            <View style={styles.optionsSectionBottom}>
              <TouchableOpacity
                style={styles.optionButtonDark}
                onPress={() => setStep('email_input')}
                activeOpacity={0.8}
              >
                <Ionicons name="mail" size={24} color={COLORS.text} style={styles.optionIcon} />
                <Text style={styles.optionButtonTextLight}>Quick sign in (Email)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButtonDark} onPress={handleDummyAction} activeOpacity={0.8}>
                <Ionicons name="logo-apple" size={24} color={COLORS.text} style={styles.optionIcon} />
                <Text style={styles.optionButtonTextLight}>Continue with Apple ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButtonGoogle}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color={COLORS.background} style={styles.optionIcon} />
                    <Text style={styles.optionButtonTextDark}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButtonDark} onPress={handleDummyAction} activeOpacity={0.8}>
                <Ionicons name="call" size={24} color={COLORS.text} style={styles.optionIcon} />
                <Text style={styles.optionButtonTextLight}>Use cell phone number</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bottomFooterSection}>{renderFooter()}</View>
          </View>
        )}

        {/* --- STEP 3: EMAIL INPUT --- */}
        {step === 'email_input' && (
          <View style={styles.authFlowContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('options')}>
              <Ionicons name="chevron-back" size={28} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.authTitle}>Email Login</Text>
            <Text style={styles.authSubtitle}>Enter your email and password to log in.</Text>

            <View style={styles.phoneInputContainer}>
              <View style={styles.countryCodeBadge}>
                <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
              </View>
              <TextInput
                style={[styles.phoneInput, { fontSize: 20 }]}
                placeholder="your.email@example.com"
                placeholderTextColor={COLORS.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                autoFocus
              />
            </View>

            <View style={[styles.phoneInputContainer, { marginTop: 24 }]}>
              <View style={styles.countryCodeBadge}>
                <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} />
              </View>
              <TextInput
                style={[styles.phoneInput, { fontSize: 20 }]}
                placeholder="Your password"
                placeholderTextColor={COLORS.secondaryText}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { marginTop: 40, opacity: email.includes('@') && password ? 1 : 0.5 },
              ]}
              onPress={handleEmailLogin}
              disabled={isLoading || !email.includes('@') || !password}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ marginTop: 20, alignSelf: 'center' }} 
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '600' }}>Lupa Password?</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  authFlowContent: {
    flex: 1,
    paddingTop: 80,
  },
  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  taglineText: {
    color: COLORS.secondaryText,
    fontSize: 16,
    fontWeight: '500',
    marginTop: -10,
  },
  taglineTextSmall: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: '500',
    marginTop: -5,
  },
  bottomSection: { paddingBottom: 20 },
  primaryButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  secondaryButton: { width: '100%', paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  secondaryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  footerText: { color: COLORS.secondaryText, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  linkText: { color: COLORS.text, textDecorationLine: 'underline' },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 0,
    width: 44,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  optionsSectionBottom: { gap: 12 },
  optionButtonDark: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonGoogle: {
    flexDirection: 'row',
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: { position: 'absolute', left: 20 },
  optionButtonTextLight: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  optionButtonTextDark: { color: COLORS.background, fontSize: 15, fontWeight: '700' },
  bottomFooterSection: { paddingBottom: 20, paddingTop: 20 },
  authTitle: { color: COLORS.text, fontSize: 32, fontWeight: '800', marginBottom: 10 },
  authSubtitle: { color: COLORS.secondaryText, fontSize: 15, marginBottom: 30 },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 10,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 15,
  },
  phoneInput: { flex: 1, color: COLORS.text, fontSize: 24, fontWeight: '600' },
});
