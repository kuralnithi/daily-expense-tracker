import { MD3LightTheme } from 'react-native-paper';
import { COLORS } from '../utils/constants';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.card,
    onSurface: COLORS.text,
    outline: COLORS.border,
    error: COLORS.danger,
    primaryContainer: COLORS.primaryLight,
    secondaryContainer: COLORS.secondaryLight,
  },
  roundness: 12,
};

export type AppTheme = typeof theme;
