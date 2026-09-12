import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { COLORS, SIZES } from '../../constants/DesignSystem';

export default function TermsScreen() {
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ terms_accepted: true }).eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
      // The router in _layout.tsx will automatically pick up the change and navigate to /onboarding/location
      // But we can also manually navigate to be safe
      router.replace('/onboarding/location' as any);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Gagal menyetujui syarat & ketentuan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="document-text-outline" size={60} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Syarat & Ketentuan</Text>
        <Text style={styles.subtitle}>
          Untuk menggunakan Manuver, kamu harus menyetujui Syarat Ketentuan dan Kebijakan Privasi kami. Kami berjanji untuk menjaga data kamu dengan aman.
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleAccept} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.text} /> : <Text style={styles.buttonText}>Setuju & Lanjutkan</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: COLORS.secondaryText, lineHeight: 24, textAlign: 'center' },
  footer: { padding: 32, paddingBottom: 50 },
  button: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', width: '100%' },
  buttonText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' }
});
