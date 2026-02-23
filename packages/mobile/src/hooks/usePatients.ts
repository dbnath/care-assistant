import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {patientsApi} from '../services/api/patients';
import {Patient} from '../types/patient';

export const usePatients = () => {
  return useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.getAll,
  });
};

export const usePatient = (id: string) => {
  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patient: Omit<Patient, 'id'>) => patientsApi.create(patient),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['patients']});
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, data}: {id: string; data: Partial<Patient>}) =>
      patientsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: ['patients']});
      queryClient.invalidateQueries({queryKey: ['patients', variables.id]});
    },
  });
};

export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['patients']});
    },
  });
};
