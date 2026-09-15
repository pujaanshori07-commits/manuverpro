import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useAuth } from '../app/_layout';

interface EmergencySlot {
  id: string;
  creator_id: string;
  sport: string;
  venue_name: string;
  play_time: string;
  slots_needed: number;
  fee_per_person: number;
  note?: string;
  contact_wa?: string;
  creator?: { nama: string; foto_url: string };
}

interface Props {
  onOpenCreate: () => void;
}

export default function DaruratKurang1Board({ onOpenCreate }: Props) {
  const { session } = useAuth();
  const [slots, setSlots] = useState<EmergencySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchActiveSlots = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('emergency_slots')
        .select('id, creator_id, sport, venue_name, play_time, slots_needed, fee_per_person, note, contact_wa, creator:creator_id (nama, foto_url)')
        .eq('status', 'active')
        .gt('expires_at', nowIso)
        .order('play_time', { ascending: true })
        .limit(10);
      if (!error && data) setSlots(data as any);
    } catch (err) {
      console.log('Error fetching emergency slots:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSlots();
    const channel = supabase
      .channel('emergency-slots-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_slots' }, () => fetchActiveSlots())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchActiveSlots]);

  const handleClaim = async (slot: EmergencySlot) => {
    if (!session) { Alert.alert('Perhatian', 'Silakan login terlebih dahulu.'); return; }
    if (slot.creator_id === session.user.id) { Alert.alert('Info', 'Ini slot darurat yang kamu buat.'); return; }
    Alert.alert('Gabung Sesi Darurat', `Slot untuk ${slot.sport} di ${slot.venue_name}\nPatungan: ${slot.fee_per_person > 0 ? 'Rp ' + slot.fee_per_person.toLocaleString('id-ID') : 'Gratis'}`,
      [{ text: 'Batal', style: 'cancel' }, {
        text: 'Gas Ikut!', onPress: async () => {
          setClaimingId(slot.id);
          try {
            const { data, error } = await supabase.rpc('claim_emergency_slot', { p_slot_id: slot.id });
            if (error) throw error;
            if (data?.success) {
              Alert.alert('Berhasil!', `Terdaftar di ${slot.venue_name}. Hubungi via WhatsApp!`,
                [{ text: 'Chat WA', onPress: () => { if (slot.contact_wa) { const p = slot.contact_wa.replace(/[^0-9]/g, ''); Linking.openURL('https://wa.me/' + (p.startsWith('0') ? '62' + p.slice(1) : p)); } } }, { text: 'Oke' }]);
              fetchActiveSlots();
            } else { Alert.alert('Gagal', data?.message || 'Slot gagal diambil.'); }
          } catch (err: any) { Alert.alert('Error', err.message); } finally { setClaimingId(null); }
        }
      }]);
  };

  const formatTime = (t: string) => { const d = new Date(t); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} WIB`; };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.badgeSOS}><Ionicons name="flame" size={14} color="#FFF" /><Text style={styles.badgeSOSText}>DARURAT KURANG 1</Text></View>
        <TouchableOpacity style={styles.postButton} onPress={onOpenCreate} activeOpacity={0.8}><Ionicons name="add" size={16} color={Colors.primary} /><Text style={styles.postButtonText}>Pasang SOS</Text></TouchableOpacity>
      </View>
      {loading ? (<View style={styles.loadingBox}><ActivityIndicator color={Colors.primary} size="small" /></View>)
        : slots.length === 0 ? (<View style={styles.emptyCard}><Ionicons name="checkmark-circle-outline" size={24} color={Colors.textMuted} /><Text style={styles.emptyTitle}>Belum ada panggilan darurat hari ini.</Text><Text style={styles.emptySub}>Temanmu batal main? Pasang SOS dan temukan pengganti dalam 10 menit.</Text></View>)
        : (<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollList}>
          {slots.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.sportBadge}><Text style={styles.sportText}>{item.sport}</Text></View>
                <View style={styles.slotCountBadge}><Text style={styles.slotCountText}>Butuh {item.slots_needed} Org</Text></View>
              </View>
              <Text style={styles.venueName} numberOfLines={1}>{item.venue_name}</Text>
              <View style={styles.metaRow}><Ionicons name="time-outline" size={13} color={Colors.primary} /><Text style={styles.metaTime}>{formatTime(item.play_time)}</Text><Text style={styles.dot}>•</Text><Text style={styles.metaFee}>{item.fee_per_person > 0 ? 'Rp ' + item.fee_per_person.toLocaleString('id-ID') : 'Gratis'}</Text></View>
              {item.note ? <Text style={styles.noteText} numberOfLines={1}>"{item.note}"</Text> : null}
              <TouchableOpacity style={styles.claimButton} onPress={() => handleClaim(item)} disabled={claimingId === item.id} activeOpacity={0.85}>
                {claimingId === item.id ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.claimButtonText}>Ambil Slot</Text>}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  badgeSOS: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D63031', paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.xs, gap: 4 },
  badgeSOSText: { fontFamily: Typography.fontHeading, fontSize: 11, color: '#FFF', letterSpacing: 0.5 },
  postButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  postButtonText: { fontFamily: Typography.fontSemiBold, fontSize: 13, color: Colors.primary },
  loadingBox: { height: 120, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center', gap: 4 },
  emptyTitle: { fontFamily: Typography.fontMedium, fontSize: 13, color: Colors.textPrimary },
  emptySub: { fontFamily: Typography.fontRegular, fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  scrollList: { paddingHorizontal: Spacing.base, gap: 12 },
  card: { width: 220, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(214, 48, 49, 0.35)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sportBadge: { backgroundColor: 'rgba(255, 87, 47, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sportText: { fontFamily: Typography.fontSemiBold, fontSize: 11, color: Colors.primary },
  slotCountBadge: { backgroundColor: '#D63031', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  slotCountText: { fontFamily: Typography.fontHeading, fontSize: 10, color: '#FFF' },
  venueName: { fontFamily: Typography.fontHeading, fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  metaTime: { fontFamily: Typography.fontMedium, fontSize: 12, color: Colors.textPrimary },
  dot: { color: Colors.textMuted },
  metaFee: { fontFamily: Typography.fontMedium, fontSize: 12, color: Colors.success },
  noteText: { fontFamily: Typography.fontRegular, fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 10 },
  claimButton: { backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: BorderRadius.sm, alignItems: 'center', marginTop: 4 },
  claimButtonText: { fontFamily: Typography.fontSemiBold, fontSize: 12, color: '#FFF' },
});
