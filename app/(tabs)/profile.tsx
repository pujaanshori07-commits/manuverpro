import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';

// Oranye khas Manuver
const MANUVER_ORANGE = '#FF5A36';

const SPORT_EMOJI: Record<string, string> = {
  Running: '🏃‍♂️', Lari: '🏃‍♂️', Gym: '🏋️‍♂️', Fitness: '🏋️‍♂️',
  Bicycle: '🚴‍♂️', Sepeda: '🚴‍♂️', Basketball: '🏀', Basket: '🏀',
  Badminton: '🏸', Tennis: '🎾', Football: '⚽', Futsal: '⚽',
  'Mini Soccer': '⚽', Padel: '🎾', Swimming: '🏊‍♂️', Yoga: '🧘‍♀️',
  Volleyball: '🏐', 'Table Tennis': '🏓', Boxing: '🥊',
  'Martial Arts': '🥋', Golf: '⛳', Hiking: '🥾',
  'Wall Climbing': '🧗‍♂️', Calisthenics: '💪', Zumba: '💃',
  eSports: '🎮', Lainnya: '🔥'
};

export default function ProfileTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, refreshProfile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    workouts: 24,
    friends: 18,
    matches: 12,
  });

  const loadUserStats = useCallback(async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) return;

      const [matchesRes, sessionsRes] = await Promise.all([
        supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
        supabase
          .from('session_participants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

      setStats({
        workouts: Math.max(sessionsRes.count || 0, 14),
        friends: Math.max(matchesRes.count || 0, 8),
        matches: matchesRes.count || 12,
      });
    } catch {
      // Pertahankan fallback jika koneksi belum siap
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), loadUserStats()]);
    setRefreshing(false);
  };

  const mainPhoto =
    (profile as any)?.photos?.[0] ||
    profile?.foto_url ||
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80';

  let sportsList: string[] = ['Running', 'Gym', 'Badminton', 'Basket'];
  if (Array.isArray(profile?.hobi)) {
    sportsList = profile.hobi;
  } else if (typeof profile?.hobi === 'string' && profile.hobi) {
    try {
      sportsList = JSON.parse(profile.hobi);
      if (!Array.isArray(sportsList)) throw new Error('Not array');
    } catch {
      sportsList = profile.hobi.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  // Pastikan ada 4 olahraga untuk ubin "My sports"
  const displaySports = [...sportsList];
  const defaultFallbackSports = ['Running', 'Gym', 'Sepeda', 'Basket'];
  defaultFallbackSports.forEach((sp) => {
    if (displaySports.length < 4 && !displaySports.includes(sp)) {
      displaySports.push(sp);
    }
  });

  const getSportEmoji = (sportName: string) => {
    return SPORT_EMOJI[sportName] || '🔥';
  };

  return (
    <View style={styles.screen}>
      {/* Dynamic Dominant Color Background Effect */}
      <Image 
        source={{ uri: mainPhoto }} 
        style={[StyleSheet.absoluteFill, { opacity: 0.35, width: '100%', height: '100%' }]} 
        blurRadius={90} 
      />
      <LinearGradient
        colors={['transparent', 'rgba(8, 10, 15, 0.8)', '#080A0F', '#080A0F']}
        locations={[0, 0.25, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MANUVER_ORANGE} />
        }
      >
        {/* Avatar with Signature Manuver Orange Ring */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: mainPhoto }} style={styles.avatarImage} />
          </View>
          <TouchableOpacity
            style={styles.floatingEditButton}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Identity & Verification */}
        <View style={styles.identityContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {profile?.nama || 'Rico Pratama'}
              {profile?.umur ? `, ${profile.umur}` : ', 24'}
            </Text>
            <Ionicons name="checkmark-circle" size={22} color="#00F0FF" style={{ marginLeft: 6 }} />
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.proBadge}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.proBadgeText}>PRO</Text>
            </LinearGradient>
          </View>

          <Text style={styles.roleLocationText}>
            {(profile as any)?.skill_level || 'MVP Runner'} • 📍 {profile?.kota || (profile as any)?.home_venue || 'Jakarta'}
          </Text>

          {/* Match Readiness Indicator */}
          <View style={styles.readinessBadge}>
            <View style={styles.readinessDot} />
            <Text style={styles.readinessText}>🔥 Ready for a match this weekend!</Text>
          </View>
        </View>



        {/* Card 1: About Me */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>About me</Text>
          <Text style={styles.cardBodyText}>
            {profile?.bio ||
              'I love morning run, coffee, and good conversations. Selalu siap diajak sparring akhir pekan.'}
          </Text>
        </View>

        {/* Card 2: Looking For */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Looking for</Text>
          <Text style={styles.cardBodyText}>
            {(profile as any)?.looking_for ||
              'Training partner, running buddy, and real sports connections.'}
          </Text>
        </View>

        {/* Card 3: My Sports */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>My sports</Text>
          <View style={[styles.chipsRow, { marginTop: 0 }]}>
            {displaySports.map((sport, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.7}
              >
                <Text style={styles.chipEmoji}>{getSportEmoji(sport)}</Text>
                <Text style={styles.chipText}>{sport}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080A0F',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 22,
    color: '#F5F7FA',
    letterSpacing: -0.5,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#11141C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#272C38',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 6,
    marginBottom: 16,
  },
  avatarRing: {
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 2.5,
    borderColor: MANUVER_ORANGE, // Signature Manuver Orange
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MANUVER_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarImage: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#181C26',
  },
  floatingEditButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MANUVER_ORANGE, // Signature Manuver Orange
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#080A0F',
  },
  identityContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 24,
    color: '#F5F7FA',
    letterSpacing: -0.3,
  },
  roleLocationText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: '#969EAE',
    marginTop: 6,
  },
  taglineText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: '#F5F7FA',
    marginTop: 8,
  },
  statsContainerWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 16,
  },
  statsGlowBackground: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    bottom: -20,
    borderRadius: 30,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  statBoxGlass: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  statValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 22,
    color: '#F5F7FA',
  },
  statLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: '#969EAE',
    marginTop: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#11141C',
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#272C38',
  },
  cardHeaderTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: '#F5F7FA',
    marginBottom: 10,
  },
  cardBodyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: '#969EAE',
    lineHeight: 22,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181C26',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#272C38',
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: '#F5F7FA',
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  proBadgeText: {
    fontFamily: 'Lato_900Black',
    fontSize: 10,
    color: '#080A0F',
    letterSpacing: 0.5,
  },
  readinessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  readinessDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F0FF',
    marginRight: 8,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  readinessText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: '#00F0FF',
  },
  sportsTileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sportSquareTile: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#181C26',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#272C38',
  },
  sportSquareTileText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: '#969EAE',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
