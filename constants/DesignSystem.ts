export const COLORS = {
  background: '#090A0D',
  surface: '#171A21',
  elevatedSurface: '#1D2028',
  primary: '#FF572F', // Orange action color
  text: '#FFFFFF',
  secondaryText: '#92959E',
  success: '#4CAF50', // Muted green for online status
  error: '#FF3B30', // Standard red for destructive actions
  border: '#232730', // Very subtle dark gray
};

export const SIZES = {
  borderRadius: 20, // 16-24px for major cards
  padding: 16,
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  round: 9999,
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '700' as const },
  h2: { fontSize: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body1: { fontSize: 16, fontWeight: '400' as const },
  body2: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
