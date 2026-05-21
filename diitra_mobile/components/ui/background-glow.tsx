import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeContext } from '@/contexts/theme-context';

export type BackgroundGlowProps = {
  style?: ViewStyle | ViewStyle[];
  intensity?: 'low' | 'medium' | 'high';
};

/**
 * Destello radial azul cobalto en la parte superior del contenedor.
 * Equivalente a .bg-glow del sistema web.
 */
export function BackgroundGlow({ style, intensity = 'medium' }: BackgroundGlowProps) {
  const theme = useThemeContext();

  const intensityMap = {
    low: 0.05,
    medium: 0.15,
    high: 0.25,
  };

  const alpha = intensityMap[intensity];

  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[`${theme.brand}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`, 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.7 }}
        style={{
          position: 'absolute',
          top: '-20%',
          left: 0,
          right: 0,
          height: '60%',
        }}
      />
    </View>
  );
}
