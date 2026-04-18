import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {caregiversApi} from '../services/api/caregivers';
import {AssignPatientRequest} from '../types/caregiver';

export const useCaregivers = () =>
  useQuery({
    queryKey: ['caregivers'],
    queryFn: caregiversApi.listAll,
  });

export const useCaregiverPatients = (caregiverId: string) =>
  useQuery({
    queryKey: ['caregiver-patients', caregiverId],
    queryFn: () => caregiversApi.getPatients(caregiverId),
    enabled: !!caregiverId,
  });

export const useAssignPatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      caregiverId,
      body,
    }: {
      caregiverId: string;
      body: AssignPatientRequest;
    }) => caregiversApi.assignPatient(caregiverId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['caregiver-patients', variables.caregiverId],
      });
      queryClient.invalidateQueries({queryKey: ['caregivers']});
    },
  });
};

export const useUnassignPatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      caregiverId,
      patientId,
    }: {
      caregiverId: string;
      patientId: string;
    }) => caregiversApi.unassignPatient(caregiverId, patientId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['caregiver-patients', variables.caregiverId],
      });
      queryClient.invalidateQueries({queryKey: ['caregivers']});
    },
  });
};
