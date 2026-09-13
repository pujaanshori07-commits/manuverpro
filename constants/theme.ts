import { StyleSheet, TextStyle } from 'react-native';

export const Colors = {
  // Surfaces & Backgrounds
  background: '#090A0D',
  surface: '#171A21',
  elevatedSurface: '#1D2028',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  surfaceBorderHover: 'rgba(255, 255, 255, 0.16)',
  surfaceInput: '#161920',
  tabBarBg: '#0F1115',

  // Primary Accent (Manuver Orange)
  primary: '#FF572F',
  primaryDark: '#E04720',
  primaryLight: '#FF7347',
  primaryMuted: 'rgba(255, 87, 47, 0.15)',
  primaryGlow: 'rgba(255, 87, 47, 0.35)',
  primaryGradientStart: '#FF7347',
  primaryGradientEnd: '#E6441D',

  // Semantic Status
  success: '#34C759',
  successMuted: 'rgba(52, 199, 89, 0.15)',
  danger: '#FF3B30',
  dangerMuted: 'rgba(255, 59, 48, 0.15)',
  warning: '#FF9500',
  star: '#FFB800',

  // Overlays
  overlayDark: 'rgba(9, 10, 13, 0.85)',
  overlayGradientMid: 'rgba(9, 10, 13, 0.65)',
  pillBg: 'rgba(255, 255, 255, 0.07)',
  pillBgActive: 'rgba(255, 87, 47, 0.15)',

  // Typography Colors
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#8F94A6',
  textMuted: '#585C6B',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  round: 9999,
} as const;

export const Typography = {
  fontDisplay: 'Montserrat_800ExtraBold_Italic',
  fontHeading: 'Poppins_700Bold',
  fontSemiBold: 'Poppins_600SemiBold',
  fontMedium: 'Poppins_500Medium',
  fontRegular: 'Poppins_400Regular',
} as const;

export const TypographyStyles = StyleSheet.create({
  displayLogo: {
    fontFamily: Typography.fontDisplay,
    fontSize: 26,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  } as TextStyle,
  h1: {
    fontFamily: Typography.fontHeading,
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 34,
    fontWeight: '700',
  } as TextStyle,
  h2: {
    fontFamily: Typography.fontHeading,
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 28,
    fontWeight: '700',
  } as TextStyle,
  h3: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 18,
    color: Colors.textPrimary,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,
  subtitle: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,
  labelBold: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  } as TextStyle,
  labelSecondary: {
    fontFamily: Typography.fontMedium,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  } as TextStyle,
  body: {
    fontFamily: Typography.fontRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  } as TextStyle,
  bodySecondary: {
    fontFamily: Typography.fontRegular,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  } as TextStyle,
  caption: {
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    color: Colors.textMuted,
  } as TextStyle,
  tagText: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  } as TextStyle,
});
