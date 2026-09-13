import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState({
    push: true,
    matches: true,
    messages: true,
  });

  const [privacy, setPrivacy] = useState({
    ghostMode: false,
    showDistance: true,
  });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    Alert.alert('Keluar Akun', 'Apakah kamu yakin ingin keluar dari MANUVER?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    router.push('/settings/delete-account');
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0D" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* 1. ACCOUNT */}
        {renderSectionHeader('AKUN')}
        <View style={styles.groupContainer}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(255, 87, 47, 0.15)' }]}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.rowLabel}>Edit Profil</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => router.push('/settings/filters')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(0, 196, 140, 0.15)' }]}>
                <Ionicons name="options-outline" size={18} color="#00C48C" />
              </View>
              <Text style={styles.rowLabel}>Preferensi Pencarian & Jarak</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 2. NOTIFICATIONS */}
        {renderSectionHeader('NOTIFIKASI')}
        <View style={styles.groupContainer}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
                <Ionicons name="notifications-outline" size={18} color={Colors.warning} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Notifikasi Sparing & Match</Text>
                <Text style={styles.rowSubLabel}>Kabar saat ada ajakan main baru</Text>
              </View>
            </View>
            <Switch
              value={notifications.matches}
              onValueChange={() => toggleNotif('matches')}
              trackColor={{ false: '#262933', true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(0, 200, 255, 0.15)' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#00C8FF" />
              </View>
              <View>
                <Text style={styles.rowLabel}>Pesan Masuk</Text>
                <Text style={styles.rowSubLabel}>Notifikasi saat partner chat</Text>
              </View>
            </View>
            <Switch
              value={notifications.messages}
              onValueChange={() => toggleNotif('messages')}
              trackColor={{ false: '#262933', true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* 3. PRIVACY & SECURITY */}
        {renderSectionHeader('PRIVASI & KEAMANAN')}
        <View style={styles.groupContainer}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(142, 68, 173, 0.15)' }]}>
                <Ionicons name="eye-off-outline" size={18} color="#A569BD" />
              </View>
              <View>
                <Text style={styles.rowLabel}>Ghost Mode</Text>
                <Text style={styles.rowSubLabel}>Sembunyikan profil dari Discover</Text>
              </View>
            </View>
            <Switch
              value={privacy.ghostMode}
              onValueChange={() => togglePrivacy('ghostMode')}
              trackColor={{ false: '#262933', true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => router.push('/settings/privacy')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#3498DB" />
              </View>
              <Text style={styles.rowLabel}>Kebijakan Privasi</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 4. SUPPORT */}
        {renderSectionHeader('BANTUAN & DUKUNGAN')}
        <View style={styles.groupContainer}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => router.push('/settings/contact')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <Ionicons name="mail-outline" size={18} color={Colors.white} />
              </View>
              <Text style={styles.rowLabel}>Hubungi Tim MANUVER</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => router.push('/settings/guidelines')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <Ionicons name="book-outline" size={18} color={Colors.white} />
              </View>
              <Text style={styles.rowLabel}>Pedoman Komunitas & Keamanan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 5. LEGAL */}
        {renderSectionHeader('LEGAL')}
        <View style={styles.groupContainer}>
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => router.push('/settings/terms')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <Ionicons name="document-text-outline" size={18} color={Colors.white} />
              </View>
              <Text style={styles.rowLabel}>Syarat & Ketentuan Layanan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 6. ACCOUNT ACTIONS */}
        {renderSectionHeader('TINDAKAN AKUN')}
        <View style={styles.groupContainer}>
          <TouchableOpacity style={styles.rowItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                <Ionicons name="log-out-outline" size={18} color={Colors.white} />
              </View>
              <Text style={styles.rowLabel}>Keluar Akun</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIcon, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </View>
              <Text style={[styles.rowLabel, { color: Colors.danger }]}>Hapus Akun</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionFooter}>MANUVER v1.0.4 • Sports Partner Discovery</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  rowSubLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginLeft: 56,
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
});
