import { lightColors, darkColors } from '../theme';
import { useThemeStore } from '../stores/themeStore';

export function useColors() {
  const isDark = useThemeStore(s => s.isDark);
  return isDark ? darkColors : lightColors;
}
