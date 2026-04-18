import apiClient from './client';
import {
  AssignPatientRequest,
  AssignmentResponse,
  CaregiverProfile,
  PatientSummary,
} from '../../types/caregiver';

export const caregiversApi = {
  listAll: async (): Promise<CaregiverProfile[]> => {
    const response = await apiClient.get<CaregiverProfile[]>('/caregivers/');
    return response.data;
  },

  getPatients: async (caregiverId: string): Promise<PatientSummary[]> => {
    const response = await apiClient.get<PatientSummary[]>(
      `/caregivers/${caregiverId}/patients`,
    );
    return response.data;
  },

  assignPatient: async (
    caregiverId: string,
    body: AssignPatientRequest,
  ): Promise<AssignmentResponse> => {
    const response = await apiClient.post<AssignmentResponse>(
      `/caregivers/${caregiverId}/patients`,
      body,
    );
    return response.data;
  },

  unassignPatient: async (
    caregiverId: string,
    patientId: string,
  ): Promise<void> => {
    await apiClient.delete(`/caregivers/${caregiverId}/patients/${patientId}`);
  },
};
