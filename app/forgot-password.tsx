import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/DesignSystem';

const { width } = Dimensions.get('window');
const redirectTo = Linking.createURL('/');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Email Tidak Valid', 'Silakan masukkan alamat email yang benar.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal mengirimkan tautan reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Lupa Password?</Text>
          <Text style={styles.subtitle}>
            {isSuccess 
              ? 'Tautan untuk mereset password telah dikirim ke email kamu.' 
              : 'Masukkan email yang terdaftar, kami akan mengirimkan tautan untuk mereset password.'}
          </Text>

          {!isSuccess ? (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={COLORS.secondaryText}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity 
                style={styles.button}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <Text style={styles.buttonText}>Kirim Tautan Reset</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.buttonText}>Kembali ke Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 87, 47, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.m,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.l,
    height: 56,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: SPACING.s,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    ...TYPOGRAPHY.body1,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    width: '100%',
    borderRadius: RADIUS.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
  },
});
