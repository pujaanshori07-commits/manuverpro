import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uggjtloxneeqwvjbqofg.supabase.co';
const supabaseAnonKey = 'sb_publishable_t0D439864i-iPurq459Ebw_mFX83y_H';

// Supabase tidak bisa memuat AsyncStorage di lingkungan Server-Side Rendering (SSR)
const isSSR = typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isSSR ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});