import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_PHOTO_HEIGHT = Math.round((SCREEN_WIDTH - 20) * 1.25);
const SECOND_PHOTO_HEIGHT = Math.round((SCREEN_WIDTH - 20) * 1.15);

import { Profile } from '../types/database';

interface Props {
  profile: Profile;
  onExpandPress?: () => void;
}

export default function ProfileCardSummary({ profile, onExpandPress }: Props) {
  const getSportIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('basket')) return 'basketball';
    if (lower.includes('bola') || lower.includes('futsal')) return 'football';
    if (lower.includes('sepeda')) return 'bicycle';
    if (lower.includes('lari')) return 'walk';
    if (lower.includes('tenis')) return 'tennisball';
    return 'fitness';
  };

  const getInterestIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const lower = name.toLowerCase();
    if (lower.includes('music') || lower.includes('musik')) return 'musical-notes';
    if (lower.includes('travel') || lower.includes('jalan')) return 'airplane';
    if (lower.includes('food') || lower.includes('makan')) return 'restaurant';
    if (lower.includes('movie') || lower.includes('film')) return 'film';
    return 'star';
  };

  return (
    <ScrollView
      style={styles.profileScrollView}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {/* BLOCK 1 (Hero Photo) */}
      <View style={styles.heroPhotoWrapper}>
        <Image
          source={{ uri: profile.photos?.[0] || profile.foto_url }}
          style={styles.heroPhoto}
          resizeMode="cover"
        />

        <View style={styles.categoryBadgeWrapper}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>LOOKING FOR PARTNER</Text>
          </View>
        </View>

        {/* INFO BUTTON */}
        <TouchableOpacity style={styles.infoButton} onPress={onExpandPress} activeOpacity={0.8}>
          <Ionicons name="information-circle" size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <LinearGradient
          colors={['transparent', 'rgba(15, 17, 23, 0.4)', 'rgba(15, 17, 23, 0.95)', '#0F1117']}
          locations={[0, 0.6, 0.9, 1]}
          style={styles.heroOverlayGradient}
        >
          <View style={styles.photoVerifiedPill}>
            <Ionicons name="shield-checkmark" size={14} color="#00C48C" />
            <Text style={styles.photoVerifiedText}>Photo Verified</Text>
          </View>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroProfileName}>
              {profile.nama}{profile.age ? `, ${profile.age}` : ''}
            </Text>
            <View style={styles.verifiedCheck}>
              <Ionicons name="checkmark-sharp" size={12} color="#0B0D13" />
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.profileDetailsBody}>
        {/* BLOCK 2 */}
        <View style={styles.bumbleCardBlock}>
          <View style={styles.locationLeadRow}>
            <View style={styles.locationIconCircle}>
              <Ionicons name="location" size={18} color="#FF5A1F" />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationPrimaryText}>
                {profile.alamat || 'Lokasi tidak diketahui'}
              </Text>
                  <Text style={styles.locationSecondaryText}>
                    {profile.distance !== undefined ? `${profile.distance} km away` : 'Jarak tidak diketahui'}
                  </Text>
            </View>
          </View>
          <Text style={styles.bumbleCardLabel}>Olahraga Utama</Text>
          <View style={styles.quickSportsRow}>
                  {(profile.hobi ? (typeof profile.hobi === 'string' ? profile.hobi.split(',') : profile.hobi) : ['Basket', 'Lari']).map((sport: string, idx: number) => (
                    <View key={idx} style={styles.sportBadgePill}>
                      <Ionicons name={getSportIcon(sport.trim())} size={14} color="#FF5A1F" />
                      <Text style={styles.sportBadgeText}>{sport.trim()}</Text>
                    </View>
                  ))}
          </View>
        </View>

        {/* BLOCK 3 */}
        <View style={styles.bumbleCardBlock}>
          <Text style={styles.bumbleCardLabel}>
            {profile.prompt_question || 'Sports Prompt'}
          </Text>
          <Text style={styles.promptAnswerText}>
            "{profile.prompt_answer || profile.bio || 'Mencari partner sparring yang sportif dan seru.'}"
          </Text>
          {profile.bio && profile.prompt_answer ? (
            <View style={styles.bioSubSection}>
              <View style={styles.bioSubDivider} />
              <Text style={styles.bioSubHeading}>About me</Text>
              <Text style={styles.bioSubText}>{profile.bio}</Text>
            </View>
          ) : null}
        </View>

        {/* BLOCK 4 */}
        {profile.photos && profile.photos[1] && (
          <View style={styles.storyPhotoWrapper}>
            <Image
              source={{ uri: profile.photos[1] }}
              style={styles.storyPhotoImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(15, 17, 23, 0.85)']}
              style={styles.photoCaptionGradient}
            >
              <Text style={styles.photoCaptionText}>
                💡 Sering latihan di: {profile.alamat || 'Senayan'}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* BLOCK 5 */}
        <View style={styles.bumbleCardBlock}>
          <Text style={styles.bumbleCardLabel}>Cabang & Jadwal Spar</Text>
          <View style={styles.matrixRow}>
            <View style={styles.matrixColumn}>
              <Text style={styles.matrixLabel}>Skill Level</Text>
              <View style={styles.matrixBadge}>
                <Ionicons name="trophy-outline" size={14} color="#FF5A1F" />
                <Text style={styles.matrixBadgeText}>
                  {profile.skill_level || 'Intermediate'}
                </Text>
              </View>
            </View>
            <View style={styles.matrixColumn}>
              <Text style={styles.matrixLabel}>Maks. Jarak</Text>
              <View style={styles.matrixBadge}>
                <Ionicons name="navigate-outline" size={14} color="#FF5A1F" />
                <Text style={styles.matrixBadgeText}>
                  {profile.distance_pref || '📍 10 km'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.matrixLabel, { marginTop: 12, marginBottom: 8 }]}>
            Waktu Bermain Tersedia
          </Text>
          <View style={styles.pillsRow}>
            {(profile.availability || ['Pagi', 'Sore', 'Akhir Pekan']).map((time, idx) => (
              <View key={idx} style={styles.detailPill}>
                <Ionicons name="time-outline" size={13} color="#FF5A1F" />
                <Text style={styles.detailPillText}>{time}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Minat & Lifestyle */}
        <View style={styles.bumbleCardBlock}>
          <Text style={styles.bumbleCardLabel}>Minat & Lifestyle</Text>
          <View style={styles.pillsRow}>
            {(profile.interests || ['Health', 'Travel', 'Music', 'Food']).map((interest, idx) => (
              <View key={idx} style={styles.interestPill}>
                <Ionicons name={getInterestIcon(interest)} size={14} color="#9EA3B0" />
                <Text style={styles.interestPillText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 210,
  },
  heroPhotoWrapper: {
    width: '100%',
    height: HERO_PHOTO_HEIGHT,
    position: 'relative',
    backgroundColor: '#171A21',
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
  },
  categoryBadgeWrapper: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  categoryBadge: {
    backgroundColor: '#00C48C',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontFamily: Typography.fontHeading,
    fontSize: 10,
    fontWeight: '800',
    color: '#0B0D13',
    letterSpacing: 0.5,
  },
  infoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  },
  heroOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: 16,
    paddingTop: 40,
    justifyContent: 'flex-end',
  },
  photoVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 17, 23, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 8,
  },
  photoVerifiedText: {
    fontFamily: Typography.fontMedium,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroProfileName: {
    fontFamily: Typography.fontHeading,
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00C48C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetailsBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#0F1117',
  },
  bumbleCardBlock: {
    backgroundColor: '#161922',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bumbleCardLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 12,
    color: '#8E94A4',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    fontWeight: '700',
  },
  locationLeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextCol: {
    flex: 1,
  },
  locationPrimaryText: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locationSecondaryText: {
    fontFamily: Typography.fontRegular,
    fontSize: 12,
    color: '#8A8F9E',
    marginTop: 2,
  },
  quickSportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 90, 31, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.35)',
  },
  sportBadgeText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  promptAnswerText: {
    fontFamily: Typography.fontHeading,
    fontSize: 17,
    lineHeight: 25,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  bioSubSection: {
    marginTop: 14,
  },
  bioSubDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  bioSubHeading: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 11,
    color: '#8E94A4',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  bioSubText: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    lineHeight: 20,
    color: '#C2C6D2',
  },
  storyPhotoWrapper: {
    width: '100%',
    height: SECOND_PHOTO_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#171A21',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  storyPhotoImage: {
    width: '100%',
    height: '100%',
  },
  photoCaptionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  photoCaptionText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  matrixRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  matrixColumn: {
    flex: 1,
  },
  matrixLabel: {
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    color: '#8A8F9E',
    marginBottom: 6,
  },
  matrixBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  matrixBadgeText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#E1E4EA',
    fontWeight: '500',
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  interestPillText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: '#E1E4EA',
    fontWeight: '500',
  }
});
