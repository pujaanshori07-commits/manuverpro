import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'dark'];

  return (
    <View style={styles.container}>
        <SafeAreaView style={styles.content}>
          <View style={styles.brandContainer}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain" 
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D12',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: width * 0.7,
    height: width * 0.7,
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
