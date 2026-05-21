import React from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { useThemeContext } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type VercelButtonVariant = 'primary' | 'secondary' | 'brand';

export type VercelButtonProps = PressableProps & {
  children: React.ReactNode;
  variant?: VercelButtonVariant;
  style?: ViewStyle | ViewStyle[];
  textStyle?: object;
};

export function VercelButton({
  children,
  variant = 'primary',
  style,
  textStyle,
  onPress,
  ...rest
}: VercelButtonProps) {
  const theme = useThemeContext();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 100 }) }],
  }));

  const getBackgroundColor = () => {
    if (variant === 'primary') return theme.fg;
    if (variant === 'secondary') return theme.surface;
    if (variant === 'brand') return theme.brand;
    return theme.fg;
  };

  const getTextColor = () => {
    if (variant === 'primary') return theme.bg;
    if (variant === 'secondary') return theme.fg;
    if (variant === 'brand') return '#ffffff';
    return theme.bg;
  };

  const getBorderColor = () => {
    if (variant === 'primary') return theme.fg;
    if (variant === 'secondary') return theme.border;
    if (variant === 'brand') return theme.brand;
    return theme.fg;
  };

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = 0.97;
      }}
      onPressOut={() => {
        scale.value = 1;
      }}
      onPress={onPress}
      {...rest}
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: 1,
          borderColor: getBorderColor(),
          borderRadius: theme.radius,
          paddingVertical: 10,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        animatedStyle,
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <ThemedText
          type="defaultSemiBold"
          style={[
            {
              color: getTextColor(),
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
              lineHeight: 14,
            },
            textStyle,
          ]}
        >
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}
