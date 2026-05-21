import React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { useThemeContext } from '@/contexts/theme-context';
import { Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type BentoCardProps = PressableProps & {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function BentoCard({ children, style, onPress, ...rest }: BentoCardProps) {
  const theme = useThemeContext();
  const scheme = useColorScheme() ?? 'light';
  const shadows = Shadows[scheme];

  const elevation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withTiming(elevation.value === 1 ? -1 : 0, { duration: 200 }) }],
      shadowOpacity: withTiming(elevation.value === 1 ? shadows.md.shadowOpacity : shadows.sm.shadowOpacity, {
        duration: 200,
      }),
      shadowRadius: withTiming(elevation.value === 1 ? shadows.md.shadowRadius : shadows.sm.shadowRadius, {
        duration: 200,
      }),
      elevation: withTiming(elevation.value === 1 ? shadows.md.elevation : shadows.sm.elevation, { duration: 200 }),
    };
  });

  return (
    <AnimatedPressable
      onPressIn={() => {
        elevation.value = 1;
      }}
      onPressOut={() => {
        elevation.value = 0;
      }}
      onPress={onPress}
      {...rest}
      style={[
        {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: theme.radius,
          padding: 16,
          overflow: 'hidden',
        },
        shadows.sm,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
