import apiClient from './client';
import {LoginRequest, RegisterRequest, TokenResponse, AuthUser} from '../../types/auth';

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<TokenResponse>('/auth/register', data).then(r => r.data),

  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>('/auth/login', data).then(r => r.data),

  getMe: () =>
    apiClient.get<AuthUser>('/auth/me').then(r => r.data),
};
