import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

import { useThemeContext } from '@/contexts/theme-context';
import { Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedView = Animated.createAnimatedComponent(View);

export type VercelToastProps = {
  visible: boolean;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function VercelToast({ visible, children, style }: VercelToastProps) {
  const theme = useThemeContext();
  const scheme = useColorScheme() ?? 'light';
  const shadows = Shadows[scheme];

  if (!visible) return null;

  return (
    <AnimatedView
      entering={FadeInUp.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={[
        {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: theme.radius,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        },
        shadows.lg,
        style,
      ]}
    >
      {children}
    </AnimatedView>
  );
}

export function ToastContainer({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: 24,
          right: 24,
          left: 24,
          flexDirection: 'column',
          gap: 12,
          zIndex: 9999,
          maxWidth: 380,
          alignSelf: 'center',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
