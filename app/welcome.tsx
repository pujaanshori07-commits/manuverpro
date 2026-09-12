import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'dark'];

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000&auto=format&fit=crop' }} 
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(11, 13, 18, 0.1)', 'rgba(11, 13, 18, 0.8)', 'rgba(11, 13, 18, 1)']}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandText}>MANUVER</Text>
          </View>
          
          <View style={styles.bottomSection}>
            <Text style={styles.headline}>Find your sports{'\n'}buddies nearby.</Text>
            <Text style={styles.subhead}>Connect, train, and dominate together.</Text>
            
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: themeColors.primary }]}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.primaryBtnText}>GET STARTED</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryBtn}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.secondaryBtnText}>I ALREADY HAVE AN ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brandContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  brandText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 4,
    fontStyle: 'italic',
  },
  bottomSection: {
    width: '100%',
  },
  headline: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 40,
    color: '#FFFFFF',
    lineHeight: 48,
    marginBottom: 12,
  },
  subhead: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 40,
  },
  primaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  secondaryBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
