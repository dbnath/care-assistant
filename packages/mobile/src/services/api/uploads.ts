import apiClient from './client';

export interface UploadResponse {
  id: string;
  patient_id: string;
  file_type: string;
  filename: string;
  file_path: string;
  uploaded_at: string;
}

export const uploadsApi = {
  uploadFile: async (
    patientId: string,
    fileType: 'prescription' | 'report',
    file: {uri: string; name: string; type: string},
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('patient_id', patientId);
    formData.append('file_type', fileType);
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const response = await apiClient.post<UploadResponse>(
      '/uploads/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  getPatientUploads: async (patientId: string): Promise<UploadResponse[]> => {
    const response = await apiClient.get<UploadResponse[]>(`/uploads/${patientId}`);
    return response.data;
  },

  deleteUpload: async (uploadId: string): Promise<void> => {
    await apiClient.delete(`/uploads/${uploadId}`);
  },

  summarize: async (uploadId: string): Promise<string> => {
    const response = await apiClient.post<{summary: string}>(
      `/uploads/${uploadId}/summarize`,
    );
    return response.data.summary;
  },
};
