import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS } from '../constants/DesignSystem';

type Props = {
  photos: string[];
};

export default function PhotoCarousel({ photos }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const hasPhotos = photos && photos.length > 0;
  const currentPhoto = hasPhotos ? photos[currentIndex] : null;

  const goNext = () => {
    if (hasPhotos && currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setImgError(false);
    }
  };

  const goPrev = () => {
    if (hasPhotos && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setImgError(false);
    }
  };

  if (!hasPhotos) {
    return (
      <View style={styles.placeholderContainer}>
        <LinearGradient colors={[COLORS.elevatedSurface, COLORS.surface]} style={StyleSheet.absoluteFill} />
        <Ionicons name="person" size={100} color={COLORS.border} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Image */}
      {imgError ? (
        <View style={styles.placeholderContainer}>
           <Ionicons name="image-outline" size={60} color={COLORS.secondaryText} />
        </View>
      ) : (
        <Image 
          source={{ uri: currentPhoto! }} 
          style={styles.image} 
          onError={() => setImgError(true)}
        />
      )}

      {/* Top Dot Indicators */}
      {photos.length > 1 && (
        <View style={styles.dotsContainer}>
          {photos.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                index === currentIndex ? styles.dotActive : styles.dotInactive
              ]} 
            />
          ))}
        </View>
      )}

      {/* Tap Zones */}
      {photos.length > 1 && (
        <>
          <Pressable style={styles.leftTapZone} onPress={goPrev} />
          <Pressable style={styles.rightTapZone} onPress={goNext} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  dotsContainer: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.xs,
    zIndex: 10,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  leftTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '33%',
    zIndex: 5,
  },
  rightTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '33%',
    zIndex: 5,
  },
});
