import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolation } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export type ProfileData = {
  id: string;
  nama: string;
  alamat: string | null;
  hobi: string | null;
  foto_url: string | null;
  distance?: number;
  age?: number;
  bio?: string | null;
  pendidikan?: string | null;
  pekerjaan?: string | null;
  candidateSportIds?: number[];
};

interface SwipeCardProps {
  profile: ProfileData;
  onSwipedLeft: (id: string) => void;
  onSwipedRight: (id: string) => void;
  onViewProfile: (profile: ProfileData) => void;
}

export default function SwipeCard({ profile, onSwipedLeft, onSwipedRight, onViewProfile }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => { runOnJS(onSwipedRight)(profile.id); });
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => { runOnJS(onSwipedLeft)(profile.id); });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2], [-10, 0, 10], Extrapolation.CLAMP);
    return { transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }] };
  });

  const likeOpacity = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolation.CLAMP) }));
  const nopeOpacity = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD / 2], [0, 1], Extrapolation.CLAMP) }));

  const distanceDisplay = profile.distance !== undefined ? (profile.distance < 1 ? '< 1 KM' : `${Math.round(profile.distance)} KM`) : '';

  // Ambil hobi pertama saja agar tidak terlalu panjang di depan kartu
  const mainHobby = profile.hobi ? profile.hobi.split(',')[0].trim() : null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        
        {profile.foto_url ? (
           <Image source={{ uri: profile.foto_url }} style={styles.imageBackground} resizeMode="cover" />
        ) : (
           <View style={styles.imagePlaceholder}>
             <Text style={styles.initials}>{profile.nama.substring(0, 2).toUpperCase()}</Text>
           </View>
        )}

        {/* MENGGUNAKAN LINEAR GRADIENT AGAR WAJAH TIDAK TERPOTONG */}
        <LinearGradient
          colors={['transparent', 'rgba(11, 13, 18, 0.6)', '#0B0D12']}
          locations={[0, 0.4, 1]}
          style={styles.gradientOverlay}
        />

        <Animated.View style={[styles.labelContainer, styles.likeLabelContainer, likeOpacity]}><Text style={styles.likeLabel}>MANUVER!</Text></Animated.View>
        <Animated.View style={[styles.labelContainer, styles.nopeLabelContainer, nopeOpacity]}><Text style={styles.nopeLabel}>PASS</Text></Animated.View>

        <TouchableOpacity style={styles.infoContainer} activeOpacity={0.9} onPress={() => onViewProfile(profile)}>
          <View style={styles.textContainer}>
            
            {/* BIO SINGKAT (TAMPIL DI ATAS NAMA) */}
            <View style={styles.tagsRow}>
              {profile.pekerjaan && (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>💼 {profile.pekerjaan}</Text>
                </View>
              )}
              {mainHobby && (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>🎯 {mainHobby}</Text>
                </View>
              )}
            </View>

            <Text style={styles.name}>{profile.nama}{profile.age ? `, ${profile.age}` : ''}</Text>
            
            <View style={styles.locationRow}>
               <Ionicons name="location" size={16} color="#CCCCCC" />
               <Text style={styles.location}>{profile.alamat ? profile.alamat : 'Lokasi tidak diketahui'}</Text>
               {distanceDisplay ? (
                  <View style={styles.distanceBadge}><Text style={styles.distanceText}>{distanceDisplay}</Text></View>
               ) : null}
            </View>
          </View>
          
          <View style={styles.infoButton}>
            <Ionicons name="chevron-up" size={24} color="#0B0D12" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', width: '100%', height: '100%', borderRadius: 24, backgroundColor: '#1C1F26', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  imageBackground: { width: '100%', height: '100%', position: 'absolute' },
  imagePlaceholder: { flex: 1, backgroundColor: '#2A2E38', alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 80, fontWeight: 'bold', color: '#3F4452' },
  
  // Memperluas area gradien agar transisinya sangat halus
  gradientOverlay: { position: 'absolute', bottom: 0, width: '100%', height: '70%' },
  
  infoContainer: { position: 'absolute', bottom: 0, width: '100%', padding: 24, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  textContainer: { flex: 1, paddingRight: 10 },
  
  // Style untuk Bio Singkat
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagBadge: { backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  tagText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  name: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  location: { fontSize: 15, color: '#CCCCCC', fontWeight: '500', marginLeft: 4, marginRight: 12 },
  distanceBadge: { backgroundColor: 'rgba(255, 90, 42, 0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  distanceText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  labelContainer: { position: 'absolute', top: 40, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 3 },
  likeLabelContainer: { left: 30, borderColor: '#4CAF50', transform: [{ rotate: '-15deg' }] },
  nopeLabelContainer: { right: 30, borderColor: '#F44336', transform: [{ rotate: '15deg' }] },
  likeLabel: { color: '#4CAF50', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  nopeLabel: { color: '#F44336', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  infoButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }
});
