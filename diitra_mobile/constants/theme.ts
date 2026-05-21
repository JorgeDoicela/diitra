/**
 * Sistema de Diseño Vercel (Geist System) - DIITRA Mobile
 * Basado en el sistema de diseño de diitra_web/src/index.css
 * Tokens de color, tipografía, espaciado y animaciones.
 */

import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

// Paleta semántica completa del sistema Vercel/Geist
export interface ThemeTokens {
  // Fondos y superficies
  bg: string;
  fg: string;
  surface: string;
  surfaceHover: string;

  // Bordes
  border: string;
  borderHover: string;

  // Texto
  textDim: string;
  accent: string;

  // Marca
  brand: string;
  brandDark: string;
  brandLight: string;

  // Estados semánticos
  success: string;
  error: string;
  warning: string;
  info: string;

  // Subtles (fondos traslúcidos)
  successSubtle: string;
  errorSubtle: string;
  warningSubtle: string;
  infoSubtle: string;
  brandSubtle: string;

  // Escala de grises Geist
  accents1: string;
  accents2: string;
  accents3: string;
  accents4: string;
  accents5: string;
  accents6: string;
  accents7: string;
  accents8: string;

  // Utilidades
  radius: number;
  gridColor: string;
  selectionBg: string;
  selectionFg: string;
}

export const Tokens: Record<ThemeMode, ThemeTokens> = {
  dark: {
    bg: '#000000',
    fg: '#ffffff',
    surface: '#0a0a0a',
    surfaceHover: '#171717',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.16)',
    textDim: '#888888',
    accent: '#ffffff',
    brand: '#0070f3',
    brandDark: '#0051c3',
    brandLight: '#3291ff',
    success: '#00e054',
    error: '#ff3333',
    warning: '#f5a623',
    info: '#3291ff',
    successSubtle: 'rgba(0, 224, 84, 0.06)',
    errorSubtle: 'rgba(255, 51, 51, 0.06)',
    warningSubtle: 'rgba(245, 166, 35, 0.06)',
    infoSubtle: 'rgba(50, 145, 255, 0.06)',
    brandSubtle: 'rgba(0, 112, 243, 0.06)',
    accents1: '#111111',
    accents2: '#333333',
    accents3: '#444444',
    accents4: '#666666',
    accents5: '#888888',
    accents6: '#999999',
    accents7: '#eaeaea',
    accents8: '#fafafa',
    radius: 8,
    gridColor: 'rgba(255, 255, 255, 0.04)',
    selectionBg: '#ffffff',
    selectionFg: '#000000',
  },
  light: {
    bg: '#ffffff',
    fg: '#000000',
    surface: '#fafafa',
    surfaceHover: '#eaeaea',
    border: 'rgba(0, 0, 0, 0.08)',
    borderHover: 'rgba(0, 0, 0, 0.16)',
    textDim: '#666666',
    accent: '#000000',
    brand: '#0070f3',
    brandDark: '#0051c3',
    brandLight: '#3291ff',
    success: '#008f37',
    error: '#cc0000',
    warning: '#b87200',
    info: '#0070f3',
    successSubtle: 'rgba(0, 143, 55, 0.04)',
    errorSubtle: 'rgba(204, 0, 0, 0.04)',
    warningSubtle: 'rgba(184, 114, 0, 0.04)',
    infoSubtle: 'rgba(0, 112, 243, 0.04)',
    brandSubtle: 'rgba(0, 112, 243, 0.04)',
    accents1: '#fafafa',
    accents2: '#eaeaea',
    accents3: '#999999',
    accents4: '#888888',
    accents5: '#666666',
    accents6: '#444444',
    accents7: '#333333',
    accents8: '#111111',
    radius: 8,
    gridColor: 'rgba(0, 0, 0, 0.04)',
    selectionBg: '#000000',
    selectionFg: '#ffffff',
  },
};

// Fuente Geist (usan system fonts en móvil como fallback, similar al web)
export const Fonts = Platform.select({
  ios: {
    sans: 'Geist Sans',
    mono: 'Geist Mono',
    system: 'system-ui',
  },
  default: {
    sans: 'Geist Sans',
    mono: 'Geist Mono',
    system: 'sans-serif',
  },
  web: {
    sans: "Geist Sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    mono: "Geist Mono, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    system: 'system-ui',
  },
});

// Curva de easing premium de Vercel
export const EasingVercel = {
  smooth: [0.16, 1, 0.3, 1] as const,
};

// Sombras adaptadas para RN (más sutiles en light mode)
export const Shadows = {
  dark: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.24, shadowRadius: 20, elevation: 8 },
    xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 12 },
  },
  light: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 },
    xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.12, shadowRadius: 40, elevation: 12 },
  },
};

// Objeto legacy Colors para compatibilidad con código existente
export const Colors = {
  light: {
    text: Tokens.light.fg,
    background: Tokens.light.bg,
    tint: Tokens.light.brand,
    icon: Tokens.light.accents4,
    tabIconDefault: Tokens.light.accents4,
    tabIconSelected: Tokens.light.brand,
  },
  dark: {
    text: Tokens.dark.fg,
    background: Tokens.dark.bg,
    tint: Tokens.dark.brand,
    icon: Tokens.dark.accents5,
    tabIconDefault: Tokens.dark.accents5,
    tabIconSelected: Tokens.dark.brand,
  },
};
