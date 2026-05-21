import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'bg' | 'surface' | 'surfaceHover' | 'transparent';
  border?: boolean;
  borderHover?: boolean;
  radius?: boolean;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = 'bg',
  border = false,
  borderHover = false,
  radius = false,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    variant === 'transparent' ? 'bg' : variant
  ) as string;
  const borderColor = useThemeColor({}, border ? 'border' : 'bg') as string;
  const actualBorderColor = border ? borderColor : undefined;

  const hoverBorderColor = borderHover ? (useThemeColor({}, 'borderHover') as string) : undefined;

  const themedStyle: ViewStyle = {
    backgroundColor: variant === 'transparent' ? 'transparent' : backgroundColor,
    ...(actualBorderColor ? { borderColor: actualBorderColor, borderWidth: 1 } : {}),
    ...(hoverBorderColor ? { borderColor: hoverBorderColor, borderWidth: 1 } : {}),
    ...(radius ? { borderRadius: 8 } : {}),
  };

  return <View style={[themedStyle, style]} {...otherProps} />;
}
