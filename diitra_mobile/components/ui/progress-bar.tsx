import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useThemeContext } from '@/contexts/theme-context';

const AnimatedView = Animated.createAnimatedComponent(View);

export type ProgressBarProps = {
  progress: number; // 0 to 100
  variant?: 'success' | 'brand';
  height?: number;
  style?: ViewStyle | ViewStyle[];
};

export function ProgressBar({ progress, variant = 'brand', height = 4, style }: ProgressBarProps) {
  const theme = useThemeContext();
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(100, progress)), { duration: 700 });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const getBackgroundColor = () => {
    if (variant === 'success') return theme.success;
    return theme.brand;
  };

  return (
    <View
      style={[
        {
          width: '100%',
          height,
          backgroundColor: theme.accents2,
          borderRadius: 9999,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <AnimatedView
        style={[
          {
            height: '100%',
            borderRadius: 9999,
            backgroundColor: getBackgroundColor(),
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
