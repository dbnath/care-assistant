import apiClient from './client';
import {Patient} from '../../types/patient';

export const patientsApi = {
  getAll: async (): Promise<Patient[]> => {
    const response = await apiClient.get<Patient[]>('/patients/');
    return response.data;
  },

  getById: async (id: string): Promise<Patient> => {
    const response = await apiClient.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  create: async (patient: Omit<Patient, 'id'>): Promise<Patient> => {
    const response = await apiClient.post<Patient>('/patients/', patient);
    return response.data;
  },

  update: async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    const response = await apiClient.patch<Patient>(`/patients/${id}`, patient);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  },
};
