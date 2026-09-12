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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import MatchExpiryAvatar from '../../components/MatchExpiryAvatar';

interface MatchUser {
  id: string;
  name: string;
  avatar: string;
  isNew?: boolean;
  hoursRemaining?: number;
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

// Fallback high-quality mock data matching the reference image
const DEMO_NEW_MATCHES: MatchUser[] = [
  {
    id: 'user-1',
    name: 'Rina',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isNew: true,
  },
  {
    id: 'user-2',
    name: 'Dinda',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    isNew: true,
  },
  {
    id: 'user-3',
    name: 'Sari',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    isNew: false,
  },
  {
    id: 'user-4',
    name: 'Maya',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    isNew: true,
  },
];

const DEMO_CONVERSATIONS: ConversationItem[] = [
  {
    id: 'chat-1',
    partnerId: 'user-1',
    name: 'Rina',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Yuk! Aku free sabtu. Kamu?',
    timestamp: '19:48',
    unreadCount: 1,
  },
  {
    id: 'chat-2',
    partnerId: 'user-2',
    name: 'Dinda',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Keren! Aku juga sering di GBK.',
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

        const matchDate = new Date(m.created_at);
        const diffHours = Math.floor((Date.now() - matchDate.getTime()) / (1000 * 60 * 60));
        const hoursRemaining = Math.max(0, 48 - diffHours);

        parsedMatches.push({
          id: partner.id,
          name: partner.nama || 'Partner',
          avatar: partner.foto_url || DEMO_NEW_MATCHES[0].avatar,
          isNew: true,
          hoursRemaining,
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : newMatches.length === 0 && conversations.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={48} color={Colors.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>Belum ada match</Text>
          <Text style={styles.emptySubtitle}>
            Terus swipe di Discover untuk menemukan partner olahraga sefrekuensi!
          </Text>
          <TouchableOpacity
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)/')}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreBtnText}>Mulai Swipe</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Section: New Matches Horizontal Row */}
          {newMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                New Matches <Text style={styles.badgeCount}>({newMatches.length})</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newMatchesList}
              >
                {newMatches.map((item) => (
                  <MatchExpiryAvatar
                    key={item.id}
                    avatarUrl={item.avatar}
                    name={item.name}
                    hoursRemaining={item.hoursRemaining || 47}
                    onPress={() => openChat(item.id, item.name, item.avatar)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Section: Messages List */}
          <View style={styles.messagesSection}>
            <Text style={styles.sectionTitle}>Messages</Text>
            {conversations.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.conversationItem}
                  onPress={() => openChat(item.id, item.name, item.avatar)}
                  activeOpacity={0.7}
                >
                  <View style={styles.conversationAvatarWrap}>
                    <Image source={{ uri: item.avatar }} style={styles.conversationAvatar} />
                    <View style={styles.onlineBadge} />
                  </View>

                  <View style={styles.conversationDetails}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.timestamp}>{item.timestamp}</Text>
                    </View>
                    <View style={styles.messagePreviewRow}>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage}
                      </Text>
                      {item.unreadCount ? (
                        <View style={styles.unreadCounter}>
                          <Text style={styles.unreadCounterText}>{item.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>

                {index < conversations.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
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
  header: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.base,
  },
  headerTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  section: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  badgeCount: {
    color: Colors.primary,
    fontFamily: Typography.fontHeading,
  },
  newMatchesList: {
    paddingHorizontal: Spacing.base,
    gap: 16,
  },
  avatarCard: {
    alignItems: 'center',
    width: 68,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 2,
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  newMatchAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  newMatchName: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
  },
  messagesSection: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
  },
  conversationAvatarWrap: {
    position: 'relative',
  },
  conversationAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surface,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  conversationDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  timestamp: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  unreadCounter: {
    backgroundColor: Colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCounterText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 10,
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E2128',
    marginLeft: 84,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.round,
  },
  exploreBtnText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.white,
  },
});
