import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

export type VercelBadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'violet' | 'neutral';

export type VercelBadgeProps = {
  children: React.ReactNode;
  variant?: VercelBadgeVariant;
  style?: ViewStyle | ViewStyle[];
};

export function VercelBadge({ children, variant = 'neutral', style }: VercelBadgeProps) {
  const theme = useThemeContext();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.successSubtle,
          border: 'rgba(0, 224, 84, 0.3)',
          color: theme.success,
        };
      case 'error':
        return {
          bg: theme.errorSubtle,
          border: 'rgba(255, 51, 51, 0.3)',
          color: theme.error,
        };
      case 'warning':
        return {
          bg: theme.warningSubtle,
          border: 'rgba(245, 166, 35, 0.3)',
          color: theme.warning,
        };
      case 'info':
        return {
          bg: theme.infoSubtle,
          border: 'rgba(0, 112, 243, 0.3)',
          color: theme.info,
        };
      case 'violet':
        return {
          bg: 'rgba(139, 92, 246, 0.06)',
          border: 'rgba(139, 92, 246, 0.3)',
          color: '#a78bfa',
        };
      case 'neutral':
      default:
        return {
          bg: theme.surface,
          border: theme.border,
          color: theme.textDim,
        };
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
          gap: 6,
          paddingVertical: 2,
          paddingHorizontal: 8,
          borderRadius: 9999,
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <ThemedText type="badge" style={{ color: colors.color }}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </View>
  );
}
