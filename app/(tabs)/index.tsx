import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, ActivityIndicator, Modal, Switch, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../_layout';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate,
  runOnJS,
  Extrapolation
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import RadarAnimation from '../../components/RadarAnimation';
import Skeleton from '../../components/Skeleton';
import { COLORS, SIZES } from '../../constants/DesignSystem';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD_X = 120;
const SWIPE_THRESHOLD_Y = -120; // For Lock It In (Up)
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

type Profile = { 
  id: string; 
  nama: string; 
  foto_url: string | null; 
  alamat: string | null; 
  bio: string | null;
  skill_level?: string;
  availability?: string;
  looking_for?: string;
  user_sports?: { sports: { nama: string; icon?: string } }[]; 
};

// --- Reusable Swipeable Card ---
const SwipeableCard = ({ profile, isFirst, onSwipe }: { profile: Profile, isFirst: boolean, onSwipe: (dir: 'left' | 'right' | 'up', id: string) => void }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(isFirst)
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      'worklet';
      if (event.translationX > SWIPE_THRESHOLD_X) {
        translateX.value = withSpring(width + 100, SPRING_CONFIG, () => runOnJS(onSwipe)('right', profile.id));
      } else if (event.translationX < -SWIPE_THRESHOLD_X) {
        translateX.value = withSpring(-width - 100, SPRING_CONFIG, () => runOnJS(onSwipe)('left', profile.id));
      } else if (event.translationY < SWIPE_THRESHOLD_Y && Math.abs(event.translationX) < 80) {
        translateY.value = withSpring(-height - 100, SPRING_CONFIG, () => runOnJS(onSwipe)('up', profile.id));
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const rStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-width / 2, 0, width / 2], [-8, 0, 8], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: isFirst ? 1 : 0.95 }
      ],
      zIndex: isFirst ? 10 : 1
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, width / 4], [0, 1], Extrapolation.CLAMP)
  }));
  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -width / 4], [0, 1], Extrapolation.CLAMP)
  }));
  const superOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, -height / 6], [0, 1], Extrapolation.CLAMP)
  }));

  const renderPhoto = () => {
    if (profile.foto_url) {
      return <Image source={{ uri: profile.foto_url }} style={styles.cardImage} />;
    }
    return (
      <View style={styles.cardImagePlaceholder}>
        <LinearGradient colors={['#1D2028', '#11131A']} style={StyleSheet.absoluteFill} />
        <Ionicons name="person" size={100} color="#2A2E38" />
      </View>
    );
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cardContainer, rStyle]}>
        {renderPhoto()}
        <LinearGradient colors={['transparent', 'rgba(9, 10, 13, 0.7)', 'rgba(9, 10, 13, 1)']} style={styles.gradientOverlay}>
          
          {/* Stamps */}
          <Animated.View style={[styles.stampContainer, styles.stampLike, likeOpacity]}>
            <Text style={styles.stampTextLike}>LET'S PLAY</Text>
          </Animated.View>
          <Animated.View style={[styles.stampContainer, styles.stampPass, passOpacity]}>
            <Text style={styles.stampTextPass}>SKIP</Text>
          </Animated.View>
          <Animated.View style={[styles.stampContainer, styles.stampSuper, superOpacity]}>
            <Text style={styles.stampTextSuper}>LOCK IT IN</Text>
          </Animated.View>

          <View style={styles.infoSection}>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.nameText}>{profile.nama}</Text>
                <View style={styles.onlineBadge} />
             </View>
             
             <View style={styles.locationRow}>
               <Ionicons name="location-sharp" size={14} color={COLORS.secondaryText} />
               <Text style={styles.locationText}>{profile.alamat || 'Bandung'}</Text>
             </View>
             
             <View style={styles.tagsContainer}>
                {profile.user_sports?.slice(0, 2).map((us, idx: number) => {
                  const sport = us.sports;
                  if (!sport) return null;
                  return (
                    <View key={idx} style={styles.glassTag}>
                      <MaterialCommunityIcons name={(sport.icon as any) || 'trophy-outline'} size={14} color={COLORS.text} style={{ marginRight: 4 }} />
                      <Text style={styles.glassTagText}>{sport.nama}</Text>
                    </View>
                  );
                })}
                {!!profile.skill_level && (
                  <View style={styles.glassTagOutline}>
                    <Text style={styles.glassTagTextOutline}>{profile.skill_level}</Text>
                  </View>
                )}
             </View>

             {!!(profile.availability || profile.bio) && (
               <View style={styles.bioContainer}>
                 {!!profile.availability && <Text style={styles.availabilityText}>⏱ {profile.availability}</Text>}
                 {!!profile.bio && <Text style={styles.bioText} numberOfLines={2}>"{profile.bio}"</Text>}
               </View>
             )}
          </View>
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

const SettingsSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View style={styles.settingsSection}>
    <Text style={styles.settingsSectionTitle}>{title}</Text>
    <View style={styles.settingsSectionBody}>
      {children}
    </View>
  </View>
);

const SettingsRow = ({ label, rightElement, onPress, isLast, labelStyle }: { label: string, rightElement?: React.ReactNode, onPress?: () => void, isLast?: boolean, labelStyle?: any }) => (
  <TouchableOpacity style={[styles.settingsRow, !isLast && styles.settingsRowBorder]} onPress={onPress} disabled={!onPress}>
    <Text style={[styles.settingsRowLabel, labelStyle]}>{label}</Text>
    <View style={styles.settingsRowRight}>
      {rightElement !== undefined ? rightElement : (onPress ? <Ionicons name="chevron-forward" size={20} color={COLORS.secondaryText} /> : null)}
    </View>
  </TouchableOpacity>
);

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);

  // States untuk Filter Modal
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [maxDistance, setMaxDistance] = useState(20);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  useEffect(() => { 
    if (session) {
      fetchProfiles(); 
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        if (data.max_distance !== undefined) setMaxDistance(data.max_distance);
        if (data.email_notifications !== undefined && data.email_notifications !== null) setEmailNotif(data.email_notifications);
        if (data.push_notifications !== undefined && data.push_notifications !== null) setPushNotif(data.push_notifications);
        if (data.sms_notifications !== undefined && data.sms_notifications !== null) setSmsNotif(data.sms_notifications);
      }
    } catch (e) { console.error(e); }
  };

  const updateSetting = async (key: string, value: any) => {
    if (key === 'email_notifications') setEmailNotif(value);
    if (key === 'push_notifications') setPushNotif(value);
    if (key === 'sms_notifications') setSmsNotif(value);
    
    if (!session) return;
    try {
      const { error } = await supabase.from('profiles').update({ [key]: value }).eq('id', session.user.id);
      if (error) throw error;
    } catch (e: any) { 
      console.error(e);
      Alert.alert('Error', 'Gagal menyimpan pengaturan: ' + (e.message || 'Coba lagi nanti.'));
    }
  };

