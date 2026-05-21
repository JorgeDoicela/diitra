/**
 * Hook para obtener colores del tema Vercel/Geist basado en el esquema de color actual.
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Tokens, type ThemeTokens } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemeColorName = keyof ThemeTokens;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return Tokens[theme][colorName];
}
