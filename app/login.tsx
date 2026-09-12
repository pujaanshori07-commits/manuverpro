import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Dimensions,  Platform, TextInput, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuth } from './_layout';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/DesignSystem';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();
const redirectTo = Linking.createURL('login');

function queryParamsFromUrl(url: string) {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return { params: {} as Record<string, string>, errorCode: null };
  const hashParams = new URLSearchParams(url.substring(hashIndex + 1));
  const params = Object.fromEntries(hashParams.entries());
  return { params, errorCode: params.error_code ?? null };
}

export default function LoginScreen() {
  const { session } = useAuth();
  const [step, setStep] = useState<'landing' | 'options' | 'email_input' | 'check_email'>('landing');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createSessionFromUrl = async (url: string) => {
    const { params, errorCode } = queryParamsFromUrl(url);
    if (errorCode) throw new Error(errorCode);
    const { access_token, refresh_token } = params;
    if (!access_token) return;
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw error;
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) return Alert.alert('Login failed', error.message);

      const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
      if (result.type === 'success') await createSessionFromUrl(result.url);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) return Alert.alert('Invalid Email', 'Please enter a valid email address.');
    setIsLoading(true);
    
    // Send Magic Link using Supabase
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    
    setIsLoading(false);
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStep('check_email');
    }
  };

  const handleDummyAction = () => {
    Alert.alert('Coming Soon', 'This login method is not available yet.');
  };

  if (session) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={{ color: COLORS.primary }}>Mengarahkan...</Text>
      </View>
    );
  }

  const renderLogo = () => (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: width * 0.85, height: width * 0.85 }}
        resizeMode="contain"
      />
      <Text style={styles.taglineText}>Swipe. Match. Main Bareng.</Text>
    </View>
  );

  const renderFooter = () => (
    <Text style={styles.footerText}>
      By continuing, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
    </Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* --- STEP 1: LANDING SCREEN --- */}
        {step === 'landing' && (
          <View style={styles.content}>
            <View style={styles.centerSection}>{renderLogo()}</View>
            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('options')} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>Create an account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('options')} activeOpacity={0.6}>
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
                style={{ width: width * 0.85, height: width * 0.85 }}
                resizeMode="contain"
              />
              <Text style={styles.taglineTextSmall}>Temukan Partner Sparingmu</Text>
            </View>

            <View style={styles.optionsSectionBottom}>
              
              <TouchableOpacity style={styles.optionButtonDark} onPress={() => setStep('email_input')} activeOpacity={0.8}>
                <Ionicons name="mail" size={24} color={COLORS.text} style={styles.optionIcon} />
                <Text style={styles.optionButtonTextLight}>Quick sign in (Email)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButtonDark} onPress={handleDummyAction} activeOpacity={0.8}>
                <Ionicons name="logo-apple" size={24} color={COLORS.text} style={styles.optionIcon} />
                <Text style={styles.optionButtonTextLight}>Continue with Apple ID</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionButtonGoogle} onPress={handleGoogleLogin} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={24} color={COLORS.background} style={styles.optionIcon} />
                <Text style={styles.optionButtonTextDark}>Continue with Google</Text>
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
            
            <Text style={styles.authTitle}>My email is</Text>
            <Text style={styles.authSubtitle}>We will send a 6-digit code to verify your email.</Text>

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

            <TouchableOpacity 
              style={[styles.primaryButton, { marginTop: 40, opacity: email.includes('@') ? 1 : 0.5 }]} 
              onPress={handleSendOtp} 
              disabled={isLoading || !email.includes('@')}
            >
              {isLoading ? <ActivityIndicator color={COLORS.text} /> : <Text style={styles.primaryButtonText}>Continue</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* --- STEP 4: CHECK EMAIL --- */}
        {step === 'check_email' && (
          <View style={styles.authFlowContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('email_input')}>
              <Ionicons name="chevron-back" size={28} color={COLORS.text} />
            </TouchableOpacity>
            
            <Text style={styles.authTitle}>Check your email</Text>
            <Text style={styles.authSubtitle}>We sent a verification link to {email}. Please check your inbox and click the link to login.</Text>

            <TouchableOpacity style={{ marginTop: 40, alignItems: 'center' }} onPress={handleSendOtp}>
              {isLoading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.resendText}>Resend email</Text>}
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
  
  // LOGO STYLES
  centerSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topSection: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  logoContainer: { alignItems: 'center' },
  logoContainerSmall: { transform: [{ scale: 0.8 }] },
  logoHexagon: {
    width: 120, height: 104, backgroundColor: COLORS.text, justifyContent: 'center',
    alignItems: 'center', marginBottom: 20, borderRadius: 24,
  },
  logoHexagonSmall: { width: 90, height: 78, borderRadius: 18, marginBottom: 10 },
  logoDash1: { width: '40%', height: 12, backgroundColor: COLORS.background, borderRadius: 6, marginBottom: 6 },
  logoDash2: { width: '70%', height: 12, backgroundColor: COLORS.background, borderRadius: 6, marginBottom: 6 },
  logoDash3: { width: '40%', height: 12, backgroundColor: COLORS.background, borderRadius: 6 },
  logoText: { color: COLORS.text, fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  logoTextSmall: { fontSize: 32 },
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

  // BUTTONS & FOOTER
  bottomSection: { paddingBottom: 20 },
  primaryButton: {
    backgroundColor: COLORS.primary, width: '100%', paddingVertical: 16,
    borderRadius: 30, alignItems: 'center', marginBottom: 16,
  },
  primaryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '800' },
  secondaryButton: { width: '100%', paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  secondaryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  footerText: { color: COLORS.secondaryText, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  linkText: { color: COLORS.text, textDecorationLine: 'underline' },

  // OPTIONS SCREEN
  backButton: {
    position: 'absolute', top: 10, left: 0, width: 44, height: 44,
    backgroundColor: COLORS.surface, borderRadius: 22, justifyContent: 'center',
    alignItems: 'center', zIndex: 10,
  },
  optionsSectionBottom: { gap: 12 },
  optionButtonDark: {
    flexDirection: 'row', backgroundColor: COLORS.surface, paddingVertical: 16,
    paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  optionButtonGoogle: {
    flexDirection: 'row', backgroundColor: COLORS.text, paddingVertical: 16,
    paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
  },
  optionIcon: { position: 'absolute', left: 20 },
  optionButtonTextLight: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  optionButtonTextDark: { color: COLORS.background, fontSize: 15, fontWeight: '700' },
  bottomFooterSection: { paddingBottom: 20, paddingTop: 20 },

  // AUTH FLOW STYLES (OTP & Phone)
  authTitle: { color: COLORS.text, fontSize: 32, fontWeight: '800', marginBottom: 10 },
  authSubtitle: { color: COLORS.secondaryText, fontSize: 15, marginBottom: 30 },
  phoneInputContainer: {
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2,
    borderBottomColor: COLORS.primary, paddingBottom: 10,
  },
  countryCodeBadge: {
    flexDirection: 'row', alignItems: 'center', marginRight: 15,
    borderRightWidth: 1, borderRightColor: COLORS.border, paddingRight: 15,
  },
  countryCodeText: { color: COLORS.text, fontSize: 20, fontWeight: '600' },
  phoneInput: { flex: 1, color: COLORS.text, fontSize: 24, fontWeight: '600' },
  
  otpInputContainer: {
    alignItems: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.primary, paddingBottom: 10,
  },
  otpInput: {
    color: COLORS.text, fontSize: 40, fontWeight: '800', textAlign: 'center', width: '100%',
  },
  resendText: {
    color: COLORS.secondaryText, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline',
  }
});
