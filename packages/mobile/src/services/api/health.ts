import apiClient from './client';
import {HealthCheck} from '../../types/health';

export const healthApi = {
  create: async (healthCheck: Omit<HealthCheck, 'id'>): Promise<HealthCheck> => {
    const response = await apiClient.post<HealthCheck>(
      '/health/checks',
      healthCheck,
    );
    return response.data;
  },

  getByPatientId: async (patientId: string): Promise<HealthCheck[]> => {
    const response = await apiClient.get<HealthCheck[]>(
      `/health/checks/${patientId}`,
    );
    return response.data;
  },
};
