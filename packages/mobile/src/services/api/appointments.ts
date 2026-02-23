import apiClient from './client';
import {Appointment} from '../../types/appointment';

export const appointmentsApi = {
  create: async (
    appointment: Omit<Appointment, 'id'>,
  ): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>(
      '/appointments/',
      appointment,
    );
    return response.data;
  },

  getByPatientId: async (
    patientId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>(
      `/appointments/${patientId}`,
      {params: {from_date: fromDate, to_date: toDate}},
    );
    return response.data;
  },

  complete: async (id: string, notes?: string): Promise<void> => {
    await apiClient.patch(`/appointments/${id}/complete`, {notes});
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  },
};
