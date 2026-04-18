# Role-Based Dashboard & Patient–Caregiver Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the mobile app's role-based dashboard (per-role stats) and patient–caregiver assignment UI (founder employs caregivers, assigns patients; caregivers see only their assigned patients).

**Architecture:** A single `useRoleAwarePatients()` hook encapsulates role branching — founders get all patients, caregivers get their assigned patients, patients get themselves. A `useHomeStats()` hook computes role-specific dashboard stats. All new screens follow the existing full-screen stack navigation pattern.

**Tech Stack:** React Native 0.73, TypeScript, TanStack Query v5, React Navigation v6 (stack), Axios

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `src/types/caregiver.ts` | Types mirroring backend caregiver models |
| `src/types/founder.ts` | Types mirroring backend founder models |
| `src/services/api/caregivers.ts` | Axios calls to `/caregivers/*` endpoints |
| `src/services/api/founders.ts` | Axios calls to `/founders/*` endpoints |
| `src/hooks/useCaregivers.ts` | React Query hooks for caregiver operations |
| `src/hooks/useFounders.ts` | React Query hooks for founder operations |
| `src/hooks/useRoleAwarePatients.ts` | Role-branching patient list hook |
| `src/hooks/useHomeStats.ts` | Role-specific dashboard stats computation |
| `src/screens/caregivers/CaregiversScreen.tsx` | Founder: list employed caregivers |
| `src/screens/caregivers/CaregiverDetailScreen.tsx` | Founder: caregiver profile + assigned patients |
| `src/screens/caregivers/AssignPatientScreen.tsx` | Founder: assign unassigned patient to caregiver |
| `src/screens/caregivers/EmployCaregiverScreen.tsx` | Founder: employ a registered caregiver |
| `src/screens/caregivers/AssignCaregiverToPatientScreen.tsx` | Founder: assign caregiver from patient detail |

### Modified files
| File | Change |
|------|--------|
| `src/navigation/types.ts` | Add 5 new screen params |
| `src/navigation/AppNavigator.tsx` | Register 5 new screens |
| `src/screens/HomeScreen.tsx` | Role stats, Caregivers card, patient nav intercept |
| `src/screens/patients/PatientsScreen.tsx` | Swap to `useRoleAwarePatients`, hide FAB for caregivers |
| `src/screens/medications/MedicationsScreen.tsx` | Swap to `useRoleAwarePatients` |
| `src/screens/appointments/AppointmentsScreen.tsx` | Swap to `useRoleAwarePatients` |
| `src/screens/uploads/UploadsScreen.tsx` | Swap to `useRoleAwarePatients` |
| `src/screens/patients/PatientDetailScreen.tsx` | Add Assigned Caregivers section (founder only) |

---

## Task 1: TypeScript Types

**Files:**
- Create: `packages/mobile/src/types/caregiver.ts`
- Create: `packages/mobile/src/types/founder.ts`

- [ ] **Step 1: Create caregiver types**

`packages/mobile/src/types/caregiver.ts`:
```typescript
export interface PatientSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  assigned_at: string;
  assignment_notes: string | null;
}

export interface CaregiverProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  assigned_patients: PatientSummary[];
}

export interface AssignPatientRequest {
  patient_id: string;
  notes?: string;
}

export interface AssignmentResponse {
  id: string;
  caregiver_id: string;
  patient_id: string;
  assigned_at: string;
  notes: string | null;
}
```

- [ ] **Step 2: Create founder types**

`packages/mobile/src/types/founder.ts`:
```typescript
export interface CaregiverEmploymentSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  employed_at: string;
  job_title: string | null;
  employment_notes: string | null;
}

export interface FounderProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  employed_caregivers: CaregiverEmploymentSummary[];
}

export interface EmployCaregiverRequest {
  caregiver_id: string;
  job_title?: string;
  notes?: string;
}

export interface EmploymentResponse {
  id: string;
  founder_id: string;
  caregiver_id: string;
  employed_at: string;
  job_title: string | null;
  notes: string | null;
}
```

- [ ] **Step 3: Verify types compile**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors (no files import these yet).

- [ ] **Step 4: Commit**

```bash
git add packages/mobile/src/types/caregiver.ts packages/mobile/src/types/founder.ts
git commit -m "feat(mobile): add TypeScript types for caregiver and founder models"
```

---

## Task 2: Caregiver API Service

**Files:**
- Create: `packages/mobile/src/services/api/caregivers.ts`

- [ ] **Step 1: Create caregiver API service**

`packages/mobile/src/services/api/caregivers.ts`:
```typescript
import apiClient from './client';
import {
  AssignPatientRequest,
  AssignmentResponse,
  CaregiverProfile,
  PatientSummary,
} from '../../types/caregiver';

export const caregiversApi = {
  listAll: async (): Promise<CaregiverProfile[]> => {
    const response = await apiClient.get<CaregiverProfile[]>('/caregivers/');
    return response.data;
  },

  getPatients: async (caregiverId: string): Promise<PatientSummary[]> => {
    const response = await apiClient.get<PatientSummary[]>(
      `/caregivers/${caregiverId}/patients`,
    );
    return response.data;
  },

  assignPatient: async (
    caregiverId: string,
    body: AssignPatientRequest,
  ): Promise<AssignmentResponse> => {
    const response = await apiClient.post<AssignmentResponse>(
      `/caregivers/${caregiverId}/patients`,
      body,
    );
    return response.data;
  },

  unassignPatient: async (
    caregiverId: string,
    patientId: string,
  ): Promise<void> => {
    await apiClient.delete(`/caregivers/${caregiverId}/patients/${patientId}`);
  },
};
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/services/api/caregivers.ts
git commit -m "feat(mobile): add caregiver API service"
```

---

## Task 3: Founder API Service

**Files:**
- Create: `packages/mobile/src/services/api/founders.ts`

- [ ] **Step 1: Create founder API service**

