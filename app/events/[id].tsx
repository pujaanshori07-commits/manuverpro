import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);

  const fetchEventDetails = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // Ambil data event
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setEvent(data);

      // Cek apakah user sudah mendaftar
      if (userId) {
        const { data: regData } = await supabase
          .from('event_registrations')
          .select('*')
          .eq('event_id', id)
          .eq('user_id', userId)
          .eq('status', 'registered')
          .single();
          
        if (regData) setHasRegistered(true);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Anda harus login untuk mendaftar.");

      const { error } = await supabase.from('event_registrations').insert([
        {
          event_id: id,
          user_id: userData.user.id,
          status: 'registered'
        }
      ]);

      if (error) {
        if (error.code === '23505') { // unique violation
          throw new Error("Anda sudah terdaftar di event ini.");
        }
        throw error;
      }

      // Update angka partisipan di UI optimistically
      setHasRegistered(true);
      Alert.alert('Berhasil!', 'Anda telah terdaftar di event ini. Sampai jumpa di lapangan!');
      
    } catch (e: any) {
      Alert.alert('Gagal Mendaftar', e.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ color: Colors.white }}>Event tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.image_url }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(9,10,13,0.7)', 'transparent', '#090A0D']}
            locations={[0, 0.4, 1]}
            style={styles.heroGradient}
          />
          <TouchableOpacity 
            style={[styles.backBtn, { top: insets.top + 10 }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{event.category} • {event.type}</Text>
          </View>
          
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.organizer}>Oleh: {event.organizer}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}><Ionicons name="calendar" size={20} color={Colors.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Tanggal & Waktu</Text>
                <Text style={styles.infoValue}>{event.date}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}><Ionicons name="location" size={20} color={Colors.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Lokasi</Text>
                <Text style={styles.infoValue}>{event.location}, {event.city}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.iconCircle}><Ionicons name="ticket" size={20} color={Colors.primary} /></View>
              <View>
                <Text style={styles.infoLabel}>Biaya</Text>
                <Text style={styles.infoValue}>{event.price}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Status Verifikasi</Text>
          <View style={styles.statusBox}>
            <Ionicons 
              name={event.status === 'approved' ? 'checkmark-circle' : 'time'} 
              size={24} 
              color={event.status === 'approved' ? '#00C48C' : '#FF9F0A'} 
            />
            <Text style={styles.statusText}>
              {event.status === 'approved' ? 'Event Resmi & Terverifikasi Manuver' : 'Event sedang dalam tahap peninjauan tim'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[
            styles.registerBtn, 
            hasRegistered && styles.registeredBtn,
            (registering || (event.status !== 'approved' && !hasRegistered)) && { opacity: 0.5 }
          ]} 
          onPress={hasRegistered ? undefined : handleRegister}
          disabled={hasRegistered || registering || event.status !== 'approved'}
        >
          <Text style={styles.registerBtnText}>
            {registering ? 'Mendaftar...' : hasRegistered ? 'Anda Telah Terdaftar ✓' : event.status === 'approved' ? 'Daftar Sekarang' : 'Belum Diverifikasi'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  heroContainer: { width: '100%', height: 350, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFill },
  backBtn: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, marginTop: -30 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.primary },
  categoryText: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
  title: { fontSize: 28, fontFamily: Typography.fontHeading, fontWeight: '800', color: Colors.white, marginBottom: 8, letterSpacing: -0.5 },
  organizer: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 90, 31, 0.1)', alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 15, color: Colors.white, fontWeight: '600' },
  infoDivider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 12 },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  statusText: { flex: 1, fontSize: 14, color: Colors.white, lineHeight: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, paddingHorizontal: Spacing.base, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  registerBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: BorderRadius.round, alignItems: 'center' },
  registeredBtn: { backgroundColor: '#00C48C' },
  registerBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
