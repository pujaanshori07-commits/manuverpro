import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MatchExpiryAvatarProps {
  avatarUrl: string;
  name: string;
  hoursRemaining: number;
  onPress?: () => void;
}

export default function MatchExpiryAvatar({
  avatarUrl,
  name,
  hoursRemaining,
  onPress,
}: MatchExpiryAvatarProps) {
  const isExpiringSoon = hoursRemaining <= 12;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.82}
      onPress={onPress}
    >
      <View style={styles.avatarWrapper}>
        {/* Countdown Ring Gradient */}
        <LinearGradient
          colors={isExpiringSoon ? ['#FF3B30', '#FF5A1F'] : ['#FF5A1F', '#FF9F0A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        >
          {/* Dark border gap between ring and avatar */}
          <View style={styles.avatarGap}>
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          </View>
        </LinearGradient>

        {/* Urgency Pill Badge */}
        <View
          style={[
            styles.urgencyBadge,
            isExpiringSoon ? styles.badgeExpiring : styles.badgeNormal,
          ]}
        >
          <Text style={styles.urgencyText}>
            {isExpiringSoon ? 'Expiring!' : `${hoursRemaining}h`}
          </Text>
        </View>
      </View>

      <Text style={styles.userName} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 76,
    marginRight: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 6,
  },
  gradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGap: {
    width: 63,
    height: 63,
    borderRadius: 31.5,
    backgroundColor: '#0B0D12',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 59,
    height: 59,
    borderRadius: 29.5,
  },
  urgencyBadge: {
    position: 'absolute',
    bottom: -3,
    alignSelf: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#0B0D12',
  },
  badgeNormal: {
    backgroundColor: '#FF5A1F',
  },
  badgeExpiring: {
    backgroundColor: '#FF3B30',
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
