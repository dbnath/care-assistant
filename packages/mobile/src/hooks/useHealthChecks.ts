import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {healthApi} from '../services/api/health';
import {HealthCheck} from '../types/health';

export const useHealthChecks = (patientId: string) => {
  return useQuery({
    queryKey: ['health-checks', patientId],
    queryFn: () => healthApi.getByPatientId(patientId),
    enabled: !!patientId,
  });
};

export const useCreateHealthCheck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (healthCheck: Omit<HealthCheck, 'id'>) =>
      healthApi.create(healthCheck),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['health-checks', variables.patient_id],
      });
    },
  });
};
