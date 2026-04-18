import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {foundersApi} from '../services/api/founders';
import {EmployCaregiverRequest} from '../types/founder';

export const useFounderProfile = (founderId: string) =>
  useQuery({
    queryKey: ['founder', founderId],
    queryFn: () => foundersApi.getProfile(founderId),
    enabled: !!founderId,
  });

export const useEmployedCaregivers = (founderId: string) =>
  useQuery({
    queryKey: ['founder-caregivers', founderId],
    queryFn: () => foundersApi.listEmployedCaregivers(founderId),
    enabled: !!founderId,
  });

export const useEmployCaregiver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      founderId,
      body,
    }: {
      founderId: string;
      body: EmployCaregiverRequest;
    }) => foundersApi.employCaregiver(founderId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['founder-caregivers', variables.founderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['founder', variables.founderId],
      });
      queryClient.invalidateQueries({queryKey: ['caregivers']});
    },
  });
};

export const useTerminateEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      founderId,
      caregiverId,
    }: {
      founderId: string;
      caregiverId: string;
    }) => foundersApi.terminateEmployment(founderId, caregiverId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['founder-caregivers', variables.founderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['founder', variables.founderId],
      });
      queryClient.invalidateQueries({queryKey: ['caregivers']});
    },
  });
};
