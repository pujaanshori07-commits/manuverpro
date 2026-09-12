import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_layout';
import { COLORS, SIZES } from '../../constants/DesignSystem';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProfileDashboardScreen() {
  const { profile } = useAuth();
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          {/* Settings moved to Home tab per user request */}
        </View>

        {/* PROFILE INFO */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.foto_url ? (
              <Image source={{ uri: profile.foto_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {profile?.nama ? profile.nama.substring(0, 2).toUpperCase() : '??'}
                </Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            </View>
          </View>

          <Text style={styles.nameText}>{profile?.nama || 'Athlete'}</Text>
          <Text style={styles.locationText}>{profile?.alamat || 'Update your location'}</Text>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile} activeOpacity={0.8}>
            <Text style={styles.editButtonText}>EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        {/* METRICS & FEATURES */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(255, 87, 47, 0.1)' }]}>
              <Ionicons name="flash" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.metricValue}>0</Text>
            <Text style={styles.metricLabel}>Matches</Text>
          </View>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(0, 200, 83, 0.1)' }]}>
              <Ionicons name="calendar" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.metricValue}>0</Text>
            <Text style={styles.metricLabel}>Games Played</Text>
          </View>
        </View>

        {/* PROMO BANNER (Tinder Gold Style) */}
        <TouchableOpacity style={styles.promoBanner} activeOpacity={0.9}>
          <LinearGradient
            colors={['#2A2E38', '#1C1F26']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoGradient}
          >
            <View style={styles.promoHeader}>
              <Text style={styles.promoTitle}>MANUVER <Text style={{ color: '#FFD700' }}>PRO</Text></Text>
              <View style={styles.promoUpgradeBtn}>
                <Text style={styles.promoUpgradeText}>UPGRADE</Text>
              </View>
            </View>
            
            <View style={styles.promoFeatures}>
              <View style={styles.promoFeatureRow}>
                <Text style={styles.promoFeatureText}>See Who Wants To Play</Text>
                <Ionicons name="lock-closed" size={16} color={COLORS.secondaryText} />
              </View>
              <View style={styles.promoFeatureRow}>
                <Text style={styles.promoFeatureText}>Unlimited Matches</Text>
                <Ionicons name="lock-closed" size={16} color={COLORS.secondaryText} />
              </View>
            </View>
            <Text style={styles.promoFooter}>See All Features</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerSpacer: { width: 44, height: 44 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  avatarPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  avatarPlaceholderText: {
    color: COLORS.text,
    fontSize: 48,
    fontWeight: 'bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  nameText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  metricCard: {
    width: (width - 56) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricLabel: {
    color: COLORS.secondaryText,
    fontSize: 12,
    fontWeight: '600',
  },

  promoBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  promoGradient: {
    padding: 20,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  promoTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  promoUpgradeBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  promoUpgradeText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },
  promoFeatures: {
    marginBottom: 20,
  },
  promoFeatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoFeatureText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  promoFooter: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'underline',
  }
});