import { DUMMY_PROFILES } from '../../constants/MockData';

  const fetchProfiles = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Menggunakan data mock resolusi tinggi
      setTimeout(() => {
        setProfiles(DUMMY_PROFILES);
        setLoading(false);
      }, 500); // Simulasi loading jaringan
    } catch (error: any) { 
      console.error("fetchProfiles Error:", error); 
      setProfiles([]);
      setLoading(false); 
    }
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'up', targetId: string) => {
    if (!session) return;
    const action = direction === 'left' ? 'pass' : 'like';
    const isSuper = direction === 'up';

    setProfiles((prev) => prev.slice(1));

    try {
      const { error: swipeError } = await supabase.from('swipes').insert({ user_id: session.user.id, target_user_id: targetId, action, is_super_like: isSuper });
      if (swipeError) throw swipeError;
      
      if (action === 'like') {
        const { data: isMatch, error: matchError } = await supabase.from('swipes').select('id').match({ user_id: targetId, target_user_id: session.user.id, action: 'like' }).maybeSingle();
        if (matchError) throw matchError;
        
        if (isMatch) {
          const { data: newMatch, error: insertMatchError } = await supabase.from('matches').insert({ user_a_id: session.user.id, user_b_id: targetId, is_active: true }).select('id').single();
          if (insertMatchError) throw insertMatchError;
          
          const matchedProfile = profiles.find(p => p.id === targetId);
          if (matchedProfile && newMatch) setMatchData({ ...matchedProfile, matchId: newMatch.id });
        }
      }
    } catch (err: any) { 
      console.error(err);
      Alert.alert('Error', 'Gagal menyimpan aksi: ' + (err.message || 'Coba lagi nanti.'));
    }
  };

  const manualSwipe = (direction: 'left' | 'right' | 'up') => {
    if (profiles.length === 0) return;
    handleSwipe(direction, profiles[0].id);
  };

  const renderCards = () => {
    if (loading) return (
      <View style={{ width: width - 32, height: height * 0.65, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.surface, padding: 16, justifyContent: 'flex-end' }}>
        <Skeleton width="60%" height={28} borderRadius={6} style={{ marginBottom: 12 }} />
        <Skeleton width="40%" height={18} borderRadius={4} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={80} height={28} borderRadius={14} />
          <Skeleton width={90} height={28} borderRadius={14} />
        </View>
      </View>
    );
    if (errorMsg) return (
      <View style={styles.emptyState}>
        <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Error</Text>
        <Text style={{ color: COLORS.text, textAlign: 'center', paddingHorizontal: 20 }}>{errorMsg}</Text>
        <TouchableOpacity style={{ marginTop: 20, padding: 10, backgroundColor: COLORS.surface, borderRadius: 8, zIndex: 999 }} onPress={fetchProfiles}>
          <Text style={{ color: COLORS.text }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
    if (profiles.length === 0) return (
      <View style={styles.emptyState}>
        <RadarAnimation />
        <Text style={styles.emptyTitle}>⚡ NO PLAY PARTNERS NEARBY YET</Text>
        <Text style={styles.emptySub}>Try expanding your distance or sport filters.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => setIsFilterVisible(true)}>
           <Text style={styles.emptyBtnText}>ADJUST FILTERS</Text>
        </TouchableOpacity>
      </View>
    );

    return profiles.map((profile, index) => {
      if (index > 1) return null;
      return <SwipeableCard key={profile.id} profile={profile} isFirst={index === 0} onSwipe={handleSwipe} />;
    }).reverse();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* HEADER DISCOVER */}
      <View style={styles.headerArea}>
         <View style={styles.iconButton} />
         <Text style={styles.headerLogoText}>MANUVER <Ionicons name="flame" size={22} color={COLORS.primary} /></Text>
         <TouchableOpacity onPress={() => setIsFilterVisible(true)} style={styles.iconButton}>
            <Ionicons name="options-outline" size={26} color={COLORS.text} />
         </TouchableOpacity>
      </View>

      <View style={styles.deckContainer}>
        {renderCards()}
      </View>

      {/* BOTTOM ACTIONS */}
      {profiles.length > 0 && !loading && (
        <View style={styles.bottomActions}>
           <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={() => manualSwipe('left')}>
             <Ionicons name="close" size={28} color={COLORS.secondaryText} />
           </TouchableOpacity>
           <TouchableOpacity style={[styles.actionBtn, styles.superBtn]} onPress={() => manualSwipe('up')}>
             <Ionicons name="flash" size={28} color="#FFD700" />
           </TouchableOpacity>
           <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => manualSwipe('right')}>
             <Ionicons name="checkmark-sharp" size={32} color={COLORS.primary} />
           </TouchableOpacity>
        </View>
      )}

      {/* FULL SCREEN SETTINGS MODAL */}
      <Modal visible={isFilterVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.settingsModalContainer}>
          <View style={styles.settingsHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.settingsHeaderTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setIsFilterVisible(false)} style={styles.settingsDoneBtn}>
              <Text style={styles.settingsDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.settingsScroll} showsVerticalScrollIndicator={false}>
            <SettingsSection title="DISCOVERY SETTINGS">
              <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.settingsRowLabel}>Maximum Distance</Text>
                <Text style={styles.settingsRowValue}>{maxDistance} km</Text>
              </View>
              <View style={styles.sliderContainer}>
                <Slider 
                  style={{ width: '100%', height: 40 }} 
                  minimumValue={1} maximumValue={50} step={1} 
                  value={maxDistance} onValueChange={setMaxDistance} 
                  onSlidingComplete={(val) => updateSetting('max_distance', val)}
                  minimumTrackTintColor={COLORS.primary} maximumTrackTintColor={COLORS.border} thumbTintColor={COLORS.text} 
                />
              </View>
            </SettingsSection>

            <SettingsSection title="NOTIFICATIONS">
              <SettingsRow label="Email" rightElement={<Switch value={emailNotif} onValueChange={(v) => updateSetting('email_notifications', v)} trackColor={{ true: COLORS.primary }} />} />
              <SettingsRow label="Push Notifications" rightElement={<Switch value={pushNotif} onValueChange={(v) => updateSetting('push_notifications', v)} trackColor={{ true: COLORS.primary }} />} />
              <SettingsRow label="SMS" rightElement={<Switch value={smsNotif} onValueChange={(v) => updateSetting('sms_notifications', v)} trackColor={{ true: COLORS.primary }} />} isLast />
            </SettingsSection>
            
            <SettingsSection title="CONTACT US">
              <SettingsRow label="Contact Us" onPress={() => { setIsFilterVisible(false); router.push('/settings/contact' as any); }} />
              <SettingsRow label="Help & Support" onPress={() => { setIsFilterVisible(false); router.push('/settings/help' as any); }} isLast />
            </SettingsSection>
            
            <SettingsSection title="COMMUNITY">
              <SettingsRow label="Community Guidelines" onPress={() => { setIsFilterVisible(false); router.push('/settings/guidelines' as any); }} />
              <SettingsRow label="Safety Tips" onPress={() => { setIsFilterVisible(false); router.push('/settings/safety' as any); }} isLast />
            </SettingsSection>
            
            <SettingsSection title="LEGAL">
              <SettingsRow label="Privacy Policy" onPress={() => { setIsFilterVisible(false); router.push('/settings/privacy' as any); }} />
              <SettingsRow label="Terms of Service" onPress={() => { setIsFilterVisible(false); router.push('/settings/terms' as any); }} isLast />
            </SettingsSection>

            <View style={styles.settingsLogoutContainer}>
              <TouchableOpacity style={styles.settingsLogoutBtn} onPress={() => supabase.auth.signOut()}>
                <Text style={styles.settingsLogoutText}>Log Out</Text>
              </TouchableOpacity>
              
              <View style={styles.settingsVersionContainer}>
                <Ionicons name="flame" size={32} color={COLORS.secondaryText} />
                <Text style={styles.settingsVersionText}>Version 1.0.0</Text>
              </View>
              
              <TouchableOpacity style={styles.settingsDeleteBtn}>
                <Text style={styles.settingsDeleteText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MATCH MODAL */}
      <Modal visible={!!matchData} transparent animationType="fade">
         <View style={styles.matchModalOverlay}>
            <Text style={styles.matchTitle}>YOU FOUND A PLAY PARTNER</Text>
            <Ionicons name="flash" size={60} color={COLORS.primary} style={{ marginVertical: 20 }} />
            <Text style={styles.matchSubtitle}>You and {matchData?.nama} want to play!</Text>
            <TouchableOpacity style={styles.matchPrimaryBtn} onPress={() => setMatchData(null)}>
              <Text style={styles.matchPrimaryText}>PLAN A GAME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.matchSecondaryBtn} onPress={() => setMatchData(null)}>
              <Text style={styles.matchSecondaryText}>KEEP SWIPING</Text>
            </TouchableOpacity>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, zIndex: 100 },
  headerLogoText: { color: COLORS.text, fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: 2 },
  iconButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  deckContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingBottom: 100 },
  cardContainer: { position: 'absolute', width: width * 0.94, height: height * 0.75, borderRadius: SIZES.borderRadius, overflow: 'hidden', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', padding: SIZES.padding },
  infoSection: { width: '100%', paddingBottom: 10 },
  nameText: { color: COLORS.text, fontSize: 36, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  locationText: { color: COLORS.secondaryText, fontSize: 14, marginLeft: 4, fontWeight: '600', textTransform: 'uppercase' },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  glassTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.elevatedSurface, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  glassTagText: { color: COLORS.text, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  glassTagOutline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  glassTagTextOutline: { color: COLORS.primary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  
  bioContainer: { marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  availabilityText: { color: COLORS.success, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  bioText: { color: COLORS.secondaryText, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  
  onlineBadge: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success, marginLeft: 12, borderWidth: 2, borderColor: COLORS.background },

  // Stamps
  stampContainer: { position: 'absolute', top: 50, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 4, transform: [{ rotate: '-15deg' }] },
  stampLike: { left: 40, borderColor: COLORS.primary },
  stampTextLike: { color: COLORS.primary, fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  stampPass: { right: 40, borderColor: COLORS.secondaryText, transform: [{ rotate: '15deg' }] },
  stampTextPass: { color: COLORS.secondaryText, fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  stampSuper: { top: '40%', alignSelf: 'center', borderColor: '#FFD700', transform: [{ rotate: '0deg' }] },
  stampTextSuper: { color: '#FFD700', fontSize: 32, fontWeight: '900', letterSpacing: 2 },

  // Bottom Actions
  bottomActions: { position: 'absolute', bottom: 110, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 20 },
  actionBtn: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.elevatedSurface, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  likeBtn: { width: 72, height: 72, borderRadius: 36, borderColor: 'rgba(255, 87, 47, 0.3)' }, 
  superBtn: { width: 56, height: 56, borderRadius: 28 },
  passBtn: { },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 8, textAlign: 'center' },
  emptySub: { color: COLORS.secondaryText, fontSize: 14, textAlign: 'center', marginBottom: 32 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: SIZES.borderRadius, backgroundColor: COLORS.elevatedSurface, borderWidth: 1, borderColor: COLORS.primary },
  emptyBtnText: { color: COLORS.primary, fontWeight: '800', letterSpacing: 1 },

  // Settings Components UI
  settingsSection: { marginBottom: 24 },
  settingsSectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.secondaryText, textTransform: 'uppercase', marginLeft: 16, marginBottom: 8 },
  settingsSectionBody: { backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: COLORS.surface },
  settingsRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  settingsRowLabel: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  settingsRowValue: { fontSize: 16, color: COLORS.secondaryText },
  settingsRowRight: { flexDirection: 'row', alignItems: 'center' },

  // Settings Modal Layout
  settingsModalContainer: { flex: 1, backgroundColor: COLORS.background },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  settingsHeaderTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  settingsDoneBtn: { padding: 8, minWidth: 60, alignItems: 'flex-end' },
  settingsDoneText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  settingsScroll: { flex: 1, padding: 16 },
  
  sliderContainer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  settingsLogoutContainer: { marginTop: 16, marginBottom: 60, alignItems: 'center' },
  settingsLogoutBtn: { width: '100%', backgroundColor: COLORS.surface, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  settingsLogoutText: { fontSize: 16, fontWeight: '700', color: COLORS.error },
  settingsVersionContainer: { alignItems: 'center', marginBottom: 32 },
  settingsVersionText: { fontSize: 14, color: COLORS.secondaryText, marginTop: 8 },
  settingsDeleteBtn: { padding: 16 },
  settingsDeleteText: { fontSize: 14, fontWeight: '600', color: COLORS.secondaryText },

  // Match Modal
  matchModalOverlay: { flex: 1, backgroundColor: 'rgba(9, 10, 13, 0.98)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  matchTitle: { color: COLORS.text, fontSize: 32, fontWeight: '900', fontStyle: 'italic', textAlign: 'center', letterSpacing: 1 },
  matchSubtitle: { color: COLORS.secondaryText, fontSize: 18, marginBottom: 50, textAlign: 'center' },
  matchPrimaryBtn: { backgroundColor: COLORS.primary, width: '100%', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  matchPrimaryText: { color: COLORS.text, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  matchSecondaryBtn: { width: '100%', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.border },
  matchSecondaryText: { color: COLORS.text, fontSize: 16, fontWeight: '800', letterSpacing: 1 }
});
