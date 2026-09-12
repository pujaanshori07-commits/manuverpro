import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Linking, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS, SIZES } from '../../constants/DesignSystem';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    push: true,
    matches: true,
    messages: true,
    promotions: false
  });

  const toggleSwitch = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContactUs = () => {
    router.push('/settings/contact' as any);
  };

  const handleLink = (path: string) => {
    router.push(path as any);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await (supabase.auth as any).signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    router.push('/settings/delete-account' as any);
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderToggleRow = (icon: any, title: string, description: string, key: keyof typeof notifications) => (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={'#ffffff'}
        ios_backgroundColor={COLORS.border}
        onValueChange={() => toggleSwitch(key)}
        value={notifications[key]}
      />
    </View>
  );

  const renderLinkRow = (icon: any, title: string, onPress: () => void, isDestructive = false) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={22} color={isDestructive ? COLORS.error : COLORS.secondaryText} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, isDestructive && { color: COLORS.error }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* NOTIFICATIONS */}
        {renderSectionHeader('NOTIFICATIONS')}
        <View style={styles.section}>
          {renderToggleRow('notifications', 'Push Notifications', 'Enable all notifications', 'push')}
          {renderToggleRow('heart', 'New Matches', 'When someone wants to play', 'matches')}
          {renderToggleRow('chatbubbles', 'Messages', 'When you receive a new message', 'messages')}
        </View>

        {/* SUPPORT */}
        {renderSectionHeader('SUPPORT & HELP')}
        <View style={styles.section}>
          {renderLinkRow('mail', 'Contact Us', handleContactUs)}
          {renderLinkRow('help-circle', 'Help Center / FAQ', () => handleLink('/settings/help'))}
        </View>

        {/* COMMUNITY */}
        {renderSectionHeader('COMMUNITY')}
        <View style={styles.section}>
          {renderLinkRow('people', 'Community Guidelines', () => handleLink('/settings/guidelines'))}
          {renderLinkRow('shield-checkmark', 'Safety Tips', () => handleLink('/settings/safety'))}
        </View>

        {/* LEGAL */}
        {renderSectionHeader('LEGAL')}
        <View style={styles.section}>
          {renderLinkRow('document-text', 'Privacy Policy', () => handleLink('/settings/privacy'))}
          {renderLinkRow('document', 'Terms of Service', () => handleLink('/settings/terms'))}
        </View>

        {/* ACCOUNT */}
        {renderSectionHeader('ACCOUNT')}
        <View style={styles.section}>
          {renderLinkRow('log-out', 'Logout', handleLogout)}
        </View>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount} activeOpacity={0.6}>
          <Ionicons name="trash-outline" size={16} color={COLORS.secondaryText} style={{ marginRight: 6 }} />
          <Text style={styles.deleteAccountText}>Hapus Akun</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>MANUVER Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  
  sectionHeader: {
    color: COLORS.secondaryText,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 20,
    paddingLeft: 4,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowIcon: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  rowDesc: {
    color: COLORS.secondaryText,
    fontSize: 12,
    marginTop: 2,
  },
  versionText: {
    color: COLORS.secondaryText,
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 40,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  deleteAccountText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  }
});
