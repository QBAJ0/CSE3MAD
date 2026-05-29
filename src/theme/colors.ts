export type ColorTokens = {
  // Backgrounds
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceRaised: string;

  // Brand
  primary: string;
  primaryLight: string;
  cta: string;
  ctaLight: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;

  // Borders
  border: string;
  borderFaint: string;

  // Semantic
  info: string;
  infoLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  success: string;
  successLight: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
  tabActiveGlow: string;

  // Navigation header
  header: string;
  headerText: string;

  // Input
  input: string;
  inputBorder: string;
  inputFilled: string;
  inputFilledBorder: string;
};

export const lightColors: ColorTokens = {
  background: '#FFF7ED',
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',

  primary: '#0F766E',
  primaryLight: '#ECFDF5',
  cta: '#F97316',
  ctaLight: '#FFEDD5',

  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  border: '#E2E8F0',
  borderFaint: '#F1F5F9',

  info: '#2563EB',
  infoLight: '#EFF6FF',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  success: '#0F766E',
  successLight: '#ECFDF5',

  tabBar: '#FFFFFF',
  tabBarBorder: '#F1F5F9',
  tabActive: '#F97316',
  tabInactive: '#94A3B8',
  tabActiveGlow: 'rgba(249,115,22,0.16)',

  header: '#0F766E',
  headerText: '#FFFFFF',

  input: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputFilled: '#FFFFFF',
  inputFilledBorder: '#2563EB',
};

export const darkColors: ColorTokens = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: '#1E293B',
  surfaceRaised: '#293548',

  primary: '#14B8A6',
  primaryLight: '#134E4A',
  cta: '#FB923C',
  ctaLight: '#431407',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  border: '#334155',
  borderFaint: '#1E293B',

  info: '#60A5FA',
  infoLight: '#1E3A5F',
  danger: '#F87171',
  dangerLight: '#450A0A',
  warning: '#FBBF24',
  warningLight: '#422006',
  success: '#14B8A6',
  successLight: '#134E4A',

  tabBar: '#1E293B',
  tabBarBorder: '#334155',
  tabActive: '#FB923C',
  tabInactive: '#64748B',
  tabActiveGlow: 'rgba(251,146,60,0.2)',

  header: '#1E293B',
  headerText: '#F8FAFC',

  input: '#1E293B',
  inputBorder: '#334155',
  inputFilled: '#293548',
  inputFilledBorder: '#60A5FA',
};
