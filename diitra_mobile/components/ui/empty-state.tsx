import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  style?: ViewStyle | ViewStyle[];
};

export function EmptyState({ icon, title, description, style }: EmptyStateProps) {
  const theme = useThemeContext();

  return (
    <View
      style={[
        {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: theme.border,
          borderRadius: theme.radius,
          gap: 12,
        },
        style,
      ]}
    >
      {icon}
      {title && (
        <ThemedText type="subtitle" style={{ textAlign: 'center' }}>
          {title}
        </ThemedText>
      )}
      {description && (
        <ThemedText type="caption" style={{ color: theme.textDim, textAlign: 'center' }}>
          {description}
        </ThemedText>
      )}
    </View>
  );
}
