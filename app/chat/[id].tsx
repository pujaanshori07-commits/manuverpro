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
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  type?: string;
  metadata?: any;
  created_at: string;
}

import { AjakMainTrigger, AjakMainModal, SparingTicketBubble } from '../../components/AjakMainWidget';

// Dummy list of positive chemistry snippets to rotate
const CHEMISTRY_MESSAGES = [
  "Kalian berdua suka Badminton & Running 🏸🏃",
  "Partner ini juga suka latihan pagi hari — cocok nih! ☀️",
  "Kalian sama-sama ingin olahraga lebih konsisten 💪",
  "Partner ini juga sering main di Jakarta Selatan 📍",
  "Kalian sama-sama mencari partner yang suportif 🙌"
];

const ChemistrySnippet = ({ partnerName }: { partnerName: string }) => {
  // Select a random message on mount
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
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAjakSheet, setShowAjakSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let subscription: any;
    
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
          
        if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.log('Using mock messages');
      } finally {
        setLoading(false);
      }
    };

    initChat();
    return () => {};
  }, [id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: currentUserId,
      content: newMessage.trim(),
      type: 'text',
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendSparingInvite = async (inviteData: { sport: string; venue: string; dateTime: string }) => {
    if (!currentUserId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Create a temporary message reflecting the invite
    const tempMsg: Message = {
      id: Date.now().toString(),
      sender_id: currentUserId,
      content: 'Ajak Sparing',
      type: 'sparing_invite',
      metadata: {
        invite_id: 'temp-' + Date.now(), // Will be real UUID after db insert
        sport: inviteData.sport,
        venue_name: inviteData.venue,
        scheduled_at: inviteData.dateTime,
        status: 'pending'
      },
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // TODO: Write to sparing_invites table and messages table in Supabase
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    
    if (item.type === 'sparing_invite' && item.metadata) {
      return (
        <View style={[styles.messageBubbleContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
          <SparingTicketBubble
            sport={item.metadata.sport}
            venue={item.metadata.venue_name}
            dateTime={item.metadata.scheduled_at}
            status={item.metadata.status}
            isSender={isMe}
            onAccept={() => console.log('Accept invite')}
            onDecline={() => console.log('Decline invite')}
          />
        </View>
      );
    }

    return (
      <View style={[styles.messageBubbleContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
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
          colors={['rgba(9,10,13,0.95)', 'rgba(9,10,13,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerProfile}>
          <Image source={{ uri: avatar as string }} style={styles.headerAvatar} />
          <Text style={styles.headerName}>{name}</Text>
        </View>
        
        <TouchableOpacity style={styles.optionsBtn}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages.length ? messages : [{ id: '1', sender_id: id as string, content: 'Hai! Udah nemu partner olahraga?', created_at: new Date().toISOString() }]}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListHeaderComponent={<ChemistrySnippet partnerName={name as string} />}
        />
      )}

      <AjakMainTrigger onPress={() => setShowAjakSheet(true)} />
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Ionicons name="add" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Kirim pesan..."
          placeholderTextColor={Colors.textMuted}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        
        <TouchableOpacity 
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <AjakMainModal 
        visible={showAjakSheet} 
        onClose={() => setShowAjakSheet(false)} 
        onSubmit={handleSendSparingInvite}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder, zIndex: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Colors.surfaceBorder },
  headerName: { fontFamily: Typography.fontSemiBold, fontSize: 16, color: Colors.white },
  optionsBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  messageList: { padding: Spacing.base, gap: 12, paddingBottom: 20 },
  chemistryContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 90, 31, 0.08)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginBottom: 16, alignSelf: 'center', borderWidth: 1, borderColor: 'rgba(255, 90, 31, 0.15)' },
  chemistryIconBox: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 90, 31, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  chemistryText: { fontFamily: Typography.fontMedium, fontSize: 13, color: Colors.primary, flexShrink: 1 },
  messageBubbleContainer: { width: '100%', flexDirection: 'row' },
  myMessageContainer: { justifyContent: 'flex-end' },
  theirMessageContainer: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  myMessage: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: Colors.surfaceInput, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.surfaceBorder },
  messageText: { fontFamily: Typography.fontRegular, fontSize: 15, lineHeight: 22 },
  myMessageText: { color: Colors.white },
  theirMessageText: { color: Colors.textPrimary },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.base, paddingTop: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceInput, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  ajakMainBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 90, 31, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 90, 31, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 4, marginLeft: 6 },
  input: { flex: 1, minHeight: 40, maxHeight: 120, backgroundColor: Colors.surfaceInput, borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, marginHorizontal: 10, color: Colors.textPrimary, fontFamily: Typography.fontRegular, fontSize: 15, marginBottom: 4, borderWidth: 1, borderColor: Colors.surfaceBorder },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sendBtnDisabled: { backgroundColor: Colors.surfaceBorder },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
