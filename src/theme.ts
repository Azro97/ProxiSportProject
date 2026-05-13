// src/theme.ts

export const sportColors: Record<string, string> = {
  foot: '#2196F3',
  basket: '#FF6D00',
  hand: '#9C27B0',
  volley: '#4CAF50',
};

export const theme = {
  sportColors,
  colors: {
    primary: '#E63946',
    background: '#F5F5F5',
    white: '#FFFFFF',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#EEEEEE',
    borderDark: '#DDDDDD',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    small: 12,
    body: 14,
    subheading: 16,
    heading: 20,
    title: 24,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
    full: 999,
  },
};
