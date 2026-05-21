import React, { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

export type TabItem = {
  key: string;
  label: string;
};

export type VercelTabsProps = {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: ViewStyle | ViewStyle[];
};

export function VercelTabs({ tabs, activeTab, onTabChange, style }: VercelTabsProps) {
  const theme = useThemeContext();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: 24,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          marginBottom: 24,
        },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={{
              paddingVertical: 12,
              position: 'relative',
            }}
          >
            <ThemedText
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: isActive ? theme.fg : theme.textDim,
              }}
            >
              {tab.label}
            </ThemedText>
            {isActive && (
              <View
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: theme.fg,
                  borderRadius: 9999,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
