import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, TYPOGRAPHY } from '../constants/DesignSystem';
import { FREQUENCY_OPTIONS, PREFERRED_TIME_OPTIONS, SPORT_ROLE_OPTIONS } from '../constants/ProfileOptions';
import PhotoCarousel from './PhotoCarousel';

const { width, height } = Dimensions.get('window');

type Profile = {
  id: string;
  nama: string;
  foto_url: string | null;
  alamat: string | null;
  bio: string | null;
  skill_level?: string;
  availability?: string;
  looking_for?: string;
  overall_frequency?: string | null;
  preferred_time?: string | null;
  home_venue?: string | null;
  height_cm?: number | null;
  domisili?: string | null;
  sport_role?: string | null;
  user_sports?: { sports: { nama: string; icon?: string } }[];
  photos?: string[];
  prompts?: { question_text: string; answer_text: string }[];
  distance_km?: number;
  distance?: number;
  last_active?: string;
  profile_completeness?: number;
  match_score?: number;
  match_percentage?: number;
};

type Props = {
  visible: boolean;
  profile: Profile | null;
  onClose: () => void;
  onSwipeAction: (action: 'left' | 'right' | 'up') => void;
};

export default function ProfileBottomSheet({ visible, profile, onClose, onSwipeAction }: Props) {
  if (!profile) return null;

  const matchPercentage = profile.match_percentage !== undefined
    ? profile.match_percentage
    : (profile.match_score ? Math.round(Math.min(profile.match_score / 130 * 100, 100)) : 0);

  const allPhotos: string[] = profile.photos && profile.photos.length > 0 
    ? profile.photos 
    : (profile.foto_url ? [profile.foto_url] : []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Photo Carousel Header if available */}
            {allPhotos.length > 0 && (
              <View style={styles.photoContainer}>
                <PhotoCarousel photos={allPhotos} />
              </View>
            )}

            {/* Header: Name, Verified Badge, Match Score, Close Button */}
            <View style={styles.sheetHeader}>
              <View style={styles.nameBadgesRow}>
                <Text style={styles.sheetNameText}>{profile.nama}</Text>
                
                {profile.profile_completeness !== undefined && profile.profile_completeness >= 80 && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={22} color="#4A90D9" />
                  </View>
                )}

                {matchPercentage >= 60 && (
                  <View style={styles.compatibilityBadge}>
                    <Ionicons name="sparkles" size={13} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.compatibilityText}>{matchPercentage}% Match</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-down-circle" size={36} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Location & Quick Pills */}
            <View style={styles.tagsContainer}>
              {(profile.domisili || profile.alamat) && (
                <View style={styles.bumblePill}>
                  <Ionicons name="location-sharp" size={13} color="#000" style={{ marginRight: 4 }} />
                  <Text style={styles.bumblePillText}>{profile.domisili || profile.alamat}</Text>
                  {(profile.distance_km !== undefined || profile.distance !== undefined) && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>
                        {(profile.distance_km ?? profile.distance!) < 1 ? '< 1 KM' : `${Math.round(profile.distance_km ?? profile.distance!)} KM`}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {profile.height_cm ? (
                <View style={styles.bumblePill}>
                  <Ionicons name="resize-outline" size={13} color="#000" style={{ marginRight: 4 }} />
                  <Text style={styles.bumblePillText}>{profile.height_cm} cm</Text>
                </View>
              ) : null}

              {profile.sport_role ? (
                <View style={styles.bumblePill}>
                  <Ionicons name="ribbon-outline" size={13} color="#000" style={{ marginRight: 4 }} />
                  <Text style={styles.bumblePillText}>
                    {SPORT_ROLE_OPTIONS.find(r => r.value === profile.sport_role)?.label || profile.sport_role}
                  </Text>
                </View>
              ) : null}

              {!!profile.skill_level && (
                <View style={styles.bumblePill}>
                  <Text style={styles.bumblePillText}>{profile.skill_level}</Text>
                </View>
              )}
            </View>

            <View style={styles.contentPadding}>

            {/* Bio Section */}
            {!!profile.bio && (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>About Me</Text>
                <Text style={styles.sheetBioText}>"{profile.bio}"</Text>
              </View>
            )}

            {/* Favorite Sports Grid */}
            {profile.user_sports && profile.user_sports.length > 0 && (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Favorite Sports</Text>
                <View style={styles.sheetSportsGrid}>
                  {profile.user_sports.map((us, idx) => (
                    <View key={idx} style={styles.sheetSportCard}>
                      <Text style={styles.sheetSportIcon}>{us.sports?.icon || '🏅'}</Text>
                      <Text style={styles.sheetSportName}>{us.sports?.nama}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Prompts Q&A Cards */}
            {profile.prompts && profile.prompts.length > 0 && (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Prompts</Text>
                {profile.prompts.map((p, idx) => (
                  <View key={idx} style={styles.promptDisplayCard}>
                    <Text style={styles.promptQuestionDisplay}>{p.question_text}</Text>
                    <Text style={styles.promptAnswerDisplay}>"{p.answer_text}"</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Activity Preferences */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>Activity Preferences</Text>
              <View style={styles.sheetAttributesList}>
                {profile.overall_frequency && (
                  <View style={styles.sheetAttributeRow}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.sheetAttributeText}>
                      Plays: <Text style={styles.sheetAttributeValue}>{FREQUENCY_OPTIONS.find(f => f.value === profile.overall_frequency)?.label || profile.overall_frequency}</Text>
                    </Text>
                  </View>
                )}
                {profile.preferred_time && (
                  <View style={styles.sheetAttributeRow}>
                    <Ionicons name="time-outline" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.sheetAttributeText}>
                      Prefers: <Text style={styles.sheetAttributeValue}>{PREFERRED_TIME_OPTIONS.find(t => t.value === profile.preferred_time)?.label || profile.preferred_time}</Text>
                    </Text>
                  </View>
                )}
                {profile.home_venue && (
                  <View style={styles.sheetAttributeRow}>
                    <Ionicons name="location-outline" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.sheetAttributeText}>
                      Home Court: <Text style={styles.sheetAttributeValue}>{profile.home_venue}</Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Actions inside Sheet (Pass, Super Like, Like) */}
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity 
                style={[styles.sheetActionBtn, { backgroundColor: '#FF4444' }]} 
                onPress={() => onSwipeAction('left')}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#FFF" />
                <Text style={styles.sheetActionBtnText}>Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sheetActionBtn, { backgroundColor: '#00D2FF' }]} 
                onPress={() => onSwipeAction('up')}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={22} color="#FFF" />
                <Text style={styles.sheetActionBtnText}>Super Like</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sheetActionBtn, { backgroundColor: '#00E676' }]} 
                onPress={() => onSwipeAction('right')}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={24} color="#FFF" />
                <Text style={styles.sheetActionBtnText}>Like</Text>
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
  },
  photoContainer: {
    width: '100%',
    height: height * 0.5,
    backgroundColor: COLORS.elevatedSurface,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  nameBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    gap: 6,
  },
  sheetNameText: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  verifiedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compatibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  compatibilityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sheetCloseBtn: {
    padding: 2,
    marginLeft: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  contentPadding: {
    paddingHorizontal: 20,
  },
  bumblePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  bumblePillText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  distanceBadge: {
    backgroundColor: 'rgba(255, 90, 42, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sheetSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  sheetSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sheetBioText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  sheetSportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sheetSportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.elevatedSurface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetSportIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sheetSportName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  promptDisplayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginBottom: 10,
  },
  promptQuestionDisplay: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  promptAnswerDisplay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  sheetAttributesList: {
    gap: 10,
  },
  sheetAttributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.elevatedSurface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  sheetAttributeText: {
    fontSize: 14,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  sheetAttributeValue: {
    color: COLORS.text,
    fontWeight: '700',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 26,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  sheetActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    gap: 6,
  },
  sheetActionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
