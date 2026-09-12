import { StyleSheet, TextStyle } from 'react-native';

export const Colors = {
  background: '#090A0D',
  surface: '#171A21',
  elevatedSurface: '#1D2028',
  surfaceBorder: '#232730',
  surfaceInput: '#1E2128',
  tabBarBg: '#0F1115',
  primary: '#FF572F',
  primaryGradientStart: '#FF7347',
  primaryGradientEnd: '#E6441D',
  success: '#34C759',
  danger: '#FF3B30',
  star: '#FF9500',
  overlayDark: 'rgba(0, 0, 0, 0.75)',
  overlayGradientMid: 'rgba(9, 10, 13, 0.65)',
  pillBg: 'rgba(255, 255, 255, 0.12)',
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#92959E',
  textMuted: '#62656E',
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40,
} as const;

export const BorderRadius = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, round: 9999,
} as const;

export const Typography = {
  fontDisplay: 'Montserrat_800ExtraBold_Italic',
  fontHeading: 'Poppins_700Bold',
  fontSemiBold: 'Poppins_600SemiBold',
  fontRegular: 'Poppins_400Regular',
  fontMedium: 'Poppins_500Medium',
} as const;

export const TypographyStyles = StyleSheet.create({
  displayLogo: { fontFamily: 'Montserrat_800ExtraBold_Italic', fontSize: 26, color: '#FFFFFF', letterSpacing: 0.5 } as TextStyle,
  h1: { fontFamily: 'Poppins_700Bold', fontSize: 32, color: '#FFFFFF', lineHeight: 38 } as TextStyle,
  h2: { fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#FFFFFF', lineHeight: 30 } as TextStyle,
  h3: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#FFFFFF', lineHeight: 26 } as TextStyle,
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 15, color: '#92959E', lineHeight: 22 } as TextStyle,
  labelBold: { fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#FFFFFF' } as TextStyle,
  labelSecondary: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#92959E' } as TextStyle,
  body: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#FFFFFF', lineHeight: 20 } as TextStyle,
  bodySecondary: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#92959E', lineHeight: 18 } as TextStyle,
  caption: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#62656E' } as TextStyle,
  tagText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#FFFFFF' } as TextStyle,
});
