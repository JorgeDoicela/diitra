import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

export type SectionLabelProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function SectionLabel({ children, icon, style }: SectionLabelProps) {
  const theme = useThemeContext();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        style,
      ]}
    >
      {icon}
      <ThemedText
        type="sectionLabel"
        style={{ color: theme.textDim }}
      >
        {children}
      </ThemedText>
    </View>
  );
}
