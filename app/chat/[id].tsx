import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Image, Alert, Modal, ScrollView, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { RealtimeChannel } from '@supabase/supabase-js';
import { COLORS, SIZES } from '../../constants/DesignSystem';

type Message = { id: string; match_id: string; sender_id: string; content: string; created_at: string; };
type PartnerProfile = { 
  id: string; nama: string; foto_url: string | null; push_token: string | null;
  tanggal_lahir: string | null; alamat: string | null; bio: string | null; 
  hobi: string | null; pendidikan: string | null; pekerjaan: string | null;
  skill_level: string | null; availability: string | null; looking_for: string | null;
};

const QUICK_PROMPTS = [
  "Play this week?",
  "Where do you usually play?",
  "What time works for you?",
  "Want to play this weekend?",
  "Beginner or intermediate?"
];

function calculateAge(birthDateString: string | null) {
  if (!birthDateString) return null;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams(); 
  const { session, profile: myProfile } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [activeMeetup, setActiveMeetup] = useState<any>(null);

  const [showMeetupModal, setShowMeetupModal] = useState(false);
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupTime, setMeetupTime] = useState(new Date());

  const flatListRef = useRef<FlatList>(null);

  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null);
  const [partnerPresence, setPartnerPresence] = useState({ online: false, typing: false });
  const typingTimeoutRef = useRef<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!session || !id) return;
    
    const fetchChatData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data: matchData, error: matchError } = await supabase.from('matches').select('user_a_id, user_b_id').eq('id', id).single();
        if (matchError) throw matchError;
        if (!matchData) throw new Error("Match tidak ditemukan");
        
        const partnerId = matchData.user_a_id === session.user.id ? matchData.user_b_id : matchData.user_a_id;
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, nama, foto_url, push_token, tanggal_lahir, alamat, bio, hobi, pendidikan, pekerjaan, skill_level, availability, looking_for')
          .eq('id', partnerId)
          .single();
          
        if (profileError) throw profileError;
        if (profileData && isMounted.current) setPartner(profileData as PartnerProfile);

        const { data: msgsData, error: msgsError } = await supabase.from('messages').select('*').eq('match_id', id).order('created_at', { ascending: true });
        if (msgsError) throw msgsError;
        if (msgsData && isMounted.current) setMessages(msgsData);

        const { data: meetupData, error: meetupError } = await supabase
          .from('meetups')
          .select('*')
          .eq('match_id', id)
          .in('status', ['pending', 'accepted'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (meetupError) throw meetupError;
        if (meetupData && isMounted.current) setActiveMeetup(meetupData);
      } catch (err: any) {
        console.error(err);
        if (isMounted.current) setErrorMsg(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };
    fetchChatData();

    const messageChannel = supabase.channel(`chat_${id}`).on(
      'postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${id}` },
      (payload) => {
        if (!isMounted.current) return;
        const newMessage = payload.new as Message;
        setMessages((prev) => prev.find((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]);
      }
    ).subscribe();

    const pChannel = supabase.channel(`presence:room_${id}`, {
      config: { presence: { key: session.user.id } },
    });

    pChannel
      .on('presence', { event: 'sync' }, () => {
        const state = pChannel.presenceState();
        let online = false;
        let typing = false;

        Object.keys(state).forEach((key) => {
          if (key !== session.user.id) {
            online = true;
            const presences = state[key] as any[];
            if (presences && presences[0]?.typing) typing = true;
          }
        });
        if (isMounted.current) setPartnerPresence({ online, typing });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (isMounted.current) await pChannel.track({ typing: false });
        }
      });

    setPresenceChannel(pChannel);

    const meetupChannel = supabase.channel(`meetup_${id}`).on(
      'postgres_changes', { event: '*', schema: 'public', table: 'meetups', filter: `match_id=eq.${id}` },
      (payload) => {
        if (!isMounted.current) return;
        const newMeetup = payload.new as any;
        if (['pending', 'accepted'].includes(newMeetup.status)) {
          setActiveMeetup(newMeetup);
        } else {
          setActiveMeetup(null);
        }
      }
    ).subscribe();

    return () => { 
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(pChannel);
      supabase.removeChannel(meetupChannel);
    };
  }, [id, session]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (presenceChannel) {
      presenceChannel.track({ typing: text.length > 0 });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        presenceChannel.track({ typing: false });
      }, 3000);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !session || !id) return;
    
    if (!customText) {
      setInputText('');
      if (presenceChannel) presenceChannel.track({ typing: false });
    }
    
    const { error } = await supabase
      .from('messages')
      .insert({ match_id: id, sender_id: session.user.id, content: textToSend });
      
    if (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send message');
      return;
    }

    if (partner?.push_token) {
      const myName = myProfile?.nama || 'Someone';
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: partner.push_token, sound: 'default', title: `New message from ${myName} ⚡️`, body: textToSend, data: { matchId: id } }),
      }).catch(err => console.log('Push error:', err));
    }
  };

  const submitReport = async (alasan: string) => {
    if (!session || !partner || !id) return;
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: session.user.id,
        reported_id: partner.id,
        match_id: id,
        reason: alasan
      });
      if (error) throw error;
      
      const { error: blockError } = await supabase.from('blocks').insert({
        user_id: session.user.id,
        blocked_user_id: partner.id
      });
      if (blockError) throw blockError;
      
      const { error: matchError } = await supabase.from('matches').update({ is_active: false }).eq('id', id);
      if (matchError) throw matchError;
      
      Alert.alert('Reported', 'Laporan Anda sudah kami terima dan pengguna telah diblokir.');
      router.replace('/(tabs)/matches');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Gagal mengirim laporan: ' + (e.message || 'Coba lagi nanti.'));
    }
  };

  const handleReport = () => {
    Alert.alert('Report User', 'Please select a reason', [
      { text: 'Harassment', onPress: () => submitReport('Harassment') },
      { text: 'Fake Profile', onPress: () => submitReport('Fake Profile') },
      { text: 'Inappropriate Content', onPress: () => submitReport('Inappropriate Content') },
      { text: 'Spam', onPress: () => submitReport('Spam') },
      { text: 'Other', onPress: () => submitReport('Other') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const submitMeetup = async () => {
    if (!session || !partner || !id) return;
    if (!meetupLocation) {
      Alert.alert('Incomplete', 'Please enter a location');
      return;
    }
    
    try {
      const { error } = await supabase.from('meetups').insert({
        match_id: id,
        sender_id: session.user.id,
        lokasi_nama: meetupLocation,
        waktu_kumpul: meetupTime.toISOString(),
        status: 'pending'
      });
      
      if (error) throw error;
      
      handleSend(`Let's play at ${meetupLocation} on ${meetupTime.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`);
      
      setShowMeetupModal(false);
      setMeetupLocation('');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Gagal membuat jadwal: ' + (e.message || 'Coba lagi nanti.'));
    }
  };

  const handleMeetupAction = async (status: 'accepted' | 'declined') => {
    if (!activeMeetup) return;
    try {
      const { error } = await supabase.from('meetups').update({ status }).eq('id', activeMeetup.id);
      if (error) throw error;
      if (status === 'accepted') handleSend(`I've accepted your invitation to play at ${activeMeetup.lokasi_nama}!`);
      else handleSend(`Sorry, I can't make it to ${activeMeetup.lokasi_nama} at that time.`);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', 'Gagal merespons undangan: ' + (e.message || 'Coba lagi nanti.'));
    }
  };

  const handleSafetyAction = () => {
    Alert.alert('Settings', 'Select action for this user', [
      { text: 'Unmatch', style: 'destructive', onPress: async () => { await supabase.from('matches').update({ is_active: false }).eq('id', id); router.replace('/(tabs)/matches'); }},
      { text: 'Block', style: 'destructive', onPress: async () => { if(partner) await supabase.from('blocks').insert({ user_id: session?.user.id, blocked_user_id: partner.id }); await supabase.from('matches').update({ is_active: false }).eq('id', id); Alert.alert('Blocked', 'Pengguna ini tidak akan muncul lagi.'); router.replace('/(tabs)/matches'); }},
      { text: 'Report', style: 'destructive', onPress: handleReport },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const partnerAge = partner ? calculateAge(partner.tanggal_lahir) : null;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
        <Text style={{ color: COLORS.text, textAlign: 'center', paddingHorizontal: 20 }}>{errorMsg}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.surface, borderRadius: 8 }} 
          onPress={() => {
             // To re-trigger fetch, we need to clear error and loading
             setLoading(true);
             setErrorMsg(null);
             router.replace(`/chat/${id}` as any);
          }}
        >
          <Text style={{ color: COLORS.text }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" size={28} color={COLORS.primary} /></TouchableOpacity>
        
        <TouchableOpacity style={styles.headerProfileInfo} onPress={() => setShowProfileModal(true)}>
          {partner?.foto_url ? <Image source={{ uri: partner.foto_url }} style={styles.headerAvatar} /> : <View style={styles.headerAvatarPlaceholder}><Text style={styles.headerAvatarText}>{partner?.nama?.substring(0, 2).toUpperCase()}</Text></View>}
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>{partner?.nama || 'Chat'}</Text>
            {partnerPresence.typing ? (
              <Text style={styles.typingIndicator}>Typing...</Text>
            ) : partnerPresence.online ? (
              <View style={styles.onlineContainer}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.planActivityBtn} onPress={() => setShowMeetupModal(true)}>
          <Text style={styles.planActivityText}>PLAN GAME</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleSafetyAction} style={styles.safetyButton}><Ionicons name="ellipsis-vertical" size={24} color={COLORS.secondaryText} /></TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMe = item.sender_id === session?.user.id;
          const displayContent = item.content.startsWith('MVT_INVITE::') ? "Let's play! ⚡️" : item.content;
          return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>{displayContent}</Text>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          messages.length < 5 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickPromptsScroll}>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity key={idx} style={styles.quickPromptChip} onPress={() => handleSend(prompt)}>
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null
        }
      />

      {activeMeetup && (
        <View style={styles.meetupCard}>
          <View style={styles.meetupCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="location" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.meetupCardLocation} numberOfLines={1}>{activeMeetup.lokasi_nama}</Text>
            </View>
            <View style={[styles.meetupBadge, activeMeetup.status === 'accepted' ? styles.meetupBadgeAccepted : styles.meetupBadgePending]}>
              <Text style={[styles.meetupBadgeText, activeMeetup.status === 'accepted' ? styles.meetupBadgeTextAccepted : styles.meetupBadgeTextPending]}>
                {activeMeetup.status === 'accepted' ? 'Dikonfirmasi ✅' : 'Menunggu konfirmasi'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.meetupCardTime}>
            <Ionicons name="time-outline" size={16} /> {new Date(activeMeetup.waktu_kumpul).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </Text>

          {activeMeetup.status === 'pending' && (
            <View style={{ marginTop: 12 }}>
              {activeMeetup.sender_id === session?.user.id ? (
                <Text style={{ color: COLORS.secondaryText, fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>Menunggu balasan dari {partner?.nama || 'partner'}</Text>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={[styles.meetupActionBtn, { flex: 1, backgroundColor: COLORS.success }]} onPress={() => handleMeetupAction('accepted')}>
                    <Text style={styles.meetupActionText}>Terima</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.meetupActionBtn, { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]} onPress={() => handleMeetupAction('declined')}>
                    <Text style={[styles.meetupActionText, { color: COLORS.text }]}>Tolak</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={() => setShowMeetupModal(true)} style={styles.ajakMainButton}>
          <Ionicons name="flash" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <TextInput 
          style={styles.textInput} 
          placeholder="Write a message..." 
          placeholderTextColor={COLORS.secondaryText} 
          value={inputText} 
          onChangeText={handleTextChange} 
          multiline 
        />
        <TouchableOpacity style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} onPress={() => handleSend()} disabled={!inputText.trim()}>
          <Ionicons name="send" size={20} color={inputText.trim() ? COLORS.text : COLORS.secondaryText} />
        </TouchableOpacity>
      </View>

      {/* MODAL BIODATA */}
      <Modal visible={showProfileModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalFullContainer}>
          <View style={styles.modalHeaderFixed}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="close" size={28} color={COLORS.secondaryText} />
            </TouchableOpacity>
            <Text style={styles.modalMainTitle}>{partner?.nama}{partnerAge ? `, ${partnerAge}` : ''}</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {partner?.foto_url ? (
               <Image source={{ uri: partner.foto_url }} style={styles.modalHeroImage} />
            ) : (
               <View style={[styles.modalHeroImage, { backgroundColor: COLORS.elevatedSurface, justifyContent: 'center', alignItems: 'center' }]}>
                 <Text style={{ fontSize: 60, color: COLORS.secondaryText }}>{partner?.nama?.substring(0, 2).toUpperCase()}</Text>
               </View>
            )}

            <View style={styles.bioContainer}>
               <Text style={styles.sectionTitle}>ABOUT</Text>
               <Text style={styles.bioText}>{partner?.bio ? partner.bio : `Ready to play!`}</Text>
               
               <View style={{ height: 20 }} />
               
               {partner?.skill_level && (
                 <>
                   <Text style={styles.sectionTitle}>SKILL LEVEL</Text>
                   <View style={styles.tagBadge}><Text style={styles.tagText}>{partner.skill_level}</Text></View>
                   <View style={{ height: 20 }} />
                 </>
               )}

               {partner?.availability && (
                 <>
                   <Text style={styles.sectionTitle}>AVAILABILITY</Text>
                   <Text style={styles.bioText}>{partner.availability}</Text>
                   <View style={{ height: 20 }} />
                 </>
               )}
               
               <Text style={styles.sectionTitle}>INTERESTS</Text>
               <View style={styles.tagsContainer}>
                 {partner?.hobi?.split(',').map((hobi, idx) => (
                   <View key={idx} style={styles.tagBadge}><Text style={styles.tagText}>{hobi.trim()}</Text></View>
                 ))}
                 {partner?.pendidikan && <View style={styles.tagBadge}><Text style={styles.tagText}>🎓 {partner.pendidikan}</Text></View>}
                 {partner?.pekerjaan && <View style={styles.tagBadge}><Text style={styles.tagText}>💼 {partner.pekerjaan}</Text></View>}
               </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL AJAK MAIN */}
      <Modal visible={showMeetupModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalFullContainer}>
          <View style={styles.modalHeaderFixed}>
            <TouchableOpacity onPress={() => setShowMeetupModal(false)}>
              <Ionicons name="close" size={28} color={COLORS.secondaryText} />
            </TouchableOpacity>
            <Text style={styles.modalMainTitle}>Ajak Main</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={{ padding: 20 }}>
            <Text style={styles.sectionTitle}>LOKASI</Text>
            <TextInput 
              style={[styles.textInput, { marginBottom: 20, backgroundColor: COLORS.surface, minHeight: 50 }]}
              placeholder="Lokasi (misal: GOR Saparua)"
              placeholderTextColor={COLORS.secondaryText}
              value={meetupLocation}
              onChangeText={setMeetupLocation}
            />
            
            <Text style={styles.sectionTitle}>WAKTU</Text>
            <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 30, alignItems: 'center' }}>
              <DateTimePicker
                value={meetupTime}
                mode="datetime"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setMeetupTime(selectedDate);
                }}
                textColor={COLORS.text}
              />
            </View>

            <TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 }} onPress={submitMeetup}>
              <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16 }}>Kirim Ajakan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 16, alignItems: 'center' }} onPress={() => setShowMeetupModal(false)}>
              <Text style={{ color: COLORS.secondaryText, fontWeight: 'bold', fontSize: 16 }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.background },
  backButton: { padding: 4 }, safetyButton: { padding: 4 },
  headerProfileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.elevatedSurface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerAvatarText: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  headerTextGroup: { justifyContent: 'center' },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  typingIndicator: { color: COLORS.primary, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  onlineContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 4 },
  onlineText: { color: COLORS.success, fontSize: 12 },
  
  planActivityBtn: { backgroundColor: COLORS.elevatedSurface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, marginRight: 8 },
  planActivityText: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  messagesContainer: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginBottom: 8 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 20 }, myMessageText: { color: COLORS.text }, theirMessageText: { color: COLORS.text },
  
  quickPromptsScroll: { marginTop: 12, marginBottom: 8, paddingHorizontal: 4 },
  quickPromptChip: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  quickPromptText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  meetupCard: { backgroundColor: COLORS.elevatedSurface, marginHorizontal: 12, marginBottom: 8, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  meetupCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  meetupCardLocation: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', flex: 1 },
  meetupCardTime: { color: COLORS.secondaryText, fontSize: 14, marginBottom: 8 },
  meetupBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  meetupBadgePending: { backgroundColor: 'rgba(255, 165, 0, 0.2)' },
  meetupBadgeAccepted: { backgroundColor: 'rgba(0, 200, 83, 0.2)' },
  meetupBadgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  meetupBadgeTextPending: { color: '#FFA500' },
  meetupBadgeTextAccepted: { color: COLORS.success },
  meetupActionBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  meetupActionText: { color: COLORS.background, fontWeight: 'bold', fontSize: 14 },

  inputContainer: { flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: COLORS.surface, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.border },
  ajakMainButton: { padding: 8, marginRight: 4, justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: COLORS.elevatedSurface, color: COLORS.text, borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, maxHeight: 100, minHeight: 40, fontSize: 15 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  sendButtonDisabled: { backgroundColor: COLORS.elevatedSurface },
  
  modalFullContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeaderFixed: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: COLORS.background },
  modalMainTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  modalHeroImage: { width: '100%', height: 350, borderRadius: 24, marginBottom: 20 },
  bioContainer: { paddingBottom: 40 },
  sectionTitle: { color: COLORS.secondaryText, fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 12 },
  bioText: { color: COLORS.text, fontSize: 16, lineHeight: 24 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagBadge: { backgroundColor: COLORS.surface, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
  tagText: { color: COLORS.text, fontSize: 14, fontWeight: '600', alignSelf: 'flex-start' }
});
