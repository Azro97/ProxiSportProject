// src/theme.ts

export const sportColors: Record<string, string> = {
  foot:   '#3b82f6', // blue
  basket: '#f97316', // orange
  hand:   '#a855f7', // purple
  volley: '#22c55e', // green
};

// Softer tinted backgrounds for active sport chips
export const sportColorsSoft: Record<string, string> = {
  foot:   'rgba(59,130,246,0.12)',
  basket: 'rgba(249,115,22,0.12)',
  hand:   'rgba(168,85,247,0.12)',
  volley: 'rgba(34,197,94,0.12)',
};

export const lightColors = {
  bgApp:       '#f8f9fb',
  bgCard:      '#ffffff',
  bgCardElev:  '#f3f4f6',
  bgInput:     'rgba(0,0,0,0.04)',
  bgScrim:     'rgba(0,0,0,0.4)',
  borderFaint:    'rgba(0,0,0,0.06)',
  borderSubtle:   'rgba(0,0,0,0.10)',
  borderHairline: 'rgba(0,0,0,0.07)',
  textPrimary:   '#111827',
  textSecondary: '#374151',
  textTertiary:  '#6b7280',
  textMuted:     '#9ca3af',
  textDisabled:  '#d1d5db',
  textInvert:    '#ffffff',
  userPosition: '#3b82f6',
  liveRed:      '#ef4444',
};

export const darkColors = {
  bgApp:       '#0e0f12',
  bgCard:      '#15161a',
  bgCardElev:  '#1a1b1f',
  bgInput:     'rgba(255,255,255,0.05)',
  bgScrim:     'rgba(0,0,0,0.7)',
  borderFaint:    'rgba(255,255,255,0.05)',
  borderSubtle:   'rgba(255,255,255,0.08)',
  borderHairline: 'rgba(255,255,255,0.06)',
  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.75)',
  textTertiary:  'rgba(255,255,255,0.50)',
  textMuted:     'rgba(255,255,255,0.40)',
  textDisabled:  'rgba(255,255,255,0.25)',
  textInvert:    '#0e0f12',
  userPosition: '#5996d4',
  liveRed:      '#ff3b30',
};

// Type shared by both palettes — use this in makeStyles(colors: ColorPalette)
export type ColorPalette = typeof lightColors;

// Backward-compat alias — new code should use useColors() hook for dynamic theming
export const colors = lightColors;

export const radii = {
  chip:  999,
  tag:   10,
  input: 12,
  card:  16,
  sheet: 24,
  cta:   14,
};

// Kept for backward compatibility
export const theme = {
  sportColors,
  colors: {
    primary:       sportColors.foot,
    background:    lightColors.bgApp,
    white:         lightColors.bgCard,
    text:          lightColors.textPrimary,
    textSecondary: lightColors.textSecondary,
    textMuted:     lightColors.textMuted,
    border:        lightColors.borderHairline,
    borderDark:    lightColors.borderSubtle,
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
