import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/DesignSystem';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Terms of Service',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <Text style={styles.subtitle}>By using Manuver, you agree to these terms.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>By creating a Manuver account, you agree to comply with our Terms of Service and Community Guidelines.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.paragraph}>You must be at least 18 years old to use Manuver. By using the app, you represent and warrant that you meet this requirement.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Content</Text>
          <Text style={styles.paragraph}>You are solely responsible for the content you post, including photos and chat messages. You agree not to post inappropriate, offensive, or illegal content.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Termination</Text>
          <Text style={styles.paragraph}>We reserve the right to suspend or terminate your account at any time if you violate these terms or pose a risk to other users.</Text>
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
