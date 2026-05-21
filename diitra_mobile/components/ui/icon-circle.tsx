import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';

export type IconCircleVariant = 'success' | 'info' | 'warning' | 'error' | 'brand';

export type IconCircleProps = {
  children: React.ReactNode;
  variant?: IconCircleVariant;
  size?: number;
  style?: ViewStyle | ViewStyle[];
};

export function IconCircle({ children, variant = 'brand', size = 40, style }: IconCircleProps) {
  const theme = useThemeContext();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.successSubtle, color: theme.success };
      case 'info':
        return { bg: theme.infoSubtle, color: theme.info };
      case 'warning':
        return { bg: theme.warningSubtle, color: theme.warning };
      case 'error':
        return { bg: theme.errorSubtle, color: theme.error };
      case 'brand':
      default:
        return { bg: theme.brandSubtle, color: theme.brand };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
