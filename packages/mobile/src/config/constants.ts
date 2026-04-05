import {Platform} from 'react-native';

export const API_CONFIG = {
  // Android emulator routes host traffic through 10.0.2.2; iOS simulator uses localhost
  BASE_URL:
    Platform.OS === 'android'
      ? 'http://10.0.2.2:8000/api/v1'
      : 'http://localhost:8000/api/v1',
  TIMEOUT: 10000,
};

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  text: '#000000',
  textSecondary: '#8E8E93',
  white: '#FFFFFF',
  border: '#E5E5E5',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
