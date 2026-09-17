import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/DesignSystem';

const { width } = Dimensions.get('window');

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Password Lemah', 'Password harus minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Tidak Cocok', 'Konfirmasi password tidak sama dengan password baru.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Gagal memperbarui password.');
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
          <TouchableOpacity onPress={() => router.push('/login')} style={styles.backButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="key" size={48} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Buat Password Baru</Text>
          <Text style={styles.subtitle}>
            {isSuccess 
              ? 'Password kamu berhasil diperbarui. Kamu sekarang sudah masuk ke dalam aplikasi.' 
              : 'Silakan masukkan password baru untuk akun kamu.'}
          </Text>

          {!isSuccess ? (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password Baru"
                  placeholderTextColor={COLORS.secondaryText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Konfirmasi Password Baru"
                  placeholderTextColor={COLORS.secondaryText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={styles.button}
                onPress={handleUpdatePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.text} />
                ) : (
                  <Text style={styles.buttonText}>Simpan Password</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.buttonText}>Lanjutkan ke Aplikasi</Text>
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
    alignItems: 'flex-end',
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
    marginBottom: SPACING.m,
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
    marginTop: SPACING.m,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
  },
});
