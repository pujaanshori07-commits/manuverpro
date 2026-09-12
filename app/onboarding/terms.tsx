import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

import { useAuth } from '../_layout';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();

  const handleAccept = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ terms_accepted: true })
          .eq('id', user.id);
        await refreshProfile();
      }
    } catch (e) {
      console.log('terms update error', e);
    } finally {
      setLoading(false);
      router.push('/onboarding/questionnaire');
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.stepProgressRow}>
          <View style={[styles.stepBar, styles.stepBarActive]} />
          <View style={styles.stepBar} />
          <View style={styles.stepBar} />
        </View>
        <Text style={styles.stepLabel}>1 / 3 — Syarat & Ketentuan</Text>
      </View>

      {/* Brand Headline */}
      <View style={styles.heroSection}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>M</Text>
        </View>
        <Text style={styles.heroTitle}>Selamat Datang di{'\n'}<Text style={styles.heroAccent}>MANUVER</Text></Text>
        <Text style={styles.heroSub}>
          Sebelum mulai, bacalah ringkasan ketentuan layanan kami. Ini hanya butuh 30 detik.
        </Text>
      </View>

      {/* Terms Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {[
          {
            icon: 'shield-checkmark' as const,
            title: 'Keamanan & Privasi',
            desc: 'Data pribadimu disimpan aman. Kami tidak pernah menjual data ke pihak ketiga.',
          },
          {
            icon: 'location' as const,
            title: 'Akses Lokasi',
            desc: 'Lokasi spesifikmu tidak akan pernah ditampilkan ke siapapun, hanya radius perkiraan jarak.',
          },
          {
            icon: 'people' as const,
            title: 'Komunitas Sehat',
            desc: 'Dilarang mengirim konten yang kasar, spam, atau tidak pantas. Pelanggaran akan mengakibatkan pemblokiran akun.',
          },
          {
            icon: 'heart' as const,
            title: 'Tujuan Platform',
            desc: 'MANUVER adalah platform untuk menemukan partner olahraga, bukan untuk tujuan yang melanggar hukum.',
          },
        ].map((item, i) => (
          <View key={i} style={styles.termCard}>
            <View style={styles.termIconWrap}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.termTextWrap}>
              <Text style={styles.termTitle}>{item.title}</Text>
              <Text style={styles.termDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Checkbox + Button */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
            {accepted && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.checkLabel}>
            Saya menyetujui <Text style={styles.checkLabelLink}>Syarat & Ketentuan</Text> serta <Text style={styles.checkLabelLink}>Kebijakan Privasi</Text> MANUVER.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, !accepted && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          activeOpacity={0.88}
          disabled={!accepted || loading}
        >
          <LinearGradient
            colors={accepted ? [Colors.primary, '#E6441D'] : [Colors.surfaceBorder, Colors.surfaceBorder]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.acceptButtonText}>
              {loading ? 'Memproses...' : 'Setuju & Lanjut'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: 8 },
  stepProgressRow: { flexDirection: 'row', gap: 6 },
  stepBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)' },
  stepBarActive: { backgroundColor: Colors.primary },
  stepLabel: { fontFamily: Typography.fontRegular, fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
  heroSection: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: 10 },
  brandBadge: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  brandBadgeText: { fontFamily: Typography.fontHeading, fontSize: 28, color: Colors.white, fontStyle: 'italic' },
  heroTitle: { fontFamily: Typography.fontHeading, fontSize: 26, color: Colors.textPrimary, textAlign: 'center', lineHeight: 32 },
  heroAccent: { color: Colors.primary },
  heroSub: { fontFamily: Typography.fontRegular, fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.base, gap: 12, paddingBottom: 16 },
  termCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, padding: 14,
  },
  termIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 87, 47, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  termTextWrap: { flex: 1, gap: 3 },
  termTitle: { fontFamily: Typography.fontSemiBold, fontSize: 14, color: Colors.textPrimary },
  termDesc: { fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  bottomArea: { paddingHorizontal: Spacing.base, paddingTop: 12, gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceInput, alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkLabel: { flex: 1, fontFamily: Typography.fontRegular, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  checkLabelLink: { color: Colors.primary, fontFamily: Typography.fontSemiBold },
  acceptButton: { borderRadius: BorderRadius.round, overflow: 'hidden' },
  acceptButtonDisabled: { opacity: 0.5 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  acceptButtonText: { fontFamily: Typography.fontHeading, fontSize: 15, color: Colors.white, letterSpacing: 0.4 },
});
