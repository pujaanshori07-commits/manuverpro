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
import AjakMainSheet from '../../components/AjakMainSheet';
import SparingInviteCard from '../../components/SparingInviteCard';
import { useChat } from '../../hooks/useChat';
import { Message } from '../../types/database';
// Removed inline Message interface

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
  
  const [inputText, setInputText] = useState('');
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  
  const { messages, loading, currentUserId, sendMessage, sendSparingInvite, updateInviteStatus } = useChat(id);
  
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
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
          onAccept={() => updateInviteStatus(item.id, 'accepted')}
          onDecline={() => updateInviteStatus(item.id, 'declined')}
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



      {/* Input Bar */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.actionIconBtn} activeOpacity={0.7}>
          <Ionicons name="camera-outline" size={26} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Send a message"
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          {!inputText.trim() && (
            <TouchableOpacity style={styles.gifBtn} activeOpacity={0.7}>
              <View style={styles.gifBadge}>
                <Text style={styles.gifText}>GIF</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {!inputText.trim() ? (
          <View style={styles.rightActionIcons}>
            <TouchableOpacity 
              style={styles.actionIconBtn} 
              activeOpacity={0.7}
              onPress={() => setIsSheetVisible(true)}
            >
              <Ionicons name="flash" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconBtn} activeOpacity={0.7}>
              <Ionicons name="mic-outline" size={26} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={() => handleSendMessage()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <AjakMainSheet
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        partnerName={name as string}
        onSend={async (inviteData) => {
          setIsSheetVisible(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await sendSparingInvite(inviteData);
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

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  actionIconBtn: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceInput,
    borderRadius: 24, // Very rounded corner radius like Bumble
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    color: Colors.white,
    maxHeight: 100,
    fontSize: 15,
  },
  gifBtn: {
    paddingRight: 12,
    paddingLeft: 4,
    justifyContent: 'center',
  },
  gifBadge: {
    borderWidth: 1.5,
    borderColor: Colors.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  gifText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
