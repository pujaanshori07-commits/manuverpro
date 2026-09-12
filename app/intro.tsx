import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity,  Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/DesignSystem';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function IntroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.illustrationContainer}>
          <View style={styles.hexBadge}>
            <Ionicons name="barbell" size={48} color={COLORS.background} />
          </View>
        </View>

        <Text style={styles.title}>Find your perfect workout buddy</Text>
        <Text style={styles.subtitle}>
          Manuver will help you find friends to play sports with, build a healthy lifestyle, and expand your active social circle.
        </Text>
        
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)' as any)}>
          <Text style={styles.primaryButtonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center',
    paddingBottom: 60
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  hexBadge: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '10deg' }]
  },
  title: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: COLORS.text, 
    marginBottom: 16,
    letterSpacing: -1,
    lineHeight: 44
  },
  subtitle: { 
    fontSize: 16, 
    color: COLORS.secondaryText, 
    lineHeight: 24 
  },
  footer: { 
    padding: 24, 
    paddingBottom: 40,
  },
  primaryButton: { 
    backgroundColor: COLORS.text, 
    width: '100%', 
    paddingVertical: 18, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  primaryButtonText: { 
    color: COLORS.background, 
    fontSize: 16, 
    fontWeight: '800' 
  },
});
