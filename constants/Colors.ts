/**
 * Panduan Warna Premium (Light & Dark Mode)
 * Menggunakan palet yang bersih, modern, dan tidak terlalu mencolok (non-generic)
 */

export const tintColorLight = '#FF5A2A'; // Vibrant Orange khas Manuver
export const tintColorDark = '#FF7A59';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FAFAFA',
    card: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#EAEAEA',
    success: '#34D399',
    error: '#EF4444',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#0B0D12',
    card: '#161921',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#242833',
    success: '#10B981',
    error: '#F87171',
  },
};
