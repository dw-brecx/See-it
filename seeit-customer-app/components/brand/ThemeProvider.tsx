import * as React from 'react';

type Theme = {
  accent: string; // primary CTAs / pills tint
  accentSoft: string; // soft background for chips
  accentText: string; // text on accent background
};

const DEFAULT_THEME: Theme = {
  accent: '#E85D3A',
  accentSoft: '#FDF2EE',
  accentText: '#FFFFFF',
};

const ThemeContext = React.createContext<Theme>(DEFAULT_THEME);

/**
 * Hex (#RRGGBB) → rgba with the given alpha. Used to derive the soft-bg
 * variant when a brand sets a theme_color.
 */
function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function BrandThemeProvider({
  themeColor,
  children,
}: {
  themeColor?: string | null;
  children: React.ReactNode;
}) {
  const theme = React.useMemo<Theme>(() => {
    if (!themeColor) return DEFAULT_THEME;
    return {
      accent: themeColor,
      accentSoft: hexToRgba(themeColor, 0.12),
      accentText: '#FFFFFF',
    };
  }, [themeColor]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return React.useContext(ThemeContext);
}
