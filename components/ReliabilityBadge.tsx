import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReliabilityBadgeProps {
  score: number; // 0 to 100
}

export default function ReliabilityBadge({ score }: ReliabilityBadgeProps) {
  const isHighReliability = score >= 90;
  const isModerate = score >= 70 && score < 90;
  const isLowReliability = score < 70;

  if (isHighReliability) {
    return (
      <View style={[styles.badgeBase, styles.highBadge]}>
        <Ionicons name="flame" size={13} color="#FF9F0A" />
        <Text style={[styles.badgeText, styles.highText]}>
          {score}% Reliable
        </Text>
      </View>
    );
  }

  if (isModerate) {
    return (
      <View style={[styles.badgeBase, styles.moderateBadge]}>
        <Ionicons name="checkmark-circle-outline" size={13} color="#8F94A6" />
        <Text style={[styles.badgeText, styles.moderateText]}>
          {score}% Kehadiran
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badgeBase, styles.lowBadge]}>
      <Ionicons name="warning-outline" size={13} color="#EF4444" />
      <Text style={[styles.badgeText, styles.lowText]}>
        Sering Batal ({score}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  highBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.1)',
    borderColor: 'rgba(255, 159, 10, 0.35)',
  },
  highText: {
    color: '#4ADE80',
  },
  moderateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moderateText: {
    color: '#8F94A6',
  },
  lowBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  lowText: {
    color: '#EF4444',
  },
});
