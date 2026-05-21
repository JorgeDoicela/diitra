import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';

export type DividerProps = {
  style?: ViewStyle | ViewStyle[];
};

export function Divider({ style }: DividerProps) {
  const theme = useThemeContext();

  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: theme.border,
          width: '100%',
          marginVertical: 24,
        },
        style,
      ]}
    />
  );
}
