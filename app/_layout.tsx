import { Session } from '@supabase/supabase-js';
import { Redirect, Stack, SplashScreen, useSegments } from 'expo-router';
import React, { Component, ErrorInfo, ReactNode, createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Text, View, Platform, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Montserrat_800ExtraBold_Italic } from '@expo-google-fonts/montserrat';
import {
  Lato_300Light,
  Lato_400Regular,
  Lato_700Bold,
  Lato_900Black,
} from '@expo-google-fonts/lato';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

type Profile = {
  id: string;
  nama: string;
  tanggal_lahir: string;
  alamat: string | null;
  hobi: string | null;
  foto_url: string | null;
  pendidikan: string | null;
  pekerjaan: string | null;
  bio: string | null;
  negara: string | null;
  terms_accepted: boolean;
  location_asked: boolean;
  onboarding_complete: boolean;
  push_token: string | null;
  skill_level: string | null;
  life_tags: string[] | null;
  interests: string[] | null;
  workout_preference: string | null;
  has_completed_onboarding?: boolean;
};

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  checkingProfile: boolean;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  checkingProfile: false,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function registerForPushNotificationsAsync() {
  console.log("Push notifications temporarily disabled for Expo Go compatibility on Android.");
  return null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by RootErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#090A0D', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#FF572F', fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>Something went wrong</Text>
          <Text style={{ color: '#92959E', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {__DEV__ && this.state.error ? this.state.error.toString() : 'An unexpected error occurred in the application.'}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#FF572F', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
            onPress={this.handleReset}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const isMounted = useRef(true);

  // Load fonts dari Lovable theme
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_800ExtraBold_Italic,
    Lato_300Light,
    Lato_400Regular,
    Lato_700Bold,
    Lato_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => { setSession(session); })
      .catch((err) => { console.error("Error fetching auth session:", err); })
      .finally(() => { setLoading(false); });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!session) return;
    setCheckingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error) {
        if (isMounted.current) {
          const safeProfile = data ? {
            ...data,
            terms_accepted: data.terms_accepted ?? true,
            location_asked: data.location_asked ?? true,
            onboarding_complete: data.onboarding_complete ?? true,
          } : {
            id: session.user.id,
            nama: session.user.email?.split('@')[0] || 'User',
            tanggal_lahir: '',
            alamat: null,
            hobi: null,
            foto_url: null,
            pendidikan: null,
            pekerjaan: null,
            bio: null,
            negara: null,
            terms_accepted: true,
            location_asked: true,
            onboarding_complete: true,
            push_token: null,
            skill_level: null,
            life_tags: null,
            interests: null,
            workout_preference: null,
          };
          setProfile(safeProfile as Profile);
        }
        
        // Minta izin notifikasi & simpan token ke DB
        const token = await registerForPushNotificationsAsync();
        if (token && data && data.push_token !== undefined && data.push_token !== token && isMounted.current) {
          await supabase.from('profiles').update({ push_token: token }).eq('id', session.user.id);
        }
      } else {
        console.error("Error fetching profile:", error);
      }
    } catch (e) {
      console.error("Unexpected error in fetchProfile:", e);
    } finally {
      if (isMounted.current) setCheckingProfile(false);
    }
  }, [session]);

  useEffect(() => { if (session) fetchProfile(); }, [session, fetchProfile]);

  // Instead of early return which unmounts Stack, we use an absolute overlay

  const authRoutes = ['login', 'register', 'welcome', 'intro'];
  const inAuthGroup = authRoutes.includes(segments[0] as string);
  const inOnboardingGroup = (segments[0] as string) === 'onboarding';

  let redirectTo: string | null = null;

  if (!session) {
    if (!inAuthGroup) redirectTo = '/welcome';
  } else if (profile) {
    if (!profile.onboarding_complete && !profile.has_completed_onboarding) {
      if (!inOnboardingGroup) {
        redirectTo = '/onboarding/flow';
      }
    } 
    else if (inAuthGroup || inOnboardingGroup) {
      redirectTo = '/';
    }
  } else {
    if (!checkingProfile && !inAuthGroup && !inOnboardingGroup) redirectTo = '/onboarding/flow';
  }

  return (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <AuthContext.Provider value={{ session, profile, loading, checkingProfile, refreshProfile: fetchProfile }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#090A0D' } }}>
            <Stack.Screen
              name="match-celebration"
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
                headerShown: false,
              }}
            />
          </Stack>
          {redirectTo && <Redirect href={redirectTo as any} />}
          
          {/* Loading Overlay to prevent unmounting the Stack context */}
          {(loading || (session && checkingProfile && !profile)) && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#090A0D', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
              <ActivityIndicator size="large" color="#FF572F" />
            </View>
          )}
        </AuthContext.Provider>
      </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}