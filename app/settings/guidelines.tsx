import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/DesignSystem';

export default function GuidelinesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Guidelines',
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Community Guidelines</Text>
        <Text style={styles.subtitle}>Welcome to Manuver! Please respect these rules to keep our community safe and fun for everyone.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Respect Everyone</Text>
          <Text style={styles.paragraph}>We do not tolerate harassment, bullying, or discrimination of any kind. Treat all members with respect, both online and on the field.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Be Safe</Text>
          <Text style={styles.paragraph}>Protect your personal information. Always meet in public, well-lit places for your sports activities. If something feels off, trust your instincts.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Be Authentic</Text>
          <Text style={styles.paragraph}>Use your real identity and photos. Do not impersonate others or create fake accounts. Our community thrives on genuine connections.</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Keep it Sporty</Text>
          <Text style={styles.paragraph}>Manuver is designed for finding sports buddies and organizing activities. Please avoid using the platform for selling goods, spamming, or unrelated promotions.</Text>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  paragraph: { fontSize: 15, color: COLORS.secondaryText, lineHeight: 24 },
});
