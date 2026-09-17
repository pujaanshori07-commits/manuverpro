import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { COLORS } from '../constants/DesignSystem';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export default function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const [opacity] = React.useState(() => new Animated.Value(0.3));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: COLORS.surface,
          opacity,
        },
        style,
      ]}
    />
  );
}