`packages/mobile/src/services/api/founders.ts`:
```typescript
import apiClient from './client';
import {
  CaregiverEmploymentSummary,
  EmployCaregiverRequest,
  EmploymentResponse,
  FounderProfile,
} from '../../types/founder';

export const foundersApi = {
  getProfile: async (founderId: string): Promise<FounderProfile> => {
    const response = await apiClient.get<FounderProfile>(
      `/founders/${founderId}`,
    );
    return response.data;
  },

  listEmployedCaregivers: async (
    founderId: string,
  ): Promise<CaregiverEmploymentSummary[]> => {
    const response = await apiClient.get<CaregiverEmploymentSummary[]>(
      `/founders/${founderId}/caregivers`,
    );
    return response.data;
  },

  employCaregiver: async (
    founderId: string,
    body: EmployCaregiverRequest,
  ): Promise<EmploymentResponse> => {
    const response = await apiClient.post<EmploymentResponse>(
      `/founders/${founderId}/caregivers`,
      body,
    );
    return response.data;
  },

  terminateEmployment: async (
    founderId: string,
    caregiverId: string,
  ): Promise<void> => {
    await apiClient.delete(`/founders/${founderId}/caregivers/${caregiverId}`);
  },
};
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/services/api/founders.ts
git commit -m "feat(mobile): add founder API service"
```

---

## Task 4: useCaregivers Hook

**Files:**
- Create: `packages/mobile/src/hooks/useCaregivers.ts`

- [ ] **Step 1: Create hook**

`packages/mobile/src/hooks/useCaregivers.ts`:
```typescript
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
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/hooks/useCaregivers.ts
git commit -m "feat(mobile): add useCaregivers hook"
```

---

## Task 5: useFounders Hook

**Files:**
- Create: `packages/mobile/src/hooks/useFounders.ts`

- [ ] **Step 1: Create hook**

`packages/mobile/src/hooks/useFounders.ts`:
```typescript
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
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/hooks/useFounders.ts
git commit -m "feat(mobile): add useFounders hook"
```

---

## Task 6: useRoleAwarePatients Hook

**Files:**
- Create: `packages/mobile/src/hooks/useRoleAwarePatients.ts`

- [ ] **Step 1: Create hook**

`packages/mobile/src/hooks/useRoleAwarePatients.ts`:
```typescript
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
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/hooks/useRoleAwarePatients.ts
git commit -m "feat(mobile): add useRoleAwarePatients hook for role-aware patient filtering"
```

---

## Task 7: useHomeStats Hook

**Files:**
- Create: `packages/mobile/src/hooks/useHomeStats.ts`

- [ ] **Step 1: Create hook**

`packages/mobile/src/hooks/useHomeStats.ts`:
```typescript
import {useMemo} from 'react';
import {useQueries} from '@tanstack/react-query';
import {useAuth} from '../context/AuthContext';
import {appointmentsApi} from '../services/api/appointments';
import {patientsApi} from '../services/api/patients';
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
          ? allPatients.filter(p => !assignedPatientIds.has(p.id)).length
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
          ? allPatients.filter(p => !assignedPatientIds.has(p.id)).length
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
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/hooks/useHomeStats.ts
git commit -m "feat(mobile): add useHomeStats hook for role-specific dashboard stats"
```

---

## Task 8: Navigation Types & AppNavigator

**Files:**
- Modify: `packages/mobile/src/navigation/types.ts`
- Modify: `packages/mobile/src/navigation/AppNavigator.tsx`

- [ ] **Step 1: Add new screen params to types.ts**

Replace the contents of `packages/mobile/src/navigation/types.ts`:
```typescript
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  // Patients
  Patients: undefined;
  PatientDetail: {patientId: string};
  AddEditPatient: {patientId?: string};
  // Caregivers (founder-only)
  Caregivers: undefined;
  CaregiverDetail: {caregiverId: string};
  AssignPatient: {caregiverId: string};
  EmployCaregiver: undefined;
  AssignCaregiverToPatient: {patientId: string};
  // Medications
  Medications: undefined;
  MedicationList: {patientId: string; patientName: string};
  AddEditMedication: {patientId: string; medicationId?: string};
  // Appointments
  Appointments: undefined;
  AppointmentList: {patientId: string; patientName: string};
  AddEditAppointment: {patientId: string; appointmentId?: string};
  // Uploads
  Uploads: undefined;
  UploadList: {patientId: string; patientName: string};
};
```

- [ ] **Step 2: Register new screens in AppNavigator.tsx**

Add imports after the existing screen imports:
```typescript
import CaregiversScreen from '../screens/caregivers/CaregiversScreen';
import CaregiverDetailScreen from '../screens/caregivers/CaregiverDetailScreen';
import AssignPatientScreen from '../screens/caregivers/AssignPatientScreen';
import EmployCaregiverScreen from '../screens/caregivers/EmployCaregiverScreen';
import AssignCaregiverToPatientScreen from '../screens/caregivers/AssignCaregiverToPatientScreen';
```

Add these stack entries inside `MainNavigator`, after the `AddEditPatient` entry:
```tsx
<MainStack.Screen name="Caregivers" component={CaregiversScreen} options={{title: 'Caregivers'}} />
<MainStack.Screen name="CaregiverDetail" component={CaregiverDetailScreen} options={{title: ''}} />
<MainStack.Screen name="AssignPatient" component={AssignPatientScreen} options={{title: 'Assign Patient'}} />
<MainStack.Screen name="EmployCaregiver" component={EmployCaregiverScreen} options={{title: 'Employ Caregiver'}} />
<MainStack.Screen name="AssignCaregiverToPatient" component={AssignCaregiverToPatientScreen} options={{title: 'Assign Caregiver'}} />
```

