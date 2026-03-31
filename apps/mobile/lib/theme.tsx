import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeColors {
  bg: string;
  surface: string;
  muted: string;
  mutedText: string;
  foreground: string;
  primary: string;
  primaryFg: string;
  success: string;
  warning: string;
  danger: string;
  dangerLight: string;
  info: string;
  border: string;
  inputBg: string;
  placeholder: string;
}

const dark: ThemeColors = {
  bg: '#0B1120',
  surface: '#111827',
  muted: '#1F2937',
  mutedText: '#6B7280',
  foreground: '#F9FAFB',
  primary: '#14B8A6',
  primaryFg: '#0B1120',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  info: '#3B82F6',
  border: '#1F2937',
  inputBg: '#111827',
  placeholder: '#6B7280',
};

const light: ThemeColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  muted: '#F1F5F9',
  mutedText: '#64748B',
  foreground: '#0F172A',
  primary: '#0D9488',
  primaryFg: '#FFFFFF',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  dangerLight: 'rgba(220,38,38,0.06)',
  info: '#2563EB',
  border: '#E2E8F0',
  inputBg: '#FFFFFF',
  placeholder: '#94A3B8',
};

const THEME_KEY = 'trustvault_theme';

async function loadSavedTheme(): Promise<Theme | null> {
  try {
    if (Platform.OS === 'web') {
      const val = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
      return val === 'light' || val === 'dark' ? val : null;
    }
    const SecureStore = require('expo-secure-store');
    const val = await SecureStore.getItemAsync(THEME_KEY);
    return val === 'light' || val === 'dark' ? val : null;
  } catch {
    return null;
  }
}

async function saveTheme(theme: Theme): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, theme);
      return;
    }
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(THEME_KEY, theme);
  } catch { /* ignore */ }
}

interface ThemeState {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemScheme === 'light' ? 'light' : 'dark');
  const [loaded, setLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme().then((saved) => {
      if (saved) setTheme(saved);
      setLoaded(true);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      return next;
    });
  }, []);

  const colors = theme === 'dark' ? dark : light;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
