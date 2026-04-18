import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../context/AuthContext';
import {caregiversApi} from '../services/api/caregivers';
import {patientsApi} from '../services/api/patients';
import {Patient} from '../types/patient';

/**
 * Returns the correct patient list based on the logged-in user's role:
 *   founder   → all patients (GET /patients/)
 *   caregiver → assigned patients (GET /caregivers/{id}/patients)
 *   patient   → their own record as a single-item array
 *
 * The return shape matches usePatients() so all patient-picker screens
 * can swap in this hook without other changes.
 */
export const useRoleAwarePatients = () => {
  const {user} = useAuth();

  const founderQuery = useQuery({
    queryKey: ['patients'],
    queryFn: patientsApi.getAll,
    enabled: user?.role === 'founder',
  });

  const caregiverQuery = useQuery({
    queryKey: ['caregiver-patients', user?.id],
    queryFn: async (): Promise<Patient[]> => {
      if (!user?.id) {return [];}
      const summaries = await caregiversApi.getPatients(user.id);
      // PatientSummary → Patient (fields not in summary left as defaults;
      // patient-picker screens only use id, first_name, last_name, phone)
      return summaries.map(s => ({
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        email: s.email ?? undefined,
        phone: s.phone,
        date_of_birth: '',
        emergency_contacts: [],
      }));
    },
    enabled: user?.role === 'caregiver',
  });

  const patientQuery = useQuery({
    queryKey: ['patients', user?.patient_id],
    queryFn: async (): Promise<Patient[]> => {
      if (!user?.patient_id) {return [];}
      const patient = await patientsApi.getById(user.patient_id);
      return [patient];
    },
    enabled: user?.role === 'patient' && !!user?.patient_id,
  });

  if (user?.role === 'founder') {return founderQuery;}
  if (user?.role === 'caregiver') {return caregiverQuery;}
  return patientQuery;
};
