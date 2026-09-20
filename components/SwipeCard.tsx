import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolation } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;

export interface SwipeCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  swipeUp: () => void;
}

interface SwipeCardProps {
  onSwipedLeft: () => void;
  onSwipedRight: () => void;
  onSwipedUp?: () => void;
  children: React.ReactNode;
}

const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(({ onSwipedLeft, onSwipedRight, onSwipedUp, children }, ref) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const swipeLeft = () => {
    translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
      runOnJS(onSwipedLeft)();
    });
  };

  const swipeRight = () => {
    translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
      runOnJS(onSwipedRight)();
    });
  };

  const swipeUp = () => {
    translateY.value = withTiming(-SCREEN_HEIGHT * 1.5, { duration: 300 }, () => {
      if (onSwipedUp) runOnJS(onSwipedUp)();
    });
  };

  useImperativeHandle(ref, () => ({
    swipeLeft,
    swipeRight,
    swipeUp,
  }));

  // Horizontal pan gesture with vertical scroll allowance
  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.15;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(swipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(swipeLeft)();
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2], [-8, 0, 8], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` }
      ]
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP)
  }));
  
  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -20], [1, 0], Extrapolation.CLAMP)
  }));

  const superLikeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-20, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP)
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {children}
        
        {/* Overlays that sit ON TOP of the children */}
        <Animated.View style={[styles.labelContainer, styles.likeLabelContainer, likeOpacity]} pointerEvents="none">
          <Text style={styles.likeLabel}>MANUVER!</Text>
        </Animated.View>
        <Animated.View style={[styles.labelContainer, styles.nopeLabelContainer, nopeOpacity]} pointerEvents="none">
          <Text style={styles.nopeLabel}>PASS</Text>
        </Animated.View>
        <Animated.View style={[styles.labelContainer, styles.superLikeLabelContainer, superLikeOpacity]} pointerEvents="none">
          <Text style={styles.superLikeLabel}>SUPER</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

export default SwipeCard;

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#1C1F26',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  labelContainer: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 100, // Make sure it sits above the children
  },
  likeLabelContainer: {
    left: 30,
    borderColor: '#4CAF50',
    transform: [{ rotate: '-15deg' }],
  },
  nopeLabelContainer: {
    right: 30,
    borderColor: '#F44336',
    transform: [{ rotate: '15deg' }],
  },
  likeLabel: {
    color: '#4CAF50',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  nopeLabel: {
    color: '#F44336',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  superLikeLabelContainer: {
    top: 'auto',
    bottom: 80,
    alignSelf: 'center',
    borderColor: '#2196F3',
    transform: [{ rotate: '-10deg' }],
  },
  superLikeLabel: {
    color: '#2196F3',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  }
});
