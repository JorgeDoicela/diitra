import React from 'react';
import { type TextStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

export type StatNumberProps = {
  children: React.ReactNode;
  size?: 'lg' | 'default' | 'sm';
  style?: TextStyle | TextStyle[];
};

export function StatNumber({ children, size = 'default', style }: StatNumberProps) {
  const theme = useThemeContext();

  const typeMap = {
    lg: 'statNumberLg',
    default: 'statNumber',
    sm: 'statNumberSm',
  } as const;

  return (
    <ThemedText
      type={typeMap[size]}
      style={[
        {
          color: theme.fg,
          fontFamily: 'Geist Mono',
        },
        style,
      ]}
    >
      {children}
    </ThemedText>
  );
}
