import React from 'react';
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

interface BrandLogoProps {
  variant?: 'full' | 'mark';
  size?: number;
  style?: ViewStyle;
}

export default function BrandLogo({
  variant = 'full',
  size = 72,
  style,
}: BrandLogoProps) {
  if (variant === 'mark') {
    // Compact mark for top navigation bars (e.g. 32x32)
    return (
      <View style={[styles.markContainer, { width: size, height: size }, style]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={[styles.markImage, { width: size * 1.4, height: size * 1.4 }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Full lockup for Onboarding / Welcome / Auth screens
  return (
    <View style={[styles.fullContainer, style]}>
      <Image
        source={require('../assets/images/logo.png')}
        style={[styles.fullImage, { width: size * 1.8, height: size * 1.8 }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  markContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markImage: {
    // Centers the upper emblem mark
    transform: [{ translateY: -4 }],
  },
  fullContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    maxHeight: 180,
  },
});
