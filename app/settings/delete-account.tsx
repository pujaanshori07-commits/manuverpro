import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES } from '../../constants/DesignSystem';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = inputText.trim().toUpperCase() === 'DELETE';
  const isTyping = inputText.length > 0;

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    
    try {
      const { error } = await supabase.rpc('delete_user_account');
      
      if (error) {
        throw error;
      }
      
      // Successfully deleted on backend, now sign out locally
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
         console.error('Sign out error after delete:', signOutError);
      }
      
      router.replace('/login' as any);
      setTimeout(() => {
        Alert.alert('Berhasil', 'Akun kamu telah dihapus.');
      }, 500);

    } catch (e: any) {
      Alert.alert('Gagal Menghapus Akun', e.message || 'Terjadi kesalahan saat menghapus akun.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Hapus Akun',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackTitle: 'Kembali'
        }} 
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.content}>
            <View style={styles.centerSection}>
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning" size={60} color={COLORS.primary} />
              </View>
              
              <Text style={styles.headline}>Hapus Akun?</Text>
              
              <View style={styles.bodyContainer}>
                <Text style={styles.bodyText}>Tindakan ini tidak dapat dibatalkan. Semua data (profil, match, pesan) akan dihapus permanen.</Text>
                
                <Text style={[styles.subtitle, { marginTop: 24, marginBottom: 12, color: COLORS.text, fontWeight: 'bold' }]}>
                  Ketik DELETE untuk mengonfirmasi
                </Text>
                
                <TextInput
                  style={[
                    styles.input, 
                    isTyping && !isConfirmed && { borderColor: '#FF3B30' },
                    isConfirmed && { borderColor: COLORS.primary }
                  ]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ketik DELETE"
                  placeholderTextColor={COLORS.secondaryText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!isDeleting}
                />
              </View>
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity 
                style={[
                  styles.deleteButton, 
                  !isConfirmed && styles.deleteButtonDisabled
                ]} 
                onPress={handleDelete}
                disabled={!isConfirmed || isDeleting}
                activeOpacity={0.8}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Hapus Akun Permanen</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => router.back()}
                disabled={isDeleting}
                activeOpacity={0.6}
              >
                <Text style={styles.secondaryButtonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  warningIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  headline: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondaryText,
    marginBottom: 32,
    textAlign: 'center',
  },
  
  bodyContainer: {
    width: '100%',
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bodyText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  bulletText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    lineHeight: 24,
    paddingLeft: 8,
  },
  
  input: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.borderRadius,
    paddingVertical: 18,
    paddingHorizontal: 20,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  bottomSection: {
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#FF3B30', // Destructive red as requested
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  
  deleteButton: {
    backgroundColor: '#FF3B30',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteButtonDisabled: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
