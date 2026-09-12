import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/DesignSystem';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.subtitle}>Last updated: September 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Data We Collect</Text>
          <Text style={styles.paragraph}>We collect information you provide directly to us, such as your name, email, phone number, location, and sports preferences when you create an account.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Data</Text>
          <Text style={styles.paragraph}>Your data is used to match you with suitable sports buddies in your area, improve our services, and communicate with you about your account.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Sharing</Text>
          <Text style={styles.paragraph}>We do not sell your personal data to third parties. We only share necessary information (like your profile photo and first name) with other users to facilitate matches.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Your Rights</Text>
          <Text style={styles.paragraph}>You have the right to access, update, or delete your personal information at any time through the Settings menu in the app.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 24, paddingBottom: 40 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  subtitle: { fontSize: 13, color: COLORS.secondaryText, marginBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  paragraph: { fontSize: 14, color: COLORS.secondaryText, lineHeight: 22 },
});
