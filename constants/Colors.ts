/**
 * Exact Manuver Design Reference Colors
 * Primary: Vibrant Manuver Orange
 * Dark Mode: Deep charcoal/near-black
 * Light Mode: Warm off-white
 */

const tintColorLight = '#FF5A2A'; // Manuver Orange
const tintColorDark = '#FF5A2A';

export const Colors = {
  light: {
    text: '#11181C',
    secondaryText: '#687076',
    background: '#F8F9FA', // Warm off-white
    surface: '#FFFFFF',
    border: '#EAEAEA',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#FF5A2A',
    success: '#4CAF50',
    error: '#F44336',
  },
  dark: {
    text: '#FFFFFF',
    secondaryText: '#A1A1AA',
    background: '#0B0D12', // Near-black charcoal
    surface: '#181A20', // Slightly lighter for cards
    border: '#272A35',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#FF5A2A',
    success: '#4CAF50',
    error: '#F44336',
  },
};
