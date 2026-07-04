import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#1A6FD4',
  normal: '#22C55E',
  watch: '#F59E0B',
  urgent: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
  },
};
