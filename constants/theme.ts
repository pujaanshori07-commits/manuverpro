import { StyleSheet, TextStyle } from 'react-native';

export const Colors = {
  // Rich deep surfaces (warm charcoal black, no muddy grays)
  background: '#0B0D13',
  surface: '#151821',
  elevatedSurface: '#1C202C',
  surfaceCard: '#11141C',
  surfaceBorder: 'rgba(255, 255, 255, 0.07)',
  surfaceBorderHover: 'rgba(255, 255, 255, 0.14)',
  surfaceInput: '#181C26',
  tabBarBg: '#0D0F16',

  // Primary Accent (Signature Manuver Energy Orange)
  primary: '#FF572F',
  primaryDark: '#E04720',
  primaryLight: '#FF7347',
  primaryMuted: 'rgba(255, 87, 47, 0.14)',
  primaryGlow: 'rgba(255, 87, 47, 0.38)',
  primaryGradientStart: '#FF7347',
  primaryGradientEnd: '#E6441D',

  // Status & Accents
  success: '#00C48C',
  successMuted: 'rgba(0, 196, 140, 0.14)',
  danger: '#FF4757',
  dangerMuted: 'rgba(255, 71, 87, 0.14)',
  warning: '#FFA502',
  star: '#FFB800',

  // Overlays & Pills
  overlayDark: 'rgba(11, 13, 19, 0.88)',
  overlayGradientMid: 'rgba(11, 13, 19, 0.55)',
  pillBg: 'rgba(255, 255, 255, 0.06)',
  pillBgActive: 'rgba(255, 87, 47, 0.14)',
  pillBorder: 'rgba(255, 255, 255, 0.08)',
  pillBorderActive: 'rgba(255, 87, 47, 0.38)',

  // Typography
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#9AA0B2',
  textMuted: '#676D80',
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
  lg: 22,
  xl: 28,
  card: 28,
  pill: 9999,
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
  heroTitle: {
    fontFamily: Typography.fontHeading,
    fontSize: 26,
    color: Colors.textPrimary,
  } as TextStyle,
  sectionHeading: {
    fontFamily: Typography.fontSemiBold,
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  body: {
    fontFamily: Typography.fontRegular,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  } as TextStyle,
  pillInteractive: {
    fontFamily: Typography.fontMedium,
    fontSize: 12,
    color: Colors.textPrimary,
  } as TextStyle,
  microMeta: {
    fontFamily: Typography.fontRegular,
    fontSize: 11,
    color: Colors.textSecondary,
  } as TextStyle,
});
