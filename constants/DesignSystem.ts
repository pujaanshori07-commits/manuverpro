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

export const Palette = {
  background: '#0B0D12',
  surface: '#1A1D24',
  surfaceElevated: '#232730',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  surfaceBorderStrong: 'rgba(255, 255, 255, 0.14)',
  
  primary: '#FF5A1F',
  primaryLight: '#FF7A45',
  primarySoft: 'rgba(255, 90, 31, 0.14)',
  primaryGlow: 'rgba(255, 90, 31, 0.35)',

  textPrimary: '#FFFFFF',
  textSecondary: '#8F94A6',
  textMuted: '#555B6E',
  
  success: '#4ADE80',
  danger: '#EF4444',
  star: '#38BDF8',
};

export const Typography = {
  headerTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Palette.textPrimary,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Palette.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 13,
    color: Palette.textSecondary,
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Palette.textMuted,
  },
};
