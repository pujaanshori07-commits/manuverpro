import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Message } from '../types/database';
import { sendPushNotification } from '../lib/sendPushNotification';

export function useChat(matchId: string | string[] | undefined) {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    });
  }, []);

  const fetchMessagesFn = async () => {
    if (!matchId) return [];
    const id = matchId as string;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', id)
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
    
    return [
      {
        id: 'm-1',
        sender_id: 'partner',
        content: `Halo! Siap buat sparing bareng?`,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  };

  const {
    data: messages = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ['chat', matchId],
    queryFn: fetchMessagesFn,
    enabled: !!matchId,
  });

  useEffect(() => {
    if (!matchId) return;
    const id = matchId as string;

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${id}` },
        (payload) => {
          queryClient.setQueryData<Message[]>(['chat', matchId], (old) => {
            if (!old) return [payload.new as Message];
            // Prevent duplicate messages if already optimistically added
            if (old.some(m => m.id === payload.new.id)) return old;
            return [...old, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  const sendMessage = async (text: string) => {
    const id = matchId as string;
    if (!text.trim() || !id || !currentUserId) return;

    const newMsg: Message = {
      id: Math.random().toString(),
      sender_id: currentUserId,
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistic update
    queryClient.setQueryData<Message[]>(['chat', matchId], (old) => {
      return old ? [...old, newMsg] : [newMsg];
    });

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

  const sendSparingInvite = async (inviteData: any) => {
    const id = matchId as string;
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
    
    queryClient.setQueryData<Message[]>(['chat', matchId], (old) => {
      return old ? [...old, newMsg] : [newMsg];
    });

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
  };

  const updateInviteStatus = async (messageId: string, newStatus: string) => {
    // Optimistic UI update
    queryClient.setQueryData<Message[]>(['chat', matchId], (old) => {
      if (!old) return [];
      return old.map((msg) => {
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
      });
    });

    // Database update
    try {
      const messagesCache = queryClient.getQueryData<Message[]>(['chat', matchId]) || [];
      const msgToUpdate = messagesCache.find((m) => m.id === messageId);
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

  return {
    messages,
    loading,
    currentUserId,
    sendMessage,
    sendSparingInvite,
    updateInviteStatus,
  };
}
