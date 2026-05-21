/**
 * Hooks de animación estilo Vercel usando react-native-reanimated.
 * Equivalentes a los keyframes del sistema web.
 */

import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const vercelEasing = Easing.bezier(0.16, 1, 0.3, 1);

// ------------------------------------------------------------------
// fadeUp: Entrada suave desde abajo (opacity 0 -> 1, translateY 10 -> 0)
// ------------------------------------------------------------------
export function useFadeUp(delayMs = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: 500, easing: vercelEasing })
    );
  }, [progress, delayMs]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [10, 0]) },
    ],
  }));

  return style;
}

// ------------------------------------------------------------------
// fadeIn: Entrada simple de opacidad (0 -> 1)
// ------------------------------------------------------------------
export function useFadeIn(delayMs = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: 300, easing: vercelEasing })
    );
  }, [progress, delayMs]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  return style;
}

// ------------------------------------------------------------------
// toastSlideIn: Entrada de toast desde abajo con escala
// (opacity 0 -> 1, translateY 20 -> 0, scale 0.95 -> 1)
// ------------------------------------------------------------------
export function useToastSlideIn(delayMs = 0) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: 300, easing: vercelEasing })
    );
  }, [progress, delayMs]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [20, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  return style;
}

// ------------------------------------------------------------------
// pulse: Latido infinito de opacidad (1 -> 0.5 -> 1)
// ------------------------------------------------------------------
export function usePulse() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return style;
}

// ------------------------------------------------------------------
// scalePress: Escala al presionar (para botones y tarjetas)
// ------------------------------------------------------------------
export function useScalePress() {
  const scale = useSharedValue(1);

  const pressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const pressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { style, pressIn, pressOut };
}
