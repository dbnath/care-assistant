import {useMemo} from 'react';
import {useQueries} from '@tanstack/react-query';
import {useAuth} from '../context/AuthContext';
import {appointmentsApi} from '../services/api/appointments';
import {useCaregivers, useCaregiverPatients} from './useCaregivers';
import {useEmployedCaregivers} from './useFounders';
import {useHealthChecks} from './useHealthChecks';
import {useMedications} from './useMedications';
import {usePatients} from './usePatients';
import {useAppointments} from './useAppointments';

export interface StatItem {
  label: string;
  value: number | null; // null = still loading → shows '—'
}

export function useHomeStats(): StatItem[] {
  const {user} = useAuth();
  const isFounder = user?.role === 'founder';
  const isCaregiver = user?.role === 'caregiver';
  const isPatient = user?.role === 'patient';

  // ── Shared ──────────────────────────────────────────────────────────────
  // Both founder and caregiver need all patients to compute "Unassigned" count
  const {data: allPatients} = usePatients();

  // Both need the full caregivers list (with assigned_patients) for unassigned math
  const {data: allCaregivers} = useCaregivers();

  // ── Founder ──────────────────────────────────────────────────────────────
  const {data: employedCaregivers} = useEmployedCaregivers(
    isFounder ? (user?.id ?? '') : '',
  );

  // ── Caregiver ─────────────────────────────────────────────────────────────
  const {data: myPatients} = useCaregiverPatients(
    isCaregiver ? (user?.id ?? '') : '',
  );

  // One appointments query per assigned patient (for Today's Appts stat)
  const apptQueries = useQueries({
    queries: isCaregiver && myPatients
      ? myPatients.map(p => ({
          queryKey: ['appointments', p.id] as const,
          queryFn: () => appointmentsApi.getByPatientId(p.id!),
          enabled: !!p.id,
        }))
      : [],
  });

  // ── Patient ───────────────────────────────────────────────────────────────
  const patientId = isPatient ? (user?.patient_id ?? '') : '';
  const {data: myMedications} = useMedications(patientId);
  const {data: myAppointments} = useAppointments(patientId);
  const {data: myHealthChecks} = useHealthChecks(patientId);

  // ── Compute ───────────────────────────────────────────────────────────────
  return useMemo<StatItem[]>(() => {
    const assignedPatientIds = new Set(
      (allCaregivers ?? []).flatMap(c =>
        c.assigned_patients.map(p => p.id),
      ),
    );

    if (isFounder) {
      const unassigned =
        allPatients && allCaregivers
          ? allPatients.filter(p => !p.id || !assignedPatientIds.has(p.id)).length
          : null;
      return [
        {label: 'Total Patients', value: allPatients?.length ?? null},
        {label: 'Caregivers', value: employedCaregivers?.length ?? null},
        {label: 'Unassigned', value: unassigned},
      ];
    }

    if (isCaregiver) {
      const today = new Date().toDateString();
      const apptsDone = apptQueries.every(q => !q.isLoading);
      const todayAppts = apptsDone
        ? apptQueries
            .flatMap(q => q.data ?? [])
            .filter(
              a =>
                !a.completed &&
                new Date(a.scheduled_at).toDateString() === today,
            ).length
        : null;
      const unassigned =
        allPatients && allCaregivers
          ? allPatients.filter(p => !p.id || !assignedPatientIds.has(p.id)).length
          : null;
      return [
        {label: 'My Patients', value: myPatients?.length ?? null},
        {label: "Today's Appts", value: todayAppts},
        {label: 'Unassigned Pts', value: unassigned},
      ];
    }

    if (isPatient) {
      const today = new Date().toDateString();
      const hasCheckToday = (myHealthChecks ?? []).some(
        h => h.checked_at && new Date(h.checked_at).toDateString() === today,
      );
      const upcoming = (myAppointments ?? []).filter(
        a => !a.completed && new Date(a.scheduled_at) > new Date(),
      ).length;
      return [
        {label: 'My Medications', value: myMedications?.length ?? null},
        {label: 'Upcoming Appts', value: myAppointments ? upcoming : null},
        {
          label: 'Health Check',
          value: myHealthChecks ? (hasCheckToday ? 0 : 1) : null,
        },
      ];
    }

    return [];
  }, [
    isFounder,
    isCaregiver,
    isPatient,
    allPatients,
    allCaregivers,
    employedCaregivers,
    myPatients,
    apptQueries,
    myMedications,
    myAppointments,
    myHealthChecks,
  ]);
}
