import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface ProfileData {
  nama: string;
  pekerjaan: string;
  pendidikan: string;
  hobi: string;
  bio: string;
  foto_url: string;
}

const DEFAULT_PROFILE: ProfileData = {
  nama: 'Andi Pratama',
  pekerjaan: 'Product Designer',
  pendidikan: 'Universitas Indonesia',
  hobi: 'Badminton, Gym, Running, Basket',
  bio: 'Cari partner olahraga santai weekend atau sparring badminton rutin di Jaksel.',
  foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        setProfile(DEFAULT_PROFILE);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setProfile(DEFAULT_PROFILE);
      } else {
        setProfile({
          nama: data.nama || '',
          pekerjaan: data.pekerjaan || '',
          pendidikan: data.pendidikan || '',
          hobi: Array.isArray(data.hobi) ? data.hobi.join(', ') : (data.hobi || ''),
          bio: data.bio || '',
          foto_url: data.foto_url || DEFAULT_PROFILE.foto_url,
        });
      }
    } catch {
      setProfile(DEFAULT_PROFILE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (!userId) {
        Alert.alert('Sukses', 'Profil berhasil diperbarui!');
        return;
      }

      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        nama: profile.nama,
        pekerjaan: profile.pekerjaan,
        pendidikan: profile.pendidikan,
        hobi: profile.hobi.split(',').map((s) => s.trim()).filter(Boolean),
        bio: profile.bio,
        foto_url: profile.foto_url,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        Alert.alert('Gagal', error.message);
      } else {
        Alert.alert('Sukses', 'Profil berhasil disimpan!');
      }
    } catch {
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar dari Akun',
      'Apakah kamu yakin ingin keluar dari MANUVER?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profil</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <View style={styles.photoCard}>
                <Image
                  source={{ uri: profile.foto_url }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.cameraBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    Alert.alert('Ubah Foto', 'Pilih foto dari galeri atau kamera.')
                  }
                >
                  <Ionicons name="camera" size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>
              <Text style={styles.photoHint}>Tap untuk mengubah foto</Text>
            </View>

            {/* Form Inputs */}
            <View style={styles.formContainer}>
              {/* Nama Panggilan */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Panggilan</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.nama}
                  onChangeText={(text) => setProfile({ ...profile, nama: text })}
                  placeholder="Masukkan nama panggilan"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Pekerjaan */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pekerjaan</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.pekerjaan}
                  onChangeText={(text) => setProfile({ ...profile, pekerjaan: text })}
                  placeholder="Contoh: Product Designer, Software Engineer"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Pendidikan */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pendidikan</Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.pendidikan}
                  onChangeText={(text) => setProfile({ ...profile, pendidikan: text })}
                  placeholder="Contoh: Universitas Indonesia"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Hobi & Olahraga */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Hobi & Olahraga (Pisahkan dengan koma)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={profile.hobi}
                  onChangeText={(text) => setProfile({ ...profile, hobi: text })}
                  placeholder="Futsal, Badminton, Running, Gym"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Bio Singkat */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio Singkat</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={profile.bio}
                  onChangeText={(text) => setProfile({ ...profile, bio: text })}
                  placeholder="Ceritakan rutinitas olahraga atau partner seperti apa yang kamu cari..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl + 20,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  photoCard: {
    width: 140,
    height: 180,
    borderRadius: 20,
    backgroundColor: Colors.surfaceInput,
    position: 'relative',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  photoHint: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 18,
  },
  formContainer: {
    paddingHorizontal: Spacing.base,
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  textInput: {
    backgroundColor: Colors.surfaceInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontFamily: Typography.fontRegular,
    fontSize: 15,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnText: {
    fontFamily: Typography.fontHeading,
    fontSize: 15,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
