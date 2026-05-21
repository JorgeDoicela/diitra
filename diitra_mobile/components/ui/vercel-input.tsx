import React from 'react';
import { TextInput, type TextInputProps, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';

export type VercelInputProps = TextInputProps & {
  style?: ViewStyle | ViewStyle[];
};

export function VercelInput({ style, placeholderTextColor, selectionColor, ...rest }: VercelInputProps) {
  const theme = useThemeContext();

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? theme.textDim}
      selectionColor={selectionColor ?? theme.brand}
      style={[
        {
          backgroundColor: theme.bg,
          color: theme.fg,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: theme.radius,
          paddingVertical: 8,
          paddingHorizontal: 12,
          fontSize: 14,
          fontFamily: 'Geist Sans',
          width: '100%',
        },
        style,
      ]}
      {...rest}
    />
  );
}
