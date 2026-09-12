import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/DesignSystem';
import Skeleton from '../../components/Skeleton';
import RadarAnimation from '../../components/RadarAnimation';

type AgendaItem = {
  id: string;
  match_id: string;
  lokasi_nama: string;
  waktu_kumpul: string;
  status: 'pending' | 'accepted';
  sender_id: string;
  partner_id: string;
  partner_nama: string;
  partner_foto: string | null;
};

export default function AgendaScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

import { DUMMY_PROFILES } from '../../constants/MockData';

  const fetchAgenda = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setTimeout(() => {
        const dummyAgenda: AgendaItem[] = [
          {
            id: '1',
            match_id: `match-${DUMMY_PROFILES[0].id}`,
            lokasi_nama: 'GBK Senayan',
            waktu_kumpul: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            status: 'accepted',
            sender_id: 'me',
            partner_id: DUMMY_PROFILES[0].id,
            partner_nama: DUMMY_PROFILES[0].nama,
            partner_foto: DUMMY_PROFILES[0].foto_url
          },
          {
            id: '2',
            match_id: `match-${DUMMY_PROFILES[1].id}`,
            lokasi_nama: 'GOR Soemantri',
            waktu_kumpul: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            status: 'pending',
            sender_id: DUMMY_PROFILES[1].id,
            partner_id: DUMMY_PROFILES[1].id,
            partner_nama: DUMMY_PROFILES[1].nama,
            partner_foto: DUMMY_PROFILES[1].foto_url
          }
        ];
        setAgenda(dummyAgenda);
        setLoading(false);
        setRefreshing(false);
      }, 500);
    } catch (error: any) {
      console.error('Error fetching agenda:', error);
      setErrorMsg(error.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAgenda();
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgenda();
  };

  const renderItem = ({ item }: { item: AgendaItem }) => {
    const isPending = item.status === 'pending';
    const dateObj = new Date(item.waktu_kumpul);
    
    // Check if the meetup is in the past
    const isPast = dateObj.getTime() < new Date().getTime();

    return (
      <TouchableOpacity 
        style={[styles.card, isPast && { opacity: 0.6 }]}
        onPress={() => router.push(`/chat/${item.match_id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.partnerInfo}>
            {item.partner_foto ? (
              <Image source={{ uri: item.partner_foto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={16} color={COLORS.secondaryText} />
              </View>
            )}
            <Text style={styles.partnerName} numberOfLines={1}>vs {item.partner_nama}</Text>
          </View>
          
          <View style={[styles.badge, isPending ? styles.badgePending : styles.badgeAccepted]}>
            <Text style={[styles.badgeText, isPending ? styles.badgeTextPending : styles.badgeTextAccepted]}>
              {isPending ? 'Pending' : 'Confirmed'}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <Text style={styles.infoText} numberOfLines={1}>{item.lokasi_nama}</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              {dateObj.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AGENDA</Text>
          <Ionicons name="calendar" size={26} color={COLORS.primary} />
        </View>
        <View style={{ padding: 16, gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ backgroundColor: COLORS.surface, padding: 16, borderRadius: SIZES.borderRadius, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                <Skeleton width="45%" height={18} borderRadius={4} />
              </View>
              <Skeleton width="70%" height={16} borderRadius={4} />
              <Skeleton width="50%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
        <Text style={{ color: COLORS.text, textAlign: 'center', paddingHorizontal: 20 }}>{errorMsg}</Text>
        <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.surface, borderRadius: 8 }} onPress={fetchAgenda}>
          <Text style={{ color: COLORS.text }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AGENDA</Text>
        <Ionicons name="calendar" size={26} color={COLORS.primary} />
      </View>

      {agenda.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.border} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No scheduled games</Text>
          <Text style={styles.emptySubtitle}>Go to Matches and invite someone to play to see your agenda here.</Text>
        </View>
      ) : (
        <FlatList
          data={agenda}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: SIZES.padding,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.elevatedSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  partnerName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  badgeAccepted: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  badgeTextPending: {
    color: '#FFA500',
  },
  badgeTextAccepted: {
    color: COLORS.success,
  },
  cardBody: {
    paddingLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    color: COLORS.secondaryText,
    fontSize: 15,
    flex: 1,
  }
});
