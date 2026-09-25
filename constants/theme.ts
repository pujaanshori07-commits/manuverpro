import { StyleSheet, TextStyle } from 'react-native';

export const Colors = {
  // Sophisticated Dark Foundation
  background: '#080A0F',
  surface: '#11141C',
  elevatedSurface: '#181C26',
  surfaceBorder: '#272C38',
  surfaceInput: '#141822',
  tabBarBg: '#080A0F',

  // Primary Brand Accent (Digunakan secara selektif & bermakna)
  primary: '#FF5A36',
  primaryDark: '#E04724',
  primaryMuted: 'rgba(255, 90, 54, 0.12)',
  primaryGlow: 'rgba(255, 90, 54, 0.25)',

  // Supporting Semantic Accents
  success: '#48E59A',
  successMuted: 'rgba(72, 229, 154, 0.12)',
  info: '#6C8CFF',
  infoMuted: 'rgba(108, 140, 255, 0.12)',
  warning: '#F4B740',
  warningMuted: 'rgba(244, 183, 64, 0.12)',
  danger: '#FF4757',
  dangerMuted: 'rgba(255, 71, 87, 0.12)',

  // Neutral Typography
  textPrimary: '#F5F7FA',
  textSecondary: '#969EAE',
  textMuted: '#626A7A',
  white: '#FFFFFF',
  black: '#000000',

  // Interactive Chips & Pills
  chipBg: '#181C26',
  chipBorder: '#272C38',
  chipBgActive: 'rgba(255, 90, 54, 0.14)',
  chipBorderActive: '#FF5A36',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  card: 20,
  pill: 999,
} as const;

export const Typography: Record<string, TextStyle> = {
  screenTitle: {
    fontFamily: 'Lato_900Black',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bodyMuted: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  metadata: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
};
