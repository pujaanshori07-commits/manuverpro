import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface MatchUser {
  id: string;
  name: string;
  avatar: string;
  isNew?: boolean;
}

interface ConversationItem {
  id: string;
  partnerId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
}

const DEMO_NEW_MATCHES: MatchUser[] = [
  {
    id: 'user-1',
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isNew: true,
  },
  {
    id: 'user-2',
    name: 'Dimas',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    isNew: true,
  },
  {
    id: 'user-3',
    name: 'Sari',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    isNew: false,
  },
];

const DEMO_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'chat-1',
    partnerId: 'user-1',
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Ajak main tenis di Senayan Sabtu ini yuk?',
    timestamp: '10:42',
    unreadCount: 1,
  },
  {
    id: 'chat-2',
    partnerId: 'user-2',
    name: 'Dimas',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Oke mantap, jam 7 malam ya!',
    timestamp: 'Kemarin',
  },
  {
    id: 'chat-3',
    partnerId: 'user-3',
    name: 'Sari',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Besok pagi jadi running bareng?',
    timestamp: 'Rab',
  },
];

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [newMatches, setNewMatches] = useState<MatchUser[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatchesAndChats = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;

      if (!currentUserId) {
        setNewMatches(DEMO_NEW_MATCHES);
        setConversations(DEMO_CONVERSATIONS);
        return;
      }

      // Fetch matches from Supabase
      const { data: matchRows, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user_a_id,
          user_b_id,
          user_a:profiles!matches_user_a_id_fkey(id, nama, foto_url),
          user_b:profiles!matches_user_b_id_fkey(id, nama, foto_url)
        `)
        .or(`user_a_id.eq.${currentUserId},user_b_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (matchError || !matchRows || matchRows.length === 0) {
        setNewMatches(DEMO_NEW_MATCHES);
        setConversations(DEMO_CONVERSATIONS);
        return;
      }

      const parsedMatches: MatchUser[] = [];
      const parsedConversations: ConversationItem[] = [];

      for (const m of matchRows) {
        const partner = m.user_a_id === currentUserId ? m.user_b : m.user_a;
        if (!partner) continue;

        parsedMatches.push({
          id: partner.id,
          name: partner.nama || 'Partner',
          avatar: partner.foto_url || DEMO_NEW_MATCHES[0].avatar,
          isNew: true,
        });

        parsedConversations.push({
          id: m.id,
          partnerId: partner.id,
          name: partner.nama || 'Partner',
          avatar: partner.foto_url || DEMO_NEW_MATCHES[0].avatar,
          lastMessage: 'Mulai obrolan sekarang...',
          timestamp: 'Baru saja',
        });
      }

      setNewMatches(parsedMatches.length ? parsedMatches : DEMO_NEW_MATCHES);
      setConversations(parsedConversations.length ? parsedConversations : DEMO_CONVERSATIONS);
    } catch {
      setNewMatches(DEMO_NEW_MATCHES);
      setConversations(DEMO_CONVERSATIONS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchesAndChats();
  }, [fetchMatchesAndChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatchesAndChats();
  };

  const openChat = (id: string, name: string, avatar: string) => {
    router.push({
      pathname: `/chat/[id]`,
      params: { id, name, avatar },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0D" />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches & Chat</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : newMatches.length === 0 && conversations.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Match</Text>
          <Text style={styles.emptySubtitle}>
            Terus swipe di menu Discover untuk menemukan partner olahraga yang sefrekuensi.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 84 }}
        >
          {/* Section: New Matches with 48h Urgent Expiry */}
          {newMatches.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Match Baru</Text>
                <View style={styles.expiryHint}>
                  <Ionicons name="time-outline" size={12} color={Colors.primary} />
                  <Text style={styles.expiryHintText}>Ajak main dlm 48 jam</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.matchesScroll}
              >
                {newMatches.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.newMatchItem}
                    activeOpacity={0.8}
                    onPress={() => openChat(item.id, item.name, item.avatar)}
                  >
                    {/* Urgency Countdown Gradient Ring */}
                    <LinearGradient
                      colors={[Colors.primary, '#FF3B30']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarGradientRing}
                    >
                      <Image source={{ uri: item.avatar }} style={styles.newMatchAvatar} />
                    </LinearGradient>

                    {/* Expiry Pill Badge */}
                    <View style={styles.expiryBadge}>
                      <Text style={styles.expiryBadgeText}>47h</Text>
                    </View>

                    <Text style={styles.newMatchName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Section: Active Conversations */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm }]}>
              Pesan
            </Text>

            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chatRow}
                  activeOpacity={0.7}
                  onPress={() => openChat(item.id, item.name, item.avatar)}
                >
                  <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
                  <View style={styles.chatContent}>
                    <View style={styles.chatTopLine}>
                      <Text style={styles.chatPartnerName}>{item.name}</Text>
                      <Text style={styles.chatTimestamp}>{item.timestamp}</Text>
                    </View>
                    <View style={styles.chatBottomLine}>
                      <Text style={styles.chatLastMessage} numberOfLines={1}>
                        {item.lastMessage}
                      </Text>
                      {item.unreadCount ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </ScrollView>
      )}
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
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.4,
  },
  sectionContainer: {
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  expiryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryHintText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  matchesScroll: {
    paddingHorizontal: Spacing.base,
    gap: 16,
    paddingVertical: 4,
  },
  newMatchItem: {
    alignItems: 'center',
    width: 68,
  },
  avatarGradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newMatchAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  expiryBadge: {
    position: 'absolute',
    bottom: 22,
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  expiryBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  newMatchName: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  chatContent: {
    flex: 1,
  },
  chatTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatPartnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  chatTimestamp: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  chatBottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.xxl,
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
  },
});
