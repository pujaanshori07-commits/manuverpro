import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const RowItem = ({ label, isLast, onPress }: { label: string; isLast?: boolean; onPress?: () => void }) => (
    <TouchableOpacity
      style={[styles.rowItem, !isLast && styles.rowItemBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark" size={16} color={Colors.background} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Section 1: Community & Safety (No Title) */}
        <View style={styles.groupContainer}>
          <RowItem label="Community Guidelines" onPress={() => router.push('/settings/guidelines')} />
          <RowItem label="Safety Tips" />
          <RowItem label="Safety Center" isLast />
        </View>

        {/* Section 2: Privacy */}
        {renderSectionHeader('Privacy')}
        <View style={styles.groupContainer}>
          <RowItem label="Cookie Policy" />
          <RowItem label="Privacy Policy" onPress={() => router.push('/settings/privacy')} />
          <RowItem label="Privacy Preferences" />
          <RowItem label="From Manuver Group" isLast />
        </View>

        {/* Section 3: Legal */}
        {renderSectionHeader('Legal')}
        <View style={styles.groupContainer}>
          <RowItem label="Licenses" />
          <RowItem label="Terms of Service" onPress={() => router.push('/settings/terms')} isLast />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footerContainer}>
          <Ionicons name="flame" size={24} color={Colors.primary} style={{ marginBottom: 4 }} />
          <Text style={styles.versionText}>Version 1.0.4</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080A0F', // Keeping the dark theme to match app consistency
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  doneBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  doneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  groupContainer: {
    backgroundColor: '#11141C',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
  },
  rowItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#272C38',
  },
  rowLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  logoutButton: {
    backgroundColor: '#11141C',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  logoutText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  versionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
