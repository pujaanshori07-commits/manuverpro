import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Profile, MatchData } from '../types/database';

export function useProfiles() {
  const queryClient = useQueryClient();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);

  const fetchProfilesFn = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      return [];
    }

    // Read preferences from AsyncStorage
    const storedFilters = await AsyncStorage.getItem('@manuver_match_filters_v1');
    let maxDist = 50;
    let maxAge = 60;
    let minAge = 18;
    let filterSports = null;

    if (storedFilters) {
      const parsed = JSON.parse(storedFilters);
      maxDist = parsed.maxDistance ?? 50;
      maxAge = parsed.maxAge ?? 60;
      minAge = parsed.minAge ?? 18;
      if (parsed.selectedSports && parsed.selectedSports.length > 0) {
        filterSports = parsed.selectedSports;
      }
    }

    const { data, error } = await supabase
      .rpc('get_nearby_profiles', {
        user_id_param: userId,
        max_distance_km: maxDist,
        max_age_val: maxAge,
        min_age_val: minAge,
        filter_sports: filterSports,
        limit_val: 25
      });

    if (error || !data || data.length === 0) {
      return [];
    }
    
    return data.map((item: any) => {
      const rawPhotos = Array.isArray(item.photos) && item.photos.length > 0
        ? item.photos
        : item.foto_url
        ? [item.foto_url]
        : ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80'];

      return {
        id: item.id,
        nama: item.nama || 'Pengguna',
        age: item.umur || 25,
        umur: item.umur || 25, // legacy support
        foto_url: rawPhotos[0],
        photos: rawPhotos,
        alamat: item.alamat || 'Unknown Location',
        jarak: item.jarak || '1 km',
        distance: parseFloat(item.jarak) || 1, // mapping legacy jarak to distance
        hobi: Array.isArray(item.hobi)
          ? item.hobi.join(', ')
          : item.hobi
          ? item.hobi
          : 'Olahraga',
        bio: item.bio || '',
        prompt_question: item.prompt_question,
        prompt_answer: item.prompt_answer,
        skill_level: item.skill_level || 'Beginner',
        availability: Array.isArray(item.availability) ? item.availability : (item.availability ? item.availability.split(',') : ['Weekend']),
        distance_pref: item.distance_pref,
        interests: item.interests,
        user_sports: item.hobi ? String(item.hobi).split(',').map(h => ({ sports: { nama: h.trim() } })) : [],
      };
    }) as Profile[];
  };

  const { 
    data: profiles = [], 
    isLoading: loading, 
    refetch: fetchProfiles 
  } = useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfilesFn,
  });

  const swipeMutation = useMutation({
    mutationFn: async ({ swipedId, direction }: { swipedId: string, direction: 'left' | 'right' | 'up' }) => {
      const { data, error } = await supabase.rpc('handle_swipe', {
        target_id: swipedId,
        swipe_action: direction === 'left' ? 'pass' : 'like'
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ swipedId }) => {
      // Optimistically remove from cache
      await queryClient.cancelQueries({ queryKey: ['profiles'] });
      const previousProfiles = queryClient.getQueryData<Profile[]>(['profiles']);
      if (previousProfiles) {
        queryClient.setQueryData<Profile[]>(['profiles'], old => old?.filter(p => p.id !== swipedId));
      }
      return { previousProfiles };
    },
    onError: (err, variables, context) => {
      console.error('Error recording swipe:', err);
      if (context?.previousProfiles) {
        queryClient.setQueryData(['profiles'], context.previousProfiles);
      }
    },
    onSuccess: async (data, variables) => {
      if (data?.is_match) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: myProfile } = await supabase.from('profiles').select('foto_url').eq('id', userData.user.id).single();
          setMyAvatarUrl(myProfile?.foto_url || null);
          
          // We need the swiped profile data from cache to show celebration
          const previousProfiles = queryClient.getQueryData<Profile[]>(['profiles']);
          const swipedProfile = previousProfiles?.find(p => p.id === variables.swipedId);
          
          setMatchData({
            matchId: data.match_id,
            nama: swipedProfile?.nama || 'Seseorang',
            foto_url: swipedProfile?.foto_url || null
          });
        }
      }
    }
  });

  const handleSwipeComplete = async (
    swipedProfile: Profile, 
    direction: 'left' | 'right' | 'up'
  ) => {
    const swipedId = swipedProfile?.id;
    if (swipedId && !swipedId.startsWith('demo-')) {
      swipeMutation.mutate({ swipedId, direction });
    } else {
      // Just filter locally for demo profiles
      queryClient.setQueryData<Profile[]>(['profiles'], old => old?.filter(p => p.id !== swipedId));
    }
  };

  const closeMatchModal = () => setMatchData(null);

  return {
    profiles,
    loading,
    matchData,
    myAvatarUrl,
    fetchProfiles,
    handleSwipeComplete,
    closeMatchModal,
  };
}
