'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ColorMode = 'dark' | 'light';

interface ThemeContextValue {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorMode: 'dark',
  toggleColorMode: () => {},
  accentColor: '#4f46e5',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage + fetch branding from settings
  useEffect(() => {
    const stored = localStorage.getItem('vg-theme') as ColorMode | null;
    if (stored === 'light' || stored === 'dark') {
      setColorMode(stored);
    }
    setMounted(true);

    // Fetch tenant branding to apply accent color
    fetch('/api/settings')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.settings?.branding) return;
        try {
          const branding = typeof data.settings.branding === 'string'
            ? JSON.parse(data.settings.branding)
            : data.settings.branding;
          if (branding.primaryColor) setAccentColor(branding.primaryColor);
        } catch {}
      })
      .catch(() => {});
  }, []);

  // Apply theme to <html> and inject accent CSS variable
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', colorMode);
  }, [colorMode, mounted]);

  // Apply accent color as CSS variable override
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty('--color-accent', accentColor);
    // Derive hover (slightly darker) — simple heuristic: keep same for now
    document.documentElement.style.setProperty('--color-accent-hover', accentColor);
    document.documentElement.style.setProperty(
      '--color-accent-subtle',
      hexToRgba(accentColor, 0.08)
    );
  }, [accentColor, mounted]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('vg-theme', next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ colorMode, toggleColorMode, accentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(79,70,229,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}
