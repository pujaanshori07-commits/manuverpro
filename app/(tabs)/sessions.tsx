import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CreateSessionSheet from '../../components/CreateSessionSheet';
import { supabase } from '../../lib/supabase';

export interface SessionItem {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  sport: string;
  title: string;
  venue_name: string;
  scheduled_at: string;
  slots_total: number;
  slots_filled: number;
  gender_pref: 'any' | 'male' | 'female';
  skill_note?: string | null;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  is_joined: boolean;
}

const SPORT_FILTERS = [
  { id: 'all', label: 'Semua', icon: 'grid-outline' as const },
  { id: 'badminton', label: 'Badminton', icon: 'badminton' as const },
  { id: 'running', label: 'Running', icon: 'walk-outline' as const },
  { id: 'gym', label: 'Gym', icon: 'barbell-outline' as const },
  { id: 'tennis', label: 'Tennis', icon: 'tennisball-outline' as const },
  { id: 'futsal', label: 'Futsal', icon: 'football-outline' as const },
  { id: 'basket', label: 'Basket', icon: 'basketball-outline' as const },
];

const SPORT_ICON_MAP: Record<string, any> = {
  badminton: 'badminton',
  running: 'walk-outline',
  gym: 'barbell-outline',
  tennis: 'tennisball-outline',
  futsal: 'football-outline',
  basket: 'basketball-outline',
  yoga: 'body-outline',
  cycling: 'bicycle-outline',
};

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

