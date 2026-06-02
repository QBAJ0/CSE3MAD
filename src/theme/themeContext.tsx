import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { ColorTokens, darkColors, lightColors } from './colors';

export type AppearanceSetting = 'light' | 'dark' | 'system';

const APPEARANCE_KEY = '@stemm/appearance';

type ThemeContextValue = {
  appearance: AppearanceSetting;
  isDark: boolean;
  colors: ColorTokens;
  setAppearance: (a: AppearanceSetting) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [appearance, setAppearanceState] = useState<AppearanceSetting>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setAppearanceState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setAppearance = useCallback(async (a: AppearanceSetting) => {
    setAppearanceState(a);
    await AsyncStorage.setItem(APPEARANCE_KEY, a);
  }, []);

  const isDark =
    appearance === 'dark' ||
    (appearance === 'system' && systemScheme === 'dark');

  const colors: ColorTokens = isDark ? darkColors : lightColors;

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ appearance, isDark, colors, setAppearance }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
