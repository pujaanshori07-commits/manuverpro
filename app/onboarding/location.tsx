import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity,  ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { COLORS, SIZES } from '../../constants/DesignSystem';

export default function LocationScreen() {
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!session) return;
    setSaving(true);
    setErrorMsg(null);
    
    try {
      await Location.requestForegroundPermissionsAsync();
      const { error } = await supabase.from('profiles').update({ location_asked: true }).eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
      
      router.replace('/onboarding/questionnaire' as any);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Gagal menyimpan lokasi. Silakan coba lagi.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: '12.5%' }]} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>So, are you from around here?</Text>
        <Text style={styles.subtitle}>
          Set your location to see who's in your neighborhood ready for a workout. You won't be able to match with people otherwise.
        </Text>
        
        <View style={styles.iconCircle}>
          <Ionicons name="location-outline" size={60} color={COLORS.primary} />
        </View>
      </View>
      
      <View style={styles.footer}>
        {errorMsg && <Text style={{ color: COLORS.error || '#FF3B30', textAlign: 'center', marginBottom: 12 }}>{errorMsg}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.text} /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  progressBarContainer: { height: 4, backgroundColor: COLORS.surface, width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  content: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginBottom: 16, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' },
  subtitle: { fontSize: 16, color: COLORS.secondaryText, lineHeight: 24, textAlign: 'center', marginBottom: 60 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  footer: { padding: 32, paddingBottom: 50 },
  button: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center', width: '100%' },
  buttonText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' }
});
