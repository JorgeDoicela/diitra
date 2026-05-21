import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

export type StatusTagVariant = 'success' | 'error' | 'warning' | 'info' | 'brand' | 'neutral';

export type StatusTagProps = {
  children: React.ReactNode;
  variant?: StatusTagVariant;
  style?: ViewStyle | ViewStyle[];
};

export function StatusTag({ children, variant = 'neutral', style }: StatusTagProps) {
  const theme = useThemeContext();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { color: theme.success, borderColor: theme.success };
      case 'error':
        return { color: theme.error, borderColor: theme.error };
      case 'warning':
        return { color: theme.warning, borderColor: theme.warning };
      case 'info':
        return { color: theme.info, borderColor: theme.info };
      case 'brand':
        return { color: theme.brand, borderColor: theme.brand };
      case 'neutral':
      default:
        return { color: theme.textDim, borderColor: theme.border };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: colors.borderColor,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <ThemedText type="statusTag" style={{ color: colors.color }}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </View>
  );
}
