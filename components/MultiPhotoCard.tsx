import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_WIDTH * 1.48;

interface MultiPhotoCardProps {
  photos: string[];
  name: string;
  age: number;
  location: string;
  distance: string;
  sports: string[];
  bio?: string;
  verified?: boolean;
}

export default function MultiPhotoCard({
  photos,
  name,
  age,
  location,
  distance,
  sports,
  bio,
  verified = true,
}: MultiPhotoCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNextPhoto = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Background Main Image */}
      <Image
        source={{ uri: photos[currentIndex] || photos[0] }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      {/* Top Overlay: Instagram Stories Progress Bars */}
      <View style={styles.storyIndicatorsContainer}>
        {photos.map((_, index) => {
          const isActive = index === currentIndex;
          const isPassed = index < currentIndex;
          return (
            <View key={`indicator-${index}`} style={styles.indicatorTrack}>
              <View
                style={[
                  styles.indicatorFill,
                  (isActive || isPassed) && styles.indicatorActive,
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Invisible Touch Zones (Left 50% & Right 50%) */}
      <View style={styles.touchZonesContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.touchZoneHalf}
          activeOpacity={1}
          onPress={handlePrevPhoto}
        />
        <TouchableOpacity
          style={styles.touchZoneHalf}
          activeOpacity={1}
          onPress={handleNextPhoto}
        />
      </View>

      {/* Bottom Gradient Fade */}
      <LinearGradient
        colors={['transparent', 'rgba(11, 13, 18, 0.45)', 'rgba(11, 13, 18, 0.98)']}
        locations={[0, 0.45, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Profile Details Overlay */}
      <View style={styles.infoContainer} pointerEvents="none">
        {/* Name & Age Row */}
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{name}, {age}</Text>
          {verified && (
            <Ionicons name="checkmark-circle" size={20} color="#FF5A1F" style={styles.verifiedIcon} />
          )}
        </View>

        {/* Location & Distance */}
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={14} color="#FF5A1F" />
          <Text style={styles.locationText}>
            {location} • <Text style={styles.distanceHighlight}>{distance}</Text>
          </Text>
        </View>

        {/* Sport Pills */}
        <View style={styles.sportsRow}>
          {sports.map((sport, idx) => (
            <View key={`sport-${idx}`} style={styles.sportPill}>
              <Text style={styles.sportPillText}>{sport}</Text>
            </View>
          ))}
        </View>

        {/* Optional Bio */}
        {bio ? (
          <Text style={styles.bioText} numberOfLines={2}>
            {bio}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH - 24,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: '#1A1D24',
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  storyIndicatorsContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 20,
  },
  indicatorTrack: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },
  indicatorFill: {
    height: '100%',
    width: '100%',
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
  },
  touchZonesContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
  },
  touchZoneHalf: {
    flex: 1,
    height: '70%', // Leaves lower portion for gestures/scrolling
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.58,
    zIndex: 15,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 22,
    zIndex: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8F94A6',
  },
  distanceHighlight: {
    color: '#E0E3EB',
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  sportPill: {
    backgroundColor: 'rgba(255, 90, 31, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.4)',
  },
  sportPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8F94A6',
    marginTop: 2,
  },
});