- [ ] **Step 3: Verify (the new screen files don't exist yet — expect import errors)**

```bash
cd packages/mobile && npm run type-check 2>&1 | grep -v "Cannot find module.*caregivers" | head -20
```
Expected: only "Cannot find module" errors for the 5 caregiver screen files (they'll be created in subsequent tasks). No other errors.

- [ ] **Step 4: Commit**

```bash
git add packages/mobile/src/navigation/types.ts packages/mobile/src/navigation/AppNavigator.tsx
git commit -m "feat(mobile): add caregiver management screens to navigation"
```

---

## Task 9: CaregiversScreen

**Files:**
- Create: `packages/mobile/src/screens/caregivers/CaregiversScreen.tsx`

- [ ] **Step 1: Create screen**

`packages/mobile/src/screens/caregivers/CaregiversScreen.tsx`:
```typescript
import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useEmployedCaregivers} from '../../hooks/useFounders';
import {useAuth} from '../../context/AuthContext';
import {CaregiverEmploymentSummary} from '../../types/founder';

type NavProp = StackNavigationProp<RootStackParamList, 'Caregivers'>;

function CaregiverRow({
  caregiver,
  onPress,
}: {
  caregiver: CaregiverEmploymentSummary;
  onPress: () => void;
}) {
  const initials =
    `${caregiver.first_name[0]}${caregiver.last_name[0]}`.toUpperCase();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={styles.rowAvatar}>
        <Text style={styles.rowAvatarText}>{initials}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>
          {caregiver.first_name} {caregiver.last_name}
        </Text>
        <Text style={styles.rowSub}>
          {caregiver.job_title ?? 'Caregiver'} · {caregiver.email}
        </Text>
      </View>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function CaregiversScreen() {
  const navigation = useNavigation<NavProp>();
  const {user} = useAuth();
  const founderId = user?.id ?? '';

  const {
    data: caregivers,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useEmployedCaregivers(founderId);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!caregivers) {return [];}
    const q = search.trim().toLowerCase();
    if (!q) {return caregivers;}
    return caregivers.filter(
      c =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        (c.job_title ?? '').toLowerCase().includes(q),
    );
  }, [caregivers, search]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Could not load caregivers.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search caregivers…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
        contentContainerStyle={
          filtered.length === 0 ? styles.listEmpty : styles.list
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({item}) => (
          <CaregiverRow
            caregiver={item}
            onPress={() =>
              navigation.navigate('CaregiverDetail', {caregiverId: item.id})
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>👤</Text>
            <Text style={styles.emptyTitle}>
              {search ? 'No caregivers match your search.' : 'No caregivers employed yet.'}
            </Text>
            {!search && (
              <Text style={styles.emptySub}>
                Tap the button below to employ your first caregiver.
              </Text>
            )}
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EmployCaregiver')}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: COLORS.background},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  bigIcon: {fontSize: 48, marginBottom: SPACING.md, textAlign: 'center'},
  errorTitle: {fontSize: 15, color: COLORS.error, marginBottom: SPACING.lg},
  retryBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},

  searchWrap: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {fontSize: 14, marginRight: 4},
  searchInput: {flex: 1, height: 40, fontSize: 14, color: COLORS.text},

  list: {padding: SPACING.lg, paddingBottom: 80},
  listEmpty: {flex: 1, justifyContent: 'center'},
  separator: {height: SPACING.sm},

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowAvatarText: {fontSize: 15, fontWeight: '700', color: COLORS.secondary},
  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  rowSub: {fontSize: 12, color: COLORS.textSecondary},
  rowChevron: {fontSize: 22, color: COLORS.border, marginLeft: SPACING.xs},

  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {fontSize: 13, color: COLORS.textSecondary, textAlign: 'center'},

  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {fontSize: 28, color: COLORS.white, lineHeight: 32},
});
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check 2>&1 | grep -v "Cannot find module.*caregivers/(Caregiver|Assign|Employ)" | head -20
```
Expected: only remaining "Cannot find module" errors for the 4 caregiver screens not yet created.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/screens/caregivers/CaregiversScreen.tsx
git commit -m "feat(mobile): add CaregiversScreen for founder caregiver management"
```

---

## Task 10: CaregiverDetailScreen

**Files:**
- Create: `packages/mobile/src/screens/caregivers/CaregiverDetailScreen.tsx`

- [ ] **Step 1: Create screen**

`packages/mobile/src/screens/caregivers/CaregiverDetailScreen.tsx`:
```typescript
import React, {useLayoutEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {
  useCaregiverPatients,
  useUnassignPatient,
} from '../../hooks/useCaregivers';
import {CaregiverProfile} from '../../types/caregiver';
import {useCaregivers} from '../../hooks/useCaregivers';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CaregiverDetail'>;
  route: RouteProp<RootStackParamList, 'CaregiverDetail'>;
};

export default function CaregiverDetailScreen({navigation, route}: Props) {
  const {caregiverId} = route.params;
  const {data: allCaregivers, isLoading, isError, refetch, isFetching} =
    useCaregivers();
  const {mutate: unassign, isPending: isUnassigning} = useUnassignPatient();

  const caregiver: CaregiverProfile | undefined = allCaregivers?.find(
    c => c.id === caregiverId,
  );

  useLayoutEffect(() => {
    if (!caregiver) {return;}
    navigation.setOptions({
      title: `${caregiver.first_name} ${caregiver.last_name}`,
    });
  }, [navigation, caregiver]);

  function handleUnassign(patientId: string, patientName: string) {
    Alert.alert(
      'Remove Patient',
      `Remove ${patientName} from this caregiver?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => unassign({caregiverId, patientId}),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  if (isError || !caregiver) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.errorText}>Could not load caregiver.</Text>
      </View>
    );
  }

  const initials =
    `${caregiver.first_name[0]}${caregiver.last_name[0]}`.toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={refetch} />
      }
      showsVerticalScrollIndicator={false}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {caregiver.first_name} {caregiver.last_name}
        </Text>
        {caregiver.job_title ? (
          <Text style={styles.jobTitle}>{caregiver.job_title}</Text>
        ) : null}
      </View>

      {/* Contact info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{caregiver.email}</Text>
        </View>
        {caregiver.phone ? (
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{caregiver.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* Assigned patients */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            Assigned Patients ({caregiver.assigned_patients.length})
          </Text>
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={() =>
              navigation.navigate('AssignPatient', {caregiverId})
            }>
            <Text style={styles.assignBtnText}>+ Assign</Text>
          </TouchableOpacity>
        </View>

        {caregiver.assigned_patients.length === 0 ? (
          <Text style={styles.noPatients}>No patients assigned yet.</Text>
        ) : (
          caregiver.assigned_patients.map((patient, idx) => (
            <View
              key={patient.id}
              style={[
                styles.patientRow,
                idx < caregiver.assigned_patients.length - 1 &&
                  styles.patientRowBorder,
              ]}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>
                  {patient.first_name} {patient.last_name}
                </Text>
                <Text style={styles.patientSub}>{patient.phone}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  handleUnassign(
                    patient.id,
                    `${patient.first_name} ${patient.last_name}`,
                  )
                }
                disabled={isUnassigning}
                style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  errorText: {fontSize: 15, color: COLORS.error},
  container: {flex: 1, backgroundColor: COLORS.background},
  content: {paddingBottom: SPACING.xl},

  header: {
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {fontSize: 28, fontWeight: '700', color: COLORS.white},
  name: {fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 4},
  jobTitle: {fontSize: 14, color: 'rgba(255,255,255,0.8)'},

  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  assignBtn: {
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assignBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLast: {borderBottomWidth: 0},
  infoLabel: {fontSize: 14, color: COLORS.textSecondary},
  infoValue: {fontSize: 14, color: COLORS.text, fontWeight: '500'},

  noPatients: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingVertical: SPACING.md,
    textAlign: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  patientRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  patientInfo: {flex: 1},
  patientName: {fontSize: 15, fontWeight: '600', color: COLORS.text},
  patientSub: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  removeBtn: {
    padding: SPACING.sm,
  },
  removeBtnText: {fontSize: 16, color: COLORS.error, fontWeight: '700'},
});
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check 2>&1 | grep -v "Cannot find module.*caregivers/(Assign|Employ)" | head -20
```
Expected: only "Cannot find module" errors for the 3 remaining caregiver screens.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/screens/caregivers/CaregiverDetailScreen.tsx
git commit -m "feat(mobile): add CaregiverDetailScreen"
```

---

## Task 11: AssignPatientScreen

**Files:**
- Create: `packages/mobile/src/screens/caregivers/AssignPatientScreen.tsx`

- [ ] **Step 1: Create screen**

`packages/mobile/src/screens/caregivers/AssignPatientScreen.tsx`:
```typescript
import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useCaregivers, useAssignPatient} from '../../hooks/useCaregivers';
import {usePatients} from '../../hooks/usePatients';
import {Patient} from '../../types/patient';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'AssignPatient'>;
  route: RouteProp<RootStackParamList, 'AssignPatient'>;
};

export default function AssignPatientScreen({navigation, route}: Props) {
  const {caregiverId} = route.params;
  const {data: allPatients, isLoading: loadingPatients} = usePatients();
  const {data: allCaregivers, isLoading: loadingCaregivers} = useCaregivers();
  const {mutate: assignPatient, isPending} = useAssignPatient();
  const [search, setSearch] = useState('');

  // Compute pool of unassigned patients
  const unassigned = useMemo(() => {
    if (!allPatients || !allCaregivers) {return [];}
    const assignedIds = new Set(
      allCaregivers.flatMap(c => c.assigned_patients.map(p => p.id)),
    );
    const q = search.trim().toLowerCase();
    return allPatients
      .filter(p => !assignedIds.has(p.id))
      .filter(
        p =>
          !q ||
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q),
      );
  }, [allPatients, allCaregivers, search]);

  function handleAssign(patient: Patient) {
    Alert.alert(
      'Assign Patient',
      `Assign ${patient.first_name} ${patient.last_name} to this caregiver?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Assign',
          onPress: () =>
            assignPatient(
              {caregiverId, body: {patient_id: patient.id!}},
              {onSuccess: () => navigation.goBack()},
            ),
        },
      ],
    );
  }

  if (loadingPatients || loadingCaregivers) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={unassigned}
        keyExtractor={item => item.id!}
        contentContainerStyle={
          unassigned.length === 0 ? styles.listEmpty : styles.list
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({item}) => {
          const initials =
            `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleAssign(item)}
              disabled={isPending}
              activeOpacity={0.75}>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{initials}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.rowSub}>{item.phone}</Text>
              </View>
              <Text style={styles.rowAction}>Assign →</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>✅</Text>
            <Text style={styles.emptyTitle}>
              {search
                ? 'No patients match your search.'
                : 'All patients are already assigned.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  searchWrap: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {fontSize: 14, marginRight: 4},
  searchInput: {flex: 1, height: 40, fontSize: 14, color: COLORS.text},
  list: {padding: SPACING.lg},
  listEmpty: {flex: 1, justifyContent: 'center'},
  separator: {height: SPACING.sm},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowAvatarText: {fontSize: 15, fontWeight: '700', color: COLORS.primary},
  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  rowSub: {fontSize: 12, color: COLORS.textSecondary},
  rowAction: {fontSize: 13, color: COLORS.primary, fontWeight: '600'},
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check 2>&1 | grep -v "Cannot find module.*caregivers/(Employ|AssignCaregiver)" | head -20
```
Expected: only 2 remaining "Cannot find module" errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/screens/caregivers/AssignPatientScreen.tsx
git commit -m "feat(mobile): add AssignPatientScreen"
```

---

## Task 12: EmployCaregiverScreen

**Files:**
- Create: `packages/mobile/src/screens/caregivers/EmployCaregiverScreen.tsx`

- [ ] **Step 1: Create screen**

`packages/mobile/src/screens/caregivers/EmployCaregiverScreen.tsx`:
```typescript
import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useCaregivers} from '../../hooks/useCaregivers';
import {useEmployedCaregivers, useEmployCaregiver} from '../../hooks/useFounders';
import {useAuth} from '../../context/AuthContext';
import {CaregiverProfile} from '../../types/caregiver';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'EmployCaregiver'>;
};

export default function EmployCaregiverScreen({navigation}: Props) {
  const {user} = useAuth();
  const founderId = user?.id ?? '';

  const {data: allCaregivers, isLoading: loadingAll} = useCaregivers();
  const {data: employed, isLoading: loadingEmployed} =
    useEmployedCaregivers(founderId);
  const {mutate: employCaregiver, isPending} = useEmployCaregiver();
  const [search, setSearch] = useState('');

  // Caregivers not yet employed by this founder
  const available = useMemo(() => {
    if (!allCaregivers || !employed) {return [];}
    const employedIds = new Set(employed.map(e => e.id));
    const q = search.trim().toLowerCase();
    return allCaregivers
      .filter(c => !employedIds.has(c.id))
      .filter(
        c =>
          !q ||
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q),
      );
  }, [allCaregivers, employed, search]);

  function handleEmploy(caregiver: CaregiverProfile) {
    Alert.alert(
      'Employ Caregiver',
      `Employ ${caregiver.first_name} ${caregiver.last_name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Employ',
          onPress: () =>
            employCaregiver(
              {founderId, body: {caregiver_id: caregiver.id}},
              {onSuccess: () => navigation.goBack()},
            ),
        },
      ],
    );
  }

  if (loadingAll || loadingEmployed) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search caregivers…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={available}
        keyExtractor={item => item.id}
        contentContainerStyle={
          available.length === 0 ? styles.listEmpty : styles.list
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({item}) => {
          const initials =
            `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleEmploy(item)}
              disabled={isPending}
              activeOpacity={0.75}>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{initials}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.rowSub}>{item.email}</Text>
              </View>
              <Text style={styles.rowAction}>Employ →</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>
              {search ? '🔍' : '✅'}
            </Text>
            <Text style={styles.emptyTitle}>
              {search
                ? 'No caregivers match your search.'
                : 'All registered caregivers are already employed.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  searchWrap: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {fontSize: 14, marginRight: 4},
  searchInput: {flex: 1, height: 40, fontSize: 14, color: COLORS.text},
  list: {padding: SPACING.lg},
  listEmpty: {flex: 1, justifyContent: 'center'},
  separator: {height: SPACING.sm},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowAvatarText: {fontSize: 15, fontWeight: '700', color: COLORS.secondary},
  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  rowSub: {fontSize: 12, color: COLORS.textSecondary},
  rowAction: {fontSize: 13, color: COLORS.secondary, fontWeight: '600'},
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check 2>&1 | grep -v "Cannot find module.*caregivers/AssignCaregiver" | head -20
```
Expected: only 1 remaining "Cannot find module" error for `AssignCaregiverToPatientScreen`.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/screens/caregivers/EmployCaregiverScreen.tsx
git commit -m "feat(mobile): add EmployCaregiverScreen"
```

---

## Task 13: AssignCaregiverToPatientScreen

**Files:**
- Create: `packages/mobile/src/screens/caregivers/AssignCaregiverToPatientScreen.tsx`

- [ ] **Step 1: Create screen**

`packages/mobile/src/screens/caregivers/AssignCaregiverToPatientScreen.tsx`:
```typescript
import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useCaregivers, useAssignPatient} from '../../hooks/useCaregivers';
import {useEmployedCaregivers} from '../../hooks/useFounders';
import {useAuth} from '../../context/AuthContext';
import {CaregiverEmploymentSummary} from '../../types/founder';

type Props = {
  navigation: StackNavigationProp<
    RootStackParamList,
    'AssignCaregiverToPatient'
  >;
  route: RouteProp<RootStackParamList, 'AssignCaregiverToPatient'>;
};

export default function AssignCaregiverToPatientScreen({
  navigation,
  route,
}: Props) {
  const {patientId} = route.params;
  const {user} = useAuth();
  const founderId = user?.id ?? '';

  const {data: employed, isLoading: loadingEmployed} =
    useEmployedCaregivers(founderId);
  const {data: allCaregivers, isLoading: loadingAll} = useCaregivers();
  const {mutate: assignPatient, isPending} = useAssignPatient();
  const [search, setSearch] = useState('');

  // Employed caregivers who don't already have this patient assigned
  const available = useMemo(() => {
    if (!employed || !allCaregivers) {return [];}
    // Build set of caregiver IDs already assigned to this patient
    const alreadyAssigned = new Set(
      allCaregivers
        .filter(c => c.assigned_patients.some(p => p.id === patientId))
        .map(c => c.id),
    );
    const q = search.trim().toLowerCase();
    return employed
      .filter(e => !alreadyAssigned.has(e.id))
      .filter(
        e =>
          !q ||
          e.first_name.toLowerCase().includes(q) ||
          e.last_name.toLowerCase().includes(q),
      );
  }, [employed, allCaregivers, patientId, search]);

  function handleAssign(caregiver: CaregiverEmploymentSummary) {
    Alert.alert(
      'Assign Caregiver',
      `Assign ${caregiver.first_name} ${caregiver.last_name} to this patient?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Assign',
          onPress: () =>
            assignPatient(
              {caregiverId: caregiver.id, body: {patient_id: patientId}},
              {onSuccess: () => navigation.goBack()},
            ),
        },
      ],
    );
  }

  if (loadingEmployed || loadingAll) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search caregivers…"
            placeholderTextColor={COLORS.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={available}
        keyExtractor={item => item.id}
        contentContainerStyle={
          available.length === 0 ? styles.listEmpty : styles.list
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({item}) => {
          const initials =
            `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleAssign(item)}
              disabled={isPending}
              activeOpacity={0.75}>
              <View style={styles.rowAvatar}>
                <Text style={styles.rowAvatarText}>{initials}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.rowSub}>
                  {item.job_title ?? 'Caregiver'}
                </Text>
              </View>
              <Text style={styles.rowAction}>Assign →</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.bigIcon}>✅</Text>
            <Text style={styles.emptyTitle}>
              {search
                ? 'No caregivers match your search.'
                : 'All employed caregivers are already assigned to this patient.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  searchWrap: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {fontSize: 14, marginRight: 4},
  searchInput: {flex: 1, height: 40, fontSize: 14, color: COLORS.text},
  list: {padding: SPACING.lg},
  listEmpty: {flex: 1, justifyContent: 'center'},
  separator: {height: SPACING.sm},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rowAvatarText: {fontSize: 15, fontWeight: '700', color: COLORS.secondary},
  rowBody: {flex: 1},
  rowName: {fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 3},
  rowSub: {fontSize: 12, color: COLORS.textSecondary},
  rowAction: {fontSize: 13, color: COLORS.secondary, fontWeight: '600'},
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg},
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Verify — all navigation import errors should be gone now**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/screens/caregivers/AssignCaregiverToPatientScreen.tsx
git commit -m "feat(mobile): add AssignCaregiverToPatientScreen"
```

---

## Task 14: HomeScreen Updates

**Files:**
- Modify: `packages/mobile/src/screens/HomeScreen.tsx`

- [ ] **Step 1: Replace HomeScreen.tsx with the role-aware version**

Replace the full contents of `packages/mobile/src/screens/HomeScreen.tsx`:
```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../navigation/types';
import {COLORS, SPACING} from '../config/constants';
import {useAuth} from '../context/AuthContext';
import {useHomeStats} from '../hooks/useHomeStats';
import {UserRole} from '../types/auth';

type HomeNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type TopLevelScreen =
  | 'Patients'
  | 'Caregivers'
  | 'Medications'
  | 'Appointments'
  | 'Uploads';

interface NavCard {
  title: string;
  description: string;
  icon: string;
  color: string;
  screen: TopLevelScreen;
  roles: UserRole[];
}

const NAV_CARDS: NavCard[] = [
  {
    title: 'Patients',
    description: 'View & manage patient profiles',
    icon: '👥',
    color: COLORS.primary,
    screen: 'Patients',
    roles: ['founder', 'caregiver'],
  },
  {
    title: 'Caregivers',
    description: 'Employ & manage your care team',
    icon: '🧑‍⚕️',
    color: COLORS.secondary,
    screen: 'Caregivers',
    roles: ['founder'],
  },
  {
    title: 'Medications',
    description: 'Track & manage prescriptions',
    icon: '💊',
    color: COLORS.secondary,
    screen: 'Medications',
    roles: ['founder', 'caregiver', 'patient'],
  },
  {
    title: 'Appointments',
    description: 'Schedule & track visits',
    icon: '📅',
    color: COLORS.success,
    screen: 'Appointments',
    roles: ['founder', 'caregiver', 'patient'],
  },
  {
    title: 'Uploads',
    description: 'Prescriptions & reports',
    icon: '📁',
    color: COLORS.warning,
    screen: 'Uploads',
    roles: ['founder', 'caregiver', 'patient'],
  },
];

const ROLE_LABELS: Record<UserRole, string> = {
  founder: 'Founder',
  caregiver: 'Care Giver',
  patient: 'Patient',
};

const ROLE_COLORS: Record<UserRole, string> = {
  founder: COLORS.secondary,
  caregiver: COLORS.primary,
  patient: COLORS.success,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {return 'Good Morning';}
  if (hour < 17) {return 'Good Afternoon';}
  return 'Good Evening';
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const {user, signOut} = useAuth();
  const stats = useHomeStats();

  const visibleCards = NAV_CARDS.filter(
    c => !user || c.roles.includes(user.role),
  );

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: signOut},
    ]);
  }

  /**
   * For the patient role, Medications/Appointments/Uploads skip the
   * patient-picker and navigate directly to the patient's own data.
   */
  function handleCardPress(screen: TopLevelScreen) {
    if (user?.role === 'patient' && user.patient_id) {
      const patientName = `${user.first_name} ${user.last_name}`;
      if (screen === 'Medications') {
        navigation.navigate('MedicationList', {
          patientId: user.patient_id,
          patientName,
        });
        return;
      }
      if (screen === 'Appointments') {
        navigation.navigate('AppointmentList', {
          patientId: user.patient_id,
          patientName,
        });
        return;
      }
      if (screen === 'Uploads') {
        navigation.navigate('UploadList', {
          patientId: user.patient_id,
          patientName,
        });
        return;
      }
    }
    navigation.navigate(screen);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header / Profile */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>
                {user ? `${user.first_name} ${user.last_name}` : '—'}
              </Text>
              {user && (
                <View
                  style={[
                    styles.roleBadge,
                    {backgroundColor: ROLE_COLORS[user.role] + '30'},
                  ]}>
                  <Text
                    style={[
                      styles.roleBadgeText,
                      {color: ROLE_COLORS[user.role]},
                    ]}>
                    {ROLE_LABELS[user.role]}
                  </Text>
                </View>
              )}
              {user?.email && (
                <Text style={styles.userEmail}>{user.email}</Text>
              )}
            </View>
            <View style={styles.rightCol}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user
                    ? getInitials(user.first_name, user.last_name)
                    : '?'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats — hidden for patient if no stats returned */}
        {stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((stat, idx) => (
              <View
                key={stat.label}
                style={[
                  styles.statCard,
                  idx > 0 && idx < stats.length && styles.statCardBorder,
                ]}>
                <Text style={styles.statValue}>
                  {stat.value === null ? '—' : stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Navigation Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.cardsGrid}>
            {visibleCards.map(card => (
              <TouchableOpacity
                key={card.screen}
                style={styles.card}
                onPress={() => handleCardPress(card.screen)}
                activeOpacity={0.75}>
                <View
                  style={[
                    styles.cardIconBg,
                    {backgroundColor: card.color + '20'},
                  ]}>
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                </View>
                <Text style={[styles.cardTitle, {color: card.color}]}>
                  {card.title}
                </Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
                <View
                  style={[
                    styles.cardFooter,
                    {borderTopColor: card.color + '30'},
                  ]}>
                  <Text style={[styles.cardLink, {color: card.color}]}>
                    Open →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: COLORS.primary},
  container: {flex: 1, backgroundColor: COLORS.background},
  scrollContent: {paddingBottom: SPACING.xl},

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingBlock: {flex: 1},
  greeting: {fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 2},
  userName: {fontSize: 24, fontWeight: '700', color: COLORS.white, marginBottom: 6},
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  roleBadgeText: {fontSize: 12, fontWeight: '700'},
  userEmail: {fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2},
  rightCol: {alignItems: 'center', gap: SPACING.xs},
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {fontSize: 18, fontWeight: '700', color: COLORS.white},
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signOutText: {fontSize: 11, color: COLORS.white, fontWeight: '600'},

  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: -SPACING.lg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: {flex: 1, alignItems: 'center', paddingVertical: SPACING.md},
  statCardBorder: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  statValue: {fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 2},
  statLabel: {fontSize: 11, color: COLORS.textSecondary, textAlign: 'center'},

  section: {marginTop: SPACING.lg, paddingHorizontal: SPACING.lg},
  sectionTitle: {fontSize: 17, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.md},

  cardsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
  card: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardIcon: {fontSize: 22},
  cardTitle: {fontSize: 15, fontWeight: '700', marginBottom: 4},
  cardDescription: {fontSize: 12, color: COLORS.textSecondary, lineHeight: 16, marginBottom: SPACING.sm},
  cardFooter: {borderTopWidth: 1, paddingTop: SPACING.xs, marginTop: SPACING.xs},
  cardLink: {fontSize: 12, fontWeight: '600'},
});
```

- [ ] **Step 2: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/mobile/src/screens/HomeScreen.tsx
git commit -m "feat(mobile): role-based stats and Caregivers card on HomeScreen"
```

---

## Task 15: Patient-Picker Screens — Swap to useRoleAwarePatients

**Files:**
- Modify: `packages/mobile/src/screens/patients/PatientsScreen.tsx`
- Modify: `packages/mobile/src/screens/medications/MedicationsScreen.tsx`
- Modify: `packages/mobile/src/screens/appointments/AppointmentsScreen.tsx`
- Modify: `packages/mobile/src/screens/uploads/UploadsScreen.tsx`

- [ ] **Step 1: Update PatientsScreen**

In `packages/mobile/src/screens/patients/PatientsScreen.tsx`:

Replace the import line:
```typescript
import {usePatients} from '../../hooks/usePatients';
```
With:
```typescript
import {useRoleAwarePatients} from '../../hooks/useRoleAwarePatients';
import {useAuth} from '../../context/AuthContext';
```

Inside `PatientsScreen`, replace:
```typescript
const {data: patients, isLoading, isError, refetch, isFetching} = usePatients();
```
With:
```typescript
const {user} = useAuth();
const {data: patients, isLoading, isError, refetch, isFetching} = useRoleAwarePatients();
```

Find the header subtitle text node (inside the search bar area). There is a `<SafeAreaView>` with a title shown in the header. The header title is set via `navigation.setOptions` or via the stack navigator. Add a subtitle to distinguish the caregiver view by finding any existing title-setting logic and adding a note, OR add it to the status bar area.

In the `PatientsScreen` function, find the FAB (the `+` button that navigates to `AddEditPatient`) and wrap it with a role check. Find the existing FAB JSX:
```tsx
<TouchableOpacity
  style={styles.fab}
  onPress={() => navigation.navigate('AddEditPatient', {})}
  activeOpacity={0.85}>
  <Text style={styles.fabText}>+</Text>
</TouchableOpacity>
```
Replace with:
```tsx
{user?.role === 'founder' && (
  <TouchableOpacity
    style={styles.fab}
    onPress={() => navigation.navigate('AddEditPatient', {})}
    activeOpacity={0.85}>
    <Text style={styles.fabText}>+</Text>
  </TouchableOpacity>
)}
```

- [ ] **Step 2: Update MedicationsScreen**

In `packages/mobile/src/screens/medications/MedicationsScreen.tsx`:

Replace:
```typescript
import {usePatients} from '../../hooks/usePatients';
```
With:
```typescript
import {useRoleAwarePatients} from '../../hooks/useRoleAwarePatients';
```

Replace:
```typescript
const {data: patients, isLoading, isError, refetch, isFetching} = usePatients();
```
With:
```typescript
const {data: patients, isLoading, isError, refetch, isFetching} = useRoleAwarePatients();
```

- [ ] **Step 3: Update AppointmentsScreen**

In `packages/mobile/src/screens/appointments/AppointmentsScreen.tsx`:

Replace:
```typescript
import {usePatients} from '../../hooks/usePatients';
```
With:
```typescript
import {useRoleAwarePatients} from '../../hooks/useRoleAwarePatients';
```

Replace:
```typescript
const {data: patients, isLoading, isError, refetch, isFetching} = usePatients();
```
With:
```typescript
const {data: patients, isLoading, isError, refetch, isFetching} = useRoleAwarePatients();
```

- [ ] **Step 4: Update UploadsScreen**

In `packages/mobile/src/screens/uploads/UploadsScreen.tsx`:

Replace:
```typescript
import {usePatients} from '../../hooks/usePatients';
```
With:
```typescript
import {useRoleAwarePatients} from '../../hooks/useRoleAwarePatients';
```

Replace:
```typescript
const {data: patients, isLoading, isError, refetch, isFetching} = usePatients();
```
With:
```typescript
const {data: patients, isLoading, isError, refetch, isFetching} = useRoleAwarePatients();
```

- [ ] **Step 5: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/mobile/src/screens/patients/PatientsScreen.tsx \
        packages/mobile/src/screens/medications/MedicationsScreen.tsx \
        packages/mobile/src/screens/appointments/AppointmentsScreen.tsx \
        packages/mobile/src/screens/uploads/UploadsScreen.tsx
git commit -m "feat(mobile): swap patient-picker screens to useRoleAwarePatients"
```

---

## Task 16: PatientDetailScreen — Assigned Caregivers Section

**Files:**
- Modify: `packages/mobile/src/screens/patients/PatientDetailScreen.tsx`

- [ ] **Step 1: Add imports**

At the top of `packages/mobile/src/screens/patients/PatientDetailScreen.tsx`, add after existing imports:
```typescript
import {useAuth} from '../../context/AuthContext';
import {useCaregivers, useUnassignPatient} from '../../hooks/useCaregivers';
```

- [ ] **Step 2: Add hook calls inside the component**

Inside the `PatientDetailScreen` function, after the existing hook calls (`usePatient`, `useDeletePatient`), add:
```typescript
const {user} = useAuth();
const {data: allCaregivers, refetch: refetchCaregivers} = useCaregivers();
const {mutate: unassignPatient, isPending: isUnassigning} = useUnassignPatient();
```

- [ ] **Step 3: Compute assigned caregivers for this patient**

After the hook calls, add:
```typescript
// Caregivers currently assigned to this patient (founder-only view)
const assignedCaregivers =
  user?.role === 'founder' && allCaregivers
    ? allCaregivers.filter(c =>
        c.assigned_patients.some(p => p.id === patientId),
      )
    : [];
```

- [ ] **Step 4: Add unassign handler**

After `handleDelete`, add:
```typescript
function handleUnassignCaregiver(caregiverId: string, caregiverName: string) {
  Alert.alert(
    'Remove Caregiver',
    `Remove ${caregiverName} from this patient?`,
    [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          unassignPatient(
            {caregiverId, patientId},
            {onSuccess: () => refetchCaregivers()},
          ),
      },
    ],
  );
}
```

- [ ] **Step 5: Insert Assigned Caregivers card before the Delete button**

Find the delete button JSX in the return statement:
```tsx
{/* Delete */}
<TouchableOpacity
  style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
```

Insert this block immediately before it:
```tsx
{/* Assigned Caregivers — founder only */}
{user?.role === 'founder' && (
  <View style={styles.card}>
    <View style={styles.caregiverCardHeader}>
      <Text style={styles.cardTitle}>Assigned Caregivers</Text>
      <TouchableOpacity
        style={styles.assignCaregiverBtn}
        onPress={() =>
          navigation.navigate('AssignCaregiverToPatient', {patientId})
        }>
        <Text style={styles.assignCaregiverBtnText}>+ Assign</Text>
      </TouchableOpacity>
    </View>
    {assignedCaregivers.length === 0 ? (
      <Text style={styles.noCaregivers}>No caregivers assigned yet.</Text>
    ) : (
      assignedCaregivers.map((c, idx) => (
        <View
          key={c.id}
          style={[
            styles.caregiverRow,
            idx < assignedCaregivers.length - 1 && styles.caregiverRowBorder,
          ]}>
          <View style={styles.caregiverInfo}>
            <Text style={styles.caregiverName}>
              {c.first_name} {c.last_name}
            </Text>
            <Text style={styles.caregiverSub}>{c.email}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              handleUnassignCaregiver(
                c.id,
                `${c.first_name} ${c.last_name}`,
              )
            }
            disabled={isUnassigning}
            style={styles.removeCaregiverBtn}>
            <Text style={styles.removeCaregiverBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))
    )}
  </View>
)}
```

- [ ] **Step 6: Add new styles**

At the end of the `StyleSheet.create({...})` block (before the closing `}`), add:
```typescript
  caregiverCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  assignCaregiverBtn: {
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assignCaregiverBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  noCaregivers: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingVertical: SPACING.md,
    textAlign: 'center',
  },
  caregiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  caregiverRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  caregiverInfo: {flex: 1},
  caregiverName: {fontSize: 15, fontWeight: '600', color: COLORS.text},
  caregiverSub: {fontSize: 12, color: COLORS.textSecondary, marginTop: 2},
  removeCaregiverBtn: {padding: SPACING.sm},
  removeCaregiverBtnText: {fontSize: 16, color: COLORS.error, fontWeight: '700'},
```

- [ ] **Step 7: Verify**

```bash
cd packages/mobile && npm run type-check
```
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/mobile/src/screens/patients/PatientDetailScreen.tsx
git commit -m "feat(mobile): add Assigned Caregivers section to PatientDetailScreen (founder only)"
```

---

## Manual Verification Checklist

After all tasks complete, run the app and verify each user flow:

**Founder:**
- [ ] HomeScreen shows: Total Patients, Caregivers count, Unassigned Patients
- [ ] "Caregivers" card visible on HomeScreen → opens CaregiversScreen
- [ ] CaregiversScreen lists employed caregivers with FAB → EmployCaregiverScreen
- [ ] EmployCaregiverScreen shows only unemployed caregivers → tap employs and pops back
- [ ] CaregiverDetailScreen shows profile + assigned patients + unassign button
- [ ] AssignPatientScreen shows only unassigned patients → tap assigns and pops back
- [ ] PatientDetailScreen shows "Assigned Caregivers" section → "Assign" opens AssignCaregiverToPatientScreen
- [ ] Patients card shows all patients

**Caregiver:**
- [ ] HomeScreen shows: My Patients, Today's Appts, Unassigned Patients
- [ ] "Caregivers" card NOT visible on HomeScreen
- [ ] Patients card → shows only assigned patients
- [ ] Medications/Appointments/Uploads → patient picker shows only assigned patients

**Patient:**
- [ ] HomeScreen shows: My Medications, Upcoming Appts, Health Check
- [ ] "Patients" card NOT visible
- [ ] Tapping Medications → goes directly to MedicationListScreen (own data)
- [ ] Tapping Appointments → goes directly to AppointmentListScreen (own data)
- [ ] Tapping Uploads → goes directly to UploadListScreen (own data)
