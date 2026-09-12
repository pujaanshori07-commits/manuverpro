import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/DesignSystem';
import Skeleton from '../../components/Skeleton';
import RadarAnimation from '../../components/RadarAnimation';

type MatchPartner = {
  match_id: string;
  partner_id: string;
  nama: string;
  foto_url: string | null;
  sports: string[];
  last_message?: string;
};

export default function MatchesScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

import { DUMMY_PROFILES } from '../../constants/MockData';

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setTimeout(() => {
        const mockMatches: MatchPartner[] = DUMMY_PROFILES.slice(0, 3).map((p, index) => ({
          match_id: `match-${p.id}`,
          partner_id: p.id,
          nama: p.nama,
          foto_url: p.foto_url,
          sports: p.hobi ? p.hobi.split(', ') : [],
          last_message: index === 0 ? 'Hai, salken ya!' : index === 1 ? 'Kapan kita jogging bareng?' : undefined
        }));
        setMatches(mockMatches);
        setLoading(false);
      }, 400);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      setMatches([]);
      setLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches])
  );

  const renderItem = ({ item }: { item: MatchPartner }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/chat/${item.match_id}` as any)}
    >
      <View style={styles.avatarContainer}>
        {item.foto_url ? (
          <Image source={{ uri: item.foto_url }} style={styles.avatar} />
        ) : (
          <Ionicons name="person" size={24} color={COLORS.secondaryText} />
        )}
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.nama}</Text>
          {item.sports.length > 0 && <Text style={styles.sportBadge}>{item.sports[0]}</Text>}
        </View>
        <Text style={styles.messagePreview} numberOfLines={1}>
          {item.last_message ? item.last_message : 'Start planning a game!'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.secondaryText} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MATCHES</Text>
        </View>
        <View style={{ padding: 16, gap: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 12, borderRadius: SIZES.borderRadius }}>
              <Skeleton width={52} height={52} borderRadius={26} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Skeleton width="50%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="80%" height={14} borderRadius={4} />
              </View>
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
        <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.surface, borderRadius: 8 }} onPress={fetchMatches}>
          <Text style={{ color: COLORS.text }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MATCHES</Text>
        <Ionicons name="flash" size={26} color={COLORS.primary} />
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flash-off" size={64} color={COLORS.border} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No play partners yet</Text>
          <Text style={styles.emptySubtitle}>Keep swiping in Discover to find someone to play with!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.elevatedSurface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sportBadge: {
    backgroundColor: 'rgba(255, 87, 47, 0.1)',
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  messagePreview: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: '500',
  },
});
