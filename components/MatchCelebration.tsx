import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/DesignSystem';

const particles = Array.from({ length: 12 }, (_, i) => i);

function ConfettiParticle({ index }: { index: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  useEffect(() => {
    const angle = (index / 12) * Math.PI * 2;
    const distance = 100 + Math.random() * 50;
    
    translateX.value = withTiming(Math.cos(angle) * distance, { duration: 800 });
    translateY.value = withTiming(Math.sin(angle) * distance, { duration: 800 });
    opacity.value = withDelay(400, withTiming(0, { duration: 400 }));
  }, [index]);
  
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={[styles.particle, style]} />
  );
}

function ConfettiBurst() {
  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]} pointerEvents="none">
      {particles.map((i) => (
        <ConfettiParticle key={i} index={i} />
      ))}
    </View>
  );
}

type MatchData = {
  nama: string;
  foto_url: string | null;
  matchId: string;
};

type Props = {
  visible: boolean;
  matchData: MatchData | null;
  myAvatarUrl: string | null;
  onClose: () => void;
};

export default function MatchCelebration({ visible, matchData, myAvatarUrl, onClose }: Props) {
  const router = useRouter();
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      opacity.value = withDelay(300, withSpring(1));
    }
  }, [visible]);

  const rAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: opacity.value === 1 ? 0 : 20 }], // simple slide up
  }));

  if (!matchData) return null;

  const handleSendMessage = () => {
    onClose();
    router.push(`/chat/${matchData.matchId}` as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {visible && <ConfettiBurst />}
        <Animated.View style={[styles.avatarContainer, rAvatarStyle]}>
          {myAvatarUrl ? (
            <Image source={{ uri: myAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
               <Ionicons name="person" size={40} color={COLORS.secondaryText} />
            </View>
          )}
          
          <View style={styles.flashIconContainer}>
            <Ionicons name="flash" size={32} color={COLORS.background} />
          </View>
          
          {matchData.foto_url ? (
            <Image source={{ uri: matchData.foto_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholder]}>
               <Ionicons name="person" size={40} color={COLORS.secondaryText} />
            </View>
          )}
        </Animated.View>

        <Animated.View style={[styles.contentContainer, rContentStyle]}>
          <Text style={styles.title}>IT'S A MATCH</Text>
          <Text style={styles.subtitle}>Looks like you both want to play.</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSendMessage}>
            <Text style={styles.primaryBtnText}>Send a Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
            <Text style={styles.secondaryBtnText}>Keep Discovering</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 10, 13, 0.95)', // Almost solid dark background
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxxl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  placeholder: {
    backgroundColor: COLORS.elevatedSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -20,
    zIndex: 10,
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.secondaryText,
    fontSize: TYPOGRAPHY.h3.fontSize,
    textAlign: 'center',
    marginBottom: SPACING.xxxxl,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 60,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  primaryBtnText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: '800',
    letterSpacing: 1,
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  }
});
