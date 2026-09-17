import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import AjakMainSheet from '../../components/AjakMainSheet';
import SparingInviteCard from '../../components/SparingInviteCard';
import { sendPushNotification } from '../../lib/sendPushNotification';
interface Message {
  id: string;
  sender_id: string;
  content: string;
  type?: string;
  metadata?: any;
  created_at: string;
}

const CHEMISTRY_MESSAGES = [
  "Kalian berdua suka Badminton & Running 🏸🏃",
  "Partner ini juga suka latihan pagi hari — cocok nih! ☀️",
  "Kalian sama-sama ingin olahraga lebih konsisten 💪",
  "Partner ini juga sering main di Jakarta Selatan 📍",
  "Kalian sama-sama mencari partner yang suportif 🙌",
];

const ChemistrySnippet = ({ partnerName }: { partnerName: string }) => {
  const [msg] = useState(() => CHEMISTRY_MESSAGES[Math.floor(Math.random() * CHEMISTRY_MESSAGES.length)]);
  
  return (
    <View style={styles.chemistryContainer}>
      <View style={styles.chemistryIconBox}>
        <Ionicons name="sparkles" size={16} color={Colors.primary} />
      </View>
      <Text style={styles.chemistryText}>
        {msg.replace('Partner ini', partnerName || 'Dia')}
      </Text>
    </View>
  );
};

