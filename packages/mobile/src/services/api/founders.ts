import apiClient from './client';
import {
  CaregiverEmploymentSummary,
  EmployCaregiverRequest,
  EmploymentResponse,
  FounderProfile,
} from '../../types/founder';

export const foundersApi = {
  getProfile: async (founderId: string): Promise<FounderProfile> => {
    const response = await apiClient.get<FounderProfile>(
      `/founders/${founderId}`,
    );
    return response.data;
  },

  listEmployedCaregivers: async (
    founderId: string,
  ): Promise<CaregiverEmploymentSummary[]> => {
    const response = await apiClient.get<CaregiverEmploymentSummary[]>(
      `/founders/${founderId}/caregivers`,
    );
    return response.data;
  },

  employCaregiver: async (
    founderId: string,
    body: EmployCaregiverRequest,
  ): Promise<EmploymentResponse> => {
    const response = await apiClient.post<EmploymentResponse>(
      `/founders/${founderId}/caregivers`,
      body,
    );
    return response.data;
  },

  terminateEmployment: async (
    founderId: string,
    caregiverId: string,
  ): Promise<void> => {
    await apiClient.delete(`/founders/${founderId}/caregivers/${caregiverId}`);
  },
};
