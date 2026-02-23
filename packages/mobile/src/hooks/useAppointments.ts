import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {appointmentsApi} from '../services/api/appointments';
import {Appointment} from '../types/appointment';

export const useAppointments = (
  patientId: string,
  fromDate?: string,
  toDate?: string,
) => {
  return useQuery({
    queryKey: ['appointments', patientId, fromDate, toDate],
    queryFn: () => appointmentsApi.getByPatientId(patientId, fromDate, toDate),
    enabled: !!patientId,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointment: Omit<Appointment, 'id'>) =>
      appointmentsApi.create(appointment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['appointments', variables.patient_id],
      });
    },
  });
};

export const useCompleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, notes}: {id: string; notes?: string}) =>
      appointmentsApi.complete(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['appointments']});
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['appointments']});
    },
  });
};
