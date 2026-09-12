import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/DesignSystem';

const FAQ_ITEMS = [
  {
    q: "How do I find a sports buddy?",
    a: "Manuver automatically matches you with people who share similar sports interests and skill levels in your area. You can swipe through matches in the Home tab."
  },
  {
    q: "How do I change my location?",
    a: "You can update your location preferences in the Settings tab under 'Account' or directly on your Profile page."
  },
  {
    q: "Is Manuver free to use?",
    a: "Yes! Manuver's core features for finding sports buddies and chatting are completely free."
  },
  {
    q: "How do I report a user?",
    a: "Go to the user's profile, tap the three dots in the top right corner, and select 'Report'. Our safety team will review it immediately."
  }
];

export default function HelpCenterScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Help Center',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>FAQ</Text>
        <Text style={styles.subtitle}>Frequently asked questions about Manuver.</Text>

        <View style={styles.faqList}>
          {FAQ_ITEMS.map((item, index) => (
            <View key={index} style={styles.faqCard}>
              <View style={styles.qRow}>
                <Ionicons name="help-circle" size={24} color={COLORS.primary} />
                <Text style={styles.questionText}>{item.q}</Text>
              </View>
              <Text style={styles.answerText}>{item.a}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>Need more help? Go to Settings and tap 'Contact Us' to send us a direct message.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 24, paddingBottom: 40 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  subtitle: { fontSize: 15, color: COLORS.secondaryText, marginBottom: 32, lineHeight: 22 },
  faqList: { gap: 16 },
  faqCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  questionText: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  answerText: { fontSize: 14, color: COLORS.secondaryText, lineHeight: 22 },
  footerInfo: {
    marginTop: 40,
    padding: 20,
    backgroundColor: COLORS.elevatedSurface,
    borderRadius: 16,
    alignItems: 'center'
  },
  footerText: { fontSize: 13, color: COLORS.secondaryText, textAlign: 'center', lineHeight: 20 }
});
