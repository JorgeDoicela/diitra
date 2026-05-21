import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';

import { useThemeContext } from '@/contexts/theme-context';
import { Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const AnimatedView = Animated.createAnimatedComponent(View);

export type VercelModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  size?: 'md' | 'lg';
};

export function VercelModal({ visible, onClose, children, style, size = 'md' }: VercelModalProps) {
  const theme = useThemeContext();
  const scheme = useColorScheme() ?? 'light';
  const shadows = Shadows[scheme];

  if (!visible) return null;

  return (
    <AnimatedView
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 110,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: theme.bg + 'E6', // ~90% opacity
      }}
    >
      <Pressable style={{ flex: 1, width: '100%', height: '100%' }} onPress={onClose}>
        <View style={{ flex: 1 }} />
      </Pressable>

      <AnimatedView
        entering={FadeInUp.duration(300).springify()}
        exiting={SlideOutDown.duration(200)}
        style={[
          {
            position: 'absolute',
            backgroundColor: theme.bg,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: theme.radius,
            width: '100%',
            maxWidth: size === 'lg' ? 672 : 512,
            overflow: 'hidden',
            flexDirection: 'column',
          },
          shadows.xl,
          style,
        ]}
      >
        {children}
      </AnimatedView>
    </AnimatedView>
  );
}

export function ModalHeader({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const theme = useThemeContext();
  return (
    <View
      style={[
        {
          padding: 24,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.surface + '4D',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ModalBody({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return (
    <View style={[{ padding: 24, flex: 1 }, style]}>
      {children}
    </View>
  );
}

export function ModalFooter({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const theme = useThemeContext();
  return (
    <View
      style={[
        {
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 12,
          backgroundColor: theme.surface + '33',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
