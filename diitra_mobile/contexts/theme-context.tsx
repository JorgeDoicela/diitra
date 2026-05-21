import React, { createContext, useContext } from 'react';
import type { ThemeTokens } from '@/constants/theme';

const ThemeContext = createContext<ThemeTokens | null>(null);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: ThemeTokens;
  children: React.ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