export default function SessionsScreen() {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // 1. Fetch current user
  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    getCurrentUser();
  }, []);

  // 2. Fetch sessions from Supabase
  const fetchSessions = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id || currentUserId;

      // Query sessions with creator profile and user's participation status
      const { data, error } = await supabase
        .from('open_sessions')
        .select(
          `
          *,
          profiles:creator_id (
            id,
            name,
            avatar_url
          ),
          session_participants (
            user_id
          )
        `
        )
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching sessions:', error);
        Alert.alert('Gagal Memuat', 'Tidak dapat mengambil sesi olahraga terbaru.');
        return;
      }

      if (data) {
        const mapped: SessionItem[] = data.map((item: any) => {
          const participants: { user_id: string }[] =
            item.session_participants || [];
          const isJoined = uid
            ? participants.some((p) => p.user_id === uid) || item.creator_id === uid
            : false;

          return {
            id: item.id,
            creator_id: item.creator_id,
            creator_name: item.profiles?.name || 'Anggota Manuver',
            creator_avatar: item.profiles?.avatar_url || DEFAULT_AVATAR,
            sport: item.sport,
            title: item.title,
            venue_name: item.venue_name,
            scheduled_at: item.scheduled_at,
            slots_total: item.slots_total,
            slots_filled: item.slots_filled,
            gender_pref: item.gender_pref,
            skill_note: item.skill_note,
            status: item.status,
            is_joined: isJoined,
          };
        });

        setSessions(mapped);
      }
    } catch (err) {
      console.error('Unexpected error fetching sessions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  // 3. Handle Join / Leave Sesi
  const handleToggleJoin = async (session: SessionItem) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Login Diperlukan', 'Silakan masuk untuk bergabung dengan sesi.');
      return;
    }

    if (session.creator_id === user.id) {
      Alert.alert('Host Sesi', 'Kamu adalah host pembuat sesi ini.');
      return;
    }

    if (session.is_joined) {
      // Leave confirmation
      Alert.alert('Batalkan Keikutsertaan', 'Yakin ingin keluar dari sesi ini?', [
        { text: 'Kembali', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            setActionInProgressId(session.id);
            try {
              const { error } = await supabase
                .from('session_participants')
                .delete()
                .eq('session_id', session.id)
                .eq('user_id', user.id);

              if (error) throw error;

              // Refresh list to trigger trigger-updated slot counters
              await fetchSessions();
            } catch (err: any) {
              Alert.alert('Gagal Keluar', err.message || 'Terjadi kesalahan.');
            } finally {
              setActionInProgressId(null);
            }
          },
        },
      ]);
    } else {
      // Check full
      if (session.status === 'full' || session.slots_filled >= session.slots_total) {
        Alert.alert('Sesi Penuh', 'Maaf, semua slot peserta untuk sesi ini sudah terisi.');
        return;
      }

      // Join
      setActionInProgressId(session.id);
      try {
        const { error } = await supabase.from('session_participants').insert({
          session_id: session.id,
          user_id: user.id,
        });

        if (error) throw error;

        await fetchSessions();
        Alert.alert('Berhasil!', `Kamu telah terdaftar di "${session.title}".`);
      } catch (err: any) {
        Alert.alert('Gagal Bergabung', err.message || 'Gagal mendaftar ke sesi ini.');
      } finally {
        setActionInProgressId(null);
      }
    }
  };

  const formatIndonesianDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Ags',
        'Sep',
        'Okt',
        'Nov',
        'Des',
      ];
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${dayName}, ${dayNum} ${monthName} • ${hours}:${minutes} WIB`;
    } catch {
      return isoString;
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (selectedSport === 'all') return true;
    return s.sport.toLowerCase() === selectedSport.toLowerCase();
  });

  const renderCard = ({ item }: { item: SessionItem }) => {
    const isFull = item.slots_filled >= item.slots_total || item.status === 'full';
    const progressPercent = Math.min((item.slots_filled / item.slots_total) * 100, 100);
    const isProcessing = actionInProgressId === item.id;

    const genderLabel =
      item.gender_pref === 'male'
        ? 'Pria Saja'
        : item.gender_pref === 'female'
        ? 'Wanita Saja'
        : 'Semua Gender';

    return (
      <View style={styles.card}>
        {/* Top Badges */}
        <View style={styles.cardTopRow}>
          <View style={styles.sportBadge}>
            <Ionicons
              name={SPORT_ICON_MAP[item.sport] || 'fitness-outline'}
              size={13}
              color="#FF5A1F"
            />
            <Text style={styles.sportBadgeText}>{item.sport.toUpperCase()}</Text>
          </View>

          <View style={styles.genderBadge}>
            <Text style={styles.genderBadgeText}>{genderLabel}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.sessionTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Host Profile */}
        <View style={styles.creatorRow}>
          <Image source={{ uri: item.creator_avatar }} style={styles.creatorAvatar} />
          <Text style={styles.creatorName}>Host: {item.creator_name}</Text>
        </View>

        {/* Venue & Date */}
        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Ionicons name="location-sharp" size={15} color="#FF5A1F" />
            <Text style={styles.venueText} numberOfLines={1}>
              {item.venue_name}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color="#8F94A6" />
            <Text style={styles.timeText}>{formatIndonesianDate(item.scheduled_at)}</Text>
          </View>
        </View>

        {/* Slots & Progress Bar */}
        <View style={styles.slotsContainer}>
          <View style={styles.slotsHeader}>
            <Text style={styles.slotsLabel}>Ketersediaan Slot</Text>
            <View
              style={[
                styles.slotPill,
                isFull ? styles.slotPillFull : styles.slotPillAvailable,
              ]}
            >
              <Text
                style={[
                  styles.slotPillText,
                  isFull ? styles.slotPillTextFull : styles.slotPillTextAvailable,
                ]}
              >
                {item.slots_filled} / {item.slots_total} Slot
              </Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` },
                isFull ? styles.progressFull : styles.progressAvailable,
              ]}
            />
          </View>
        </View>

        {/* Skill Note */}
        {item.skill_note ? (
          <Text style={styles.skillNote} numberOfLines={2}>
            "{item.skill_note}"
          </Text>
        ) : null}

        {/* Join / Leave CTA */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            isFull && !item.is_joined && styles.ctaButtonDisabled,
            item.is_joined && styles.ctaButtonJoined,
          ]}
          onPress={() => handleToggleJoin(item)}
          disabled={(isFull && !item.is_joined) || isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.ctaButtonText,
                isFull && !item.is_joined && styles.ctaButtonTextDisabled,
                item.is_joined && styles.ctaButtonTextJoined,
              ]}
            >
              {item.is_joined
                ? '✓ Terdaftar (Ketuk untuk Batal)'
                : isFull
                ? 'Penuh'
                : 'Gabung Sesi'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0D12" />

      {/* Screen Title */}
      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.screenTitle}>Open Sparing</Text>
          <Text style={styles.screenSubtitle}>Cari partner & main bareng komunitas</Text>
        </View>
      </View>

      {/* Horizontal Filter Bar */}
      <View style={styles.filterBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {SPORT_FILTERS.map((f) => {
            const active = selectedSport === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedSport(f.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={f.icon}
                  size={14}
                  color={active ? '#FF5A1F' : '#8F94A6'}
                />
                <Text
                  style={[styles.filterPillText, active && styles.filterPillTextActive]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading or Feed List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF5A1F" />
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF5A1F"
              colors={['#FF5A1F']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="tennisball-outline" size={48} color="#262933" />
              <Text style={styles.emptyTitle}>Belum Ada Sesi</Text>
              <Text style={styles.emptySubtitle}>
                Belum ada sesi olahraga untuk kategori ini. Buka sesi pertama kamu!
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Session Bottom Sheet Modal */}
      <CreateSessionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCreated={() => fetchSessions()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#8F94A6',
    marginTop: 2,
  },
  filterBarWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1A1D24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    borderColor: '#FF5A1F',
  },
  filterPillText: {
    fontSize: 13,
    color: '#8F94A6',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FF5A1F',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 16,
  },
  card: {
    backgroundColor: '#1A1D24',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.3)',
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5A1F',
    letterSpacing: 0.5,
  },
  genderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  genderBadgeText: {
    fontSize: 11,
    color: '#8F94A6',
    fontWeight: '500',
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 10,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#262933',
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F94A6',
  },
  infoBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  venueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0E3EB',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#8F94A6',
  },
  slotsContainer: {
    marginBottom: 12,
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F94A6',
  },
  slotPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  slotPillAvailable: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  slotPillFull: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotPillTextAvailable: {
    color: '#4ADE80',
  },
  slotPillTextFull: {
    color: '#EF4444',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#262933',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressAvailable: {
    backgroundColor: '#4ADE80',
  },
  progressFull: {
    backgroundColor: '#EF4444',
  },
  skillNote: {
    fontStyle: 'italic',
    fontSize: 12,
    color: '#A5ABB9',
    marginBottom: 14,
    lineHeight: 16,
  },
  ctaButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FF5A1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: '#262933',
  },
  ctaButtonJoined: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaButtonTextDisabled: {
    color: '#555B6E',
  },
  ctaButtonTextJoined: {
    color: '#4ADE80',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF5A1F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8F94A6',
    textAlign: 'center',
    lineHeight: 18,
  },
});
