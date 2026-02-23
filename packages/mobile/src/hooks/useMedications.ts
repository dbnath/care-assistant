import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {medicationsApi} from '../services/api/medications';
import {Medication} from '../types/medication';

export const useMedications = (
  patientId: string,
  activeOnly: boolean = true,
) => {
  return useQuery({
    queryKey: ['medications', patientId, activeOnly],
    queryFn: () => medicationsApi.getByPatientId(patientId, activeOnly),
    enabled: !!patientId,
  });
};

export const useCreateMedication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (medication: Omit<Medication, 'id'>) =>
      medicationsApi.create(medication),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['medications', variables.patient_id],
      });
    },
  });
};

export const useUpdateMedication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, data}: {id: string; data: Partial<Medication>}) =>
      medicationsApi.update(id, data),
    onSuccess: (data) => {
      if (data.patient_id) {
        queryClient.invalidateQueries({
          queryKey: ['medications', data.patient_id],
        });
      }
    },
  });
};

export const useDeactivateMedication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicationsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['medications']});
    },
  });
};
