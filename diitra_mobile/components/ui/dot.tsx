import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useThemeContext } from '@/contexts/theme-context';

const AnimatedView = Animated.createAnimatedComponent(View);

export type DotVariant = 'success' | 'warning' | 'error' | 'info' | 'brand' | 'neutral';

export type DotProps = {
  variant?: DotVariant;
  size?: number;
  style?: ViewStyle | ViewStyle[];
};

export function Dot({ variant = 'neutral', size = 6, style }: DotProps) {
  const theme = useThemeContext();

  const getColor = () => {
    switch (variant) {
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'error':
        return theme.error;
      case 'info':
        return theme.info;
      case 'brand':
        return theme.brand;
      case 'neutral':
      default:
        return theme.accents5;
    }
  };

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getColor(),
          flexShrink: 0,
        },
        style,
      ]}
    />
  );
}

export function DotPulse({ variant = 'brand', size = 6, style }: DotProps) {
  const theme = useThemeContext();
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 1000 }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getColor = () => {
    switch (variant) {
      case 'success':
        return theme.success;
      case 'warning':
        return theme.warning;
      case 'error':
        return theme.error;
      case 'info':
        return theme.info;
      case 'brand':
        return theme.brand;
      case 'neutral':
      default:
        return theme.accents5;
    }
  };

  return (
    <AnimatedView
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getColor(),
          flexShrink: 0,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
