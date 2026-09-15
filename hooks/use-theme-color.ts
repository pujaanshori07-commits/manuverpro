/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors
) {
  const colorFromProps = props['dark'] || props['light'];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorName];
  }
}
