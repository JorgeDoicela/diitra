import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useThemeContext } from '@/contexts/theme-context';
import { BackgroundGlow } from '@/components/ui/background-glow';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'bg' | 'surface' | 'surfaceHover' | 'transparent';
  border?: boolean;
  borderHover?: boolean;
  radius?: boolean;
  glow?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'bg',
  border = false,
  borderHover = false,
  radius = false,
  glow = false,
  ...otherProps
}: ThemedViewProps) {
  const theme = useThemeContext();

  const backgroundColor = (variant === 'transparent' ? 'transparent' : theme[variant === 'bg' ? 'bg' : variant]) as string;
  const borderColor = (border ? theme.border : undefined) as string | undefined;
  const hoverBorderColor = (borderHover ? theme.borderHover : undefined) as string | undefined;

  const themedStyle: ViewStyle = {
    backgroundColor,
    ...(borderColor ? { borderColor: borderColor, borderWidth: 1 } : {}),
    ...(hoverBorderColor ? { borderColor: hoverBorderColor, borderWidth: 1 } : {}),
    ...(radius ? { borderRadius: 8 } : {}),
  };

  if (glow) {
    return (
      <View style={[themedStyle, style]} {...otherProps}>
        <BackgroundGlow />
        {otherProps.children}
      </View>
    );
  }

  return <View style={[themedStyle, style]} {...otherProps} />;
}
