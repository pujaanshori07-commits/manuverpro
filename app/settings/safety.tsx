import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/DesignSystem';

export default function SafetyScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Safety Tips',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Safety First</Text>
        <Text style={styles.subtitle}>Your safety is our priority. Read these tips before meeting up with a new sports buddy.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Offline</Text>
          <Text style={styles.paragraph}>• Meet in public places like official sports centers, public parks, or busy gyms.</Text>
          <Text style={styles.paragraph}>• Tell a friend or family member where you're going and who you're meeting.</Text>
          <Text style={styles.paragraph}>• Keep your phone charged and with you at all times.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protect Your Data</Text>
          <Text style={styles.paragraph}>Never share sensitive personal information like your home address, financial details, or passwords with people you just met online.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Suspicious Behavior</Text>
          <Text style={styles.paragraph}>If someone is acting inappropriately, making you uncomfortable, or violating our guidelines, please use the Report feature immediately. We take all reports seriously.</Text>
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
  section: { marginBottom: 24, backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },
  paragraph: { fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 8 },
});
