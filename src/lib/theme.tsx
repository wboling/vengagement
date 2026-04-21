'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ColorMode = 'dark' | 'light';

interface BrandingConfig {
  primaryColor?: string;
  secondaryColor?: string;
  successColor?: string;
  warningColor?: string;
  dangerColor?: string;
  navHoverBg?: string;
  navActiveBg?: string;
  logoUrl?: string;
}

interface ThemeContextValue {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  accentColor: string;
  branding: BrandingConfig;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorMode: 'dark',
  toggleColorMode: () => {},
  accentColor: '#4f46e5',
  branding: {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>('dark');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  const [branding, setBranding] = useState<BrandingConfig>({});
  const [mounted, setMounted] = useState(false);

  // Load from localStorage + fetch branding from settings
  useEffect(() => {
    const stored = localStorage.getItem('vg-theme') as ColorMode | null;
    if (stored === 'light' || stored === 'dark') {
      setColorMode(stored);
    }
    setMounted(true);

    // Fetch tenant branding to apply all colors
    fetch('/api/settings')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.settings?.branding) return;
        try {
          const b: BrandingConfig = typeof data.settings.branding === 'string'
            ? JSON.parse(data.settings.branding)
            : data.settings.branding;
          setBranding(b);
          if (b.primaryColor) setAccentColor(b.primaryColor);
        } catch {}
      })
      .catch(() => {});
  }, []);

  // Apply theme to <html>
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', colorMode);
  }, [colorMode, mounted]);

  // Apply all branding colors as CSS variable overrides
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty('--color-accent', accentColor);
    document.documentElement.style.setProperty('--color-accent-hover', accentColor);
    document.documentElement.style.setProperty('--color-accent-subtle', hexToRgba(accentColor, 0.08));
    if (branding.secondaryColor) {
      document.documentElement.style.setProperty('--color-teal', branding.secondaryColor);
      document.documentElement.style.setProperty('--color-teal-subtle', hexToRgba(branding.secondaryColor, 0.08));
    }
    if (branding.successColor) {
      document.documentElement.style.setProperty('--color-success', branding.successColor);
      document.documentElement.style.setProperty('--color-success-subtle', hexToRgba(branding.successColor, 0.1));
    }
    if (branding.warningColor) {
      document.documentElement.style.setProperty('--color-warning', branding.warningColor);
      document.documentElement.style.setProperty('--color-warning-subtle', hexToRgba(branding.warningColor, 0.1));
    }
    if (branding.dangerColor) {
      document.documentElement.style.setProperty('--color-danger', branding.dangerColor);
      document.documentElement.style.setProperty('--color-danger-subtle', hexToRgba(branding.dangerColor, 0.1));
    }
    if (branding.navHoverBg) {
      document.documentElement.style.setProperty('--color-bg-hover', branding.navHoverBg);
    }
    if (branding.navActiveBg) {
      document.documentElement.style.setProperty('--color-accent-subtle', branding.navActiveBg);
    }
  }, [accentColor, branding, mounted]);

  const toggleColorMode = useCallback(() => {
    setColorMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('vg-theme', next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ colorMode, toggleColorMode, accentColor, branding }}>
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
