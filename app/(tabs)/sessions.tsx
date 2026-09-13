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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CreateSessionSheet from '../../components/CreateSessionSheet';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
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

// Valid Ionicons mapping for sport badges & filters
const SPORT_FILTERS = [
  { id: 'all', label: 'Semua', icon: 'grid-outline' as const },
  { id: 'badminton', label: 'Badminton', icon: 'tennisball-outline' as const },
  { id: 'running', label: 'Running', icon: 'walk-outline' as const },
  { id: 'gym', label: 'Gym', icon: 'barbell-outline' as const },
  { id: 'tennis', label: 'Tennis', icon: 'tennisball-outline' as const },
  { id: 'futsal', label: 'Futsal', icon: 'football-outline' as const },
  { id: 'basket', label: 'Basket', icon: 'basketball-outline' as const },
];

const SPORT_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  badminton: 'tennisball-outline',
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
  const insets = useSafeAreaInsets();
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data?.user?.id ?? null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? currentUserId;

      const { data, error } = await supabase
        .from('open_sessions')
        .select(`
          id,
          creator_id,
          sport,
          title,
          venue_name,
          scheduled_at,
          slots_total,
          slots_filled,
          gender_pref,
          skill_note,
          status,
          profiles:creator_id (
            nama,
            foto_url
          ),
          session_participants (
            user_id
          )
        `)
        .order('scheduled_at', { ascending: true });

      if (error || !data) {
        setSessions([]);
        return;
      }

      const formatted: SessionItem[] = data.map((item: any) => {
        const creatorProfile = Array.isArray(item.profiles)
          ? item.profiles[0]
          : item.profiles;
        const participants: any[] = item.session_participants || [];
        const isJoined = userId
          ? participants.some((p: any) => p.user_id === userId)
          : false;

        return {
          id: item.id,
          creator_id: item.creator_id,
          creator_name: creatorProfile?.nama || 'Member Manuver',
          creator_avatar: creatorProfile?.foto_url || DEFAULT_AVATAR,
          sport: item.sport,
          title: item.title,
          venue_name: item.venue_name,
          scheduled_at: item.scheduled_at,
          slots_total: item.slots_total,
          slots_filled: item.slots_filled || 0,
          gender_pref: item.gender_pref || 'any',
          skill_note: item.skill_note,
          status: item.status || 'open',
          is_joined: isJoined,
        };
      });

      setSessions(formatted);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchCurrentUser();
    fetchSessions();
  }, [fetchCurrentUser, fetchSessions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const handleJoinLeave = async (session: SessionItem) => {
    if (!currentUserId) {
      Alert.alert('Masuk Akun', 'Silakan masuk untuk bergabung dengan sesi.');
      return;
    }

    try {
      setActionInProgressId(session.id);
      if (session.is_joined) {
        const { error } = await supabase
          .from('session_participants')
          .delete()
          .match({ session_id: session.id, user_id: currentUserId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('session_participants')
          .insert({ session_id: session.id, user_id: currentUserId });

        if (error) throw error;
      }

      fetchSessions();
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Terjadi kendala saat memperbarui sesi.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const formatIndonesianDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
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

    const sportIcon = SPORT_ICON_MAP[item.sport.toLowerCase()] || 'fitness-outline';

    return (
      <View style={styles.card}>
        {/* Top Badges */}
        <View style={styles.cardTopRow}>
          <View style={styles.sportBadge}>
            <Ionicons name={sportIcon} size={13} color={Colors.primary} />
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
            <Ionicons name="location-sharp" size={14} color={Colors.primary} />
            <Text style={styles.venueText} numberOfLines={1}>
              {item.venue_name}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.timeText}>{formatIndonesianDate(item.scheduled_at)}</Text>
          </View>
        </View>

        {/* Slots & Progress Bar */}
        <View style={styles.slotsContainer}>
          <View style={styles.slotsHeader}>
            <Text style={styles.slotsLabel}>Ketersediaan Slot</Text>
            <View style={[styles.slotPill, isFull ? styles.slotPillFull : styles.slotPillAvailable]}>
              <Text style={[styles.slotPillText, isFull ? styles.slotPillTextFull : styles.slotPillTextAvailable]}>
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
          <Text style={styles.skillNoteText} numberOfLines={1}>
            Catatan: {item.skill_note}
          </Text>
        ) : null}

        {/* Join / Leave CTA */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            item.is_joined
              ? styles.ctaJoined
              : isFull
              ? styles.ctaDisabled
              : styles.ctaPrimary,
          ]}
          onPress={() => handleJoinLeave(item)}
          disabled={(!item.is_joined && isFull) || isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text
              style={[
                styles.ctaText,
                item.is_joined ? styles.ctaTextJoined : styles.ctaTextPrimary,
              ]}
            >
              {item.is_joined ? 'Batal Ikut' : isFull ? 'Sesi Penuh' : 'Gabung Sesi'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0D" />

      {/* Screen Header */}
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
                  color={active ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
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
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 84 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="tennisball-outline" size={40} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Sesi</Text>
              <Text style={styles.emptySubtitle}>
                Belum ada sesi olahraga untuk kategori ini. Jadilah yang pertama membuat sesi sparing!
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setSheetVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.emptyActionBtnText}>Buat Sesi Pertama</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.85}
        accessibilityLabel="Tambah Sesi Baru"
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Create Session Bottom Sheet Modal */}
      <CreateSessionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCreated={() => fetchSessions()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenHeader: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterBarWrapper: {
    paddingVertical: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.base,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  filterPillActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  sportBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  genderBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  genderBadgeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
  },
  creatorName: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoBlock: {
    gap: 6,
    marginBottom: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: BorderRadius.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  venueText: {
    fontSize: 12,
    color: Colors.white,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  slotsContainer: {
    marginBottom: 10,
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotsLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  slotPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  slotPillAvailable: {
    backgroundColor: Colors.successMuted,
  },
  slotPillFull: {
    backgroundColor: Colors.dangerMuted,
  },
  slotPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotPillTextAvailable: {
    color: Colors.success,
  },
  slotPillTextFull: {
    color: Colors.danger,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressAvailable: {
    backgroundColor: Colors.success,
  },
  progressFull: {
    backgroundColor: Colors.danger,
  },
  skillNoteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  ctaButton: {
    height: 42,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaPrimary: {
    backgroundColor: Colors.primary,
  },
  ctaJoined: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  ctaDisabled: {
    backgroundColor: '#20232B',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ctaTextPrimary: {
    color: Colors.white,
  },
  ctaTextJoined: {
    color: Colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.round,
  },
  emptyActionBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
});