export default function ChatScreen() {
  const { id, name, avatar } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      } else {
        setMessages([
          {
            id: 'm-1',
            sender_id: 'partner',
            content: `Halo! Siap buat sparing bareng?`,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !id || !currentUserId) return;

    if (!textToSend) setInputText('');

    const newMsg: Message = {
      id: Math.random().toString(),
      sender_id: currentUserId,
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      await supabase.from('messages').insert({
        match_id: id,
        sender_id: currentUserId,
        content: text.trim(),
      });

      // Fetch recipient push token
      const { data: match } = await supabase
        .from('matches')
        .select('user_a_id, user_b_id')
        .eq('id', id)
        .single();
        
      if (match) {
        const recipientId = match.user_a_id === currentUserId ? match.user_b_id : match.user_a_id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('push_token, nama')
          .eq('id', recipientId)
          .single();

        if (profile?.push_token) {
          // Get sender's name to display in the notification
          const { data: myProfile } = await supabase
            .from('profiles')
            .select('nama')
            .eq('id', currentUserId)
            .single();
            
          const senderName = myProfile?.nama || 'Teman Sparing';
          await sendPushNotification(
            profile.push_token,
            `Pesan dari ${senderName}`,
            text.trim()
          );
        }
      }
    } catch {
      // offline handling
    }
  };

  const handleUpdateInviteStatus = async (messageId: string, newStatus: string) => {
    // Optimistic UI update
    setMessages((prev) => 
      prev.map((msg) => {
        if (msg.id === messageId && msg.metadata) {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              status: newStatus
            }
          };
        }
        return msg;
      })
    );

    // Database update
    try {
      const msgToUpdate = messages.find((m) => m.id === messageId);
      if (msgToUpdate) {
        await supabase
          .from('messages')
          .update({
            metadata: {
              ...msgToUpdate.metadata,
              status: newStatus
            }
          })
          .eq('id', messageId);
      }
    } catch (error) {
      console.error("Failed to update invite status", error);
    }
  };

  // Navigate to full profile when tapping avatar or name
  const handleOpenProfile = () => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/user/[id]',
      params: { id: id as string, name: name as string, avatar: avatar as string },
    });
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;

    if (item.type === 'sparing_invite') {
      return (
        <SparingInviteCard
          inviteId={item.id}
          sport={item.metadata?.sport || 'Olahraga'}
          venueName={item.metadata?.venue_name || 'Lokasi'}
          scheduledAt={item.metadata?.scheduled_at || new Date().toISOString()}
          status={item.metadata?.status || 'pending'}
          isReceiver={!isMe}
          onAccept={() => handleUpdateInviteStatus(item.id, 'accepted')}
          onDecline={() => handleUpdateInviteStatus(item.id, 'declined')}
          note={item.metadata?.note}
        />
      );
    }

    return (
      <View style={[styles.bubbleContainer, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.messageText, isMe ? styles.textMe : styles.textThem]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['rgba(9,10,13,0.98)', 'rgba(9,10,13,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={Colors.white} />
        </TouchableOpacity>
        
        {/* Clickable Header Profile -> Opens Sarah's Full Profile */}
        <TouchableOpacity
          style={styles.headerProfile}
          onPress={handleOpenProfile}
          activeOpacity={0.7}
          accessibilityLabel={`Buka profil ${name}`}
        >
          <Image source={{ uri: avatar as string }} style={styles.headerAvatar} />
          <View>
            <View style={styles.headerNameRow}>
              <Text style={styles.headerName}>{name}</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
            </View>
            <Text style={styles.headerStatus}>Lihat profil lengkap</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.optionsBtn} onPress={handleOpenProfile}>
          <Ionicons name="person-circle-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={<ChemistrySnippet partnerName={name as string} />}
        />
      )}

      {/* Sparing Floating Action Widget */}
      <View style={styles.ajakContainer}>
        <TouchableOpacity 
          style={styles.ajakButton} 
          activeOpacity={0.8}
          onPress={() => setIsSheetVisible(true)}
        >
          <LinearGradient
            colors={[Colors.primary, '#E04720']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ajakGradient}
          >
            <Ionicons name="flash" size={16} color={Colors.white} />
            <Text style={styles.ajakText}>Ajak Sparing</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Input Bar */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Ketik pesan..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <AjakMainSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        partnerName={name as string}
        onSend={async (inviteData) => {
          setIsSheetVisible(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          if (!id || !currentUserId) return;
          
          const newMsg: Message = {
            id: Math.random().toString(),
            sender_id: currentUserId,
            content: `Mengajak sparing ${inviteData.sport} di ${inviteData.venue_name}`,
            type: 'sparing_invite',
            metadata: {
              ...inviteData,
              status: 'pending'
            },
            created_at: new Date().toISOString(),
          };
          
          setMessages((prev) => [...prev, newMsg]);

          try {
            await supabase.from('messages').insert({
              match_id: id,
              sender_id: currentUserId,
              content: newMsg.content,
              type: 'sparing_invite',
              metadata: newMsg.metadata
            });

            // Send push notification for the invite
            const { data: match } = await supabase
              .from('matches')
              .select('user_a_id, user_b_id')
              .eq('id', id)
              .single();
              
            if (match) {
              const recipientId = match.user_a_id === currentUserId ? match.user_b_id : match.user_a_id;
              const { data: profile } = await supabase
                .from('profiles')
                .select('push_token')
                .eq('id', recipientId)
                .single();

              if (profile?.push_token) {
                const { data: myProfile } = await supabase
                  .from('profiles')
                  .select('nama')
                  .eq('id', currentUserId)
                  .single();
                  
                const senderName = myProfile?.nama || 'Teman Sparing';
                await sendPushNotification(
                  profile.push_token,
                  `🔥 ${senderName} Mengajak Sparing!`,
                  `Sparing ${inviteData.sport} di ${inviteData.venue_name}. Buka aplikasi untuk menerima.`
                );
              }
            }
          } catch (e) {
            console.error("Failed to send invite", e);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: 10,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  headerStatus: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  optionsBtn: { width: 36, height: 36, alignItems: 'flex-end', justifyContent: 'center' },
  listContent: { padding: Spacing.base, paddingBottom: 80 },
  chemistryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  chemistryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  chemistryText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  bubbleContainer: { marginBottom: 12, width: '100%' },
  bubbleRight: { alignItems: 'flex-end' },
  bubbleLeft: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  bubbleThem: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  textMe: { color: Colors.white },
  textThem: { color: Colors.white },
  ajakContainer: {
    position: 'absolute',
    bottom: 74,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ajakButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  ajakGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  ajakText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceInput,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.base,
    paddingVertical: 9,
    color: Colors.white,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.elevatedSurface,
    opacity: 0.5,
  },
});
