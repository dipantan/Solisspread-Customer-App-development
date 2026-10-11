import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#0D2F5F',
  secondary: '#1E4E8C',
  primaryDeep: '#071838',
  primaryDark: '#0A2D54',
  primaryDarker: '#051329',
  primaryNavy: '#0B1E3D',
  primaryDarkBlue: '#1a365d',
  accent: '#F6B000',
  accentLight: '#FFD54A',
  success: '#22C55E',
  successAlt: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#1D61E7',
  infoLight: '#EFF6FF',
  successLight: '#ECFDF5',
  successLightBorder: '#D1FAE5',
  errorLight: '#FEF2F2',
  background: '#F7F9FC',
  backgroundLight: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E7ECF2',
  borderDark: '#071838',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  divider: '#EDF2F7',
  black: '#000',
  blackHex: '#000000',
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
};

export const GRADIENTS = {
  splash: [COLORS.primaryDarker, COLORS.primaryDark, COLORS.primaryDeep] as [string, string, string],
  animatedHeader: [COLORS.primaryDeep, COLORS.primaryDarkBlue, COLORS.primaryDeep] as [string, string, string],
  animatedHome: [
    COLORS.primary,
    COLORS.secondary,
    COLORS.primaryDeep,
  ] as [string, string, string],
};

export const RADIUS = {
  card: 20,
  button: 10,
  input: 10,
  bottomSheet: 28,
  modal: 28,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  card: {
    shadowColor: '#0D2F5F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },
};

export const COMMON_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDeep,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
