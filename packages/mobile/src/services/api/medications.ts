import apiClient from './client';
import {Medication} from '../../types/medication';

export const medicationsApi = {
  create: async (medication: Omit<Medication, 'id'>): Promise<Medication> => {
    const response = await apiClient.post<Medication>(
      '/medications/',
      medication,
    );
    return response.data;
  },

  getByPatientId: async (
    patientId: string,
    activeOnly: boolean = true,
  ): Promise<Medication[]> => {
    const response = await apiClient.get<Medication[]>(
      `/medications/${patientId}`,
      {params: {active_only: activeOnly}},
    );
    return response.data;
  },

  update: async (
    id: string,
    medication: Partial<Medication>,
  ): Promise<Medication> => {
    const response = await apiClient.patch<Medication>(
      `/medications/${id}`,
      medication,
    );
    return response.data;
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.delete(`/medications/${id}`);
  },
};
