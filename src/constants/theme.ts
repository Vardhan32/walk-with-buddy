// ====================================================================
// WALK WITH BUDDY - DESIGN SYSTEM & THEME
// ====================================================================

export const Colors = {
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    surfaceSubtle: '#E2E8F0',
    primary: '#0D9488', // Friendly teal/emerald for outdoor exploration
    primaryLight: '#CCFBF1',
    primaryDark: '#0F766E',
    secondary: '#3B82F6', // Blue for connectivity
    secondaryLight: '#DBEAFE',
    accent: '#F59E0B', // Amber for activity & warmth
    accentLight: '#FEF3C7',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    tabBar: '#FFFFFF',
    tabBarActive: '#0D9488',
    tabBarInactive: '#94A3B8',
  },
  dark: {
    background: '#090D16',
    card: '#131B2E',
    surface: '#1A243B',
    surfaceSubtle: '#243252',
    primary: '#14B8A6',
    primaryLight: '#134E48',
    primaryDark: '#0D9488',
    secondary: '#60A5FA',
    secondaryLight: '#1E3A8A',
    accent: '#FBBF24',
    accentLight: '#78350F',
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    border: '#1E293B',
    borderStrong: '#334155',
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    danger: '#F87171',
    dangerLight: '#7F1D1D',
    tabBar: '#0D1322',
    tabBarActive: '#14B8A6',
    tabBarInactive: '#64748B',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const Typography = {
  titleLarge: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
