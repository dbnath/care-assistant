import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {uploadsApi, UploadResponse} from '../services/api/uploads';

export const useUploads = (patientId: string) => {
  return useQuery<UploadResponse[]>({
    queryKey: ['uploads', patientId],
    queryFn: () => uploadsApi.getPatientUploads(patientId),
    enabled: !!patientId,
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      patientId,
      fileType,
      file,
    }: {
      patientId: string;
      fileType: 'prescription' | 'report';
      file: {uri: string; name: string; type: string};
    }) => uploadsApi.uploadFile(patientId, fileType, file),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['uploads', variables.patientId]});
    },
  });
};

export const useDeleteUpload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uploadId: string) => uploadsApi.deleteUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['uploads']});
    },
  });
};

export const useSummarize = () => {
  return useMutation({
    mutationFn: (uploadId: string) => uploadsApi.summarize(uploadId),
  });
};
