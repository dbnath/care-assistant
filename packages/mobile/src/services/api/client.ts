import axios from 'axios';
import {Platform} from 'react-native';

// Android emulator routes host traffic through 10.0.2.2; iOS simulator uses localhost
const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/v1'
    : 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async config => {
    // TODO: Add auth token from AsyncStorage when authentication is implemented
    // const token = await AsyncStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      // await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  },
);

export default apiClient;
