import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'defaultSemiBold'
    | 'title'
    | 'subtitle'
    | 'link'
    | 'sectionLabel'
    | 'statNumber'
    | 'statNumberLg'
    | 'statNumberSm'
    | 'statusTag'
    | 'badge'
    | 'caption';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'fg') as string;

  return (
    <Text
      style={[
        { color, fontFamily: (Fonts?.sans ?? 'sans-serif') as string },
        type === 'default' ? styles.default : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'sectionLabel' ? styles.sectionLabel : undefined,
        type === 'statNumber' ? styles.statNumber : undefined,
        type === 'statNumberLg' ? styles.statNumberLg : undefined,
        type === 'statNumberSm' ? styles.statNumberSm : undefined,
        type === 'statusTag' ? styles.statusTag : undefined,
        type === 'badge' ? styles.badge : undefined,
        type === 'caption' ? styles.caption : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
    letterSpacing: -0.04 * 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  link: {
    fontSize: 16,
    lineHeight: 30,
    color: '#0070f3',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3 * 10,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 48,
    letterSpacing: -0.04 * 48,
  },
  statNumberLg: {
    fontSize: 60,
    fontWeight: '700',
    lineHeight: 60,
    letterSpacing: -0.04 * 60,
  },
  statNumberSm: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.04 * 24,
  },
  statusTag: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.05 * 8,
  },
  badge: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
});
