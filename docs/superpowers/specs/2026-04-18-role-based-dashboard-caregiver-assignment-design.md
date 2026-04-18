# Role-Based Dashboard & Patient–Caregiver Assignment

**Date:** 2026-04-18  
**Status:** Approved  
**Scope:** Mobile app only — backend APIs are fully implemented

---

## Overview

Complete two in-progress features:

1. **Role-based dashboard** — HomeScreen stats and navigation cards tailored to each role (founder, caregiver, patient)
2. **Patient–Caregiver assignment** — Mobile UI for founders to employ caregivers and assign patients; caregivers to see only their assigned patients

The backend already exposes all required endpoints. All work is in `packages/mobile/`.

---

## Architecture

### Approach: Role-Aware Patient Hook (Option A)

A single `useRoleAwarePatients()` hook encapsulates all role logic. Internally it calls:
- `usePatients()` for founders (all patients)
- `useCaregiverPatients(user.id)` for caregivers (assigned patients only)
- Returns a single-item array with the patient matching `user.patient_id` for patients

Every patient-picker screen swaps `usePatients()` for `useRoleAwarePatients()` — no role-check scattered across screens.

---

## New Files

### Types (`src/types/`)

**`caregiver.ts`**
- `PatientSummary` — `{ id, first_name, last_name, email, phone, assigned_at, assignment_notes }`
- `CaregiverProfile` — `{ id, first_name, last_name, email, phone, is_active, created_at, assigned_patients: PatientSummary[] }`
- `AssignPatientRequest` — `{ patient_id, notes? }`
- `AssignmentResponse` — `{ id, caregiver_id, patient_id, assigned_at, notes }`

**`founder.ts`**
- `CaregiverEmploymentSummary` — `{ id, first_name, last_name, email, phone, is_active, employed_at, job_title, employment_notes }`
- `FounderProfile` — `{ id, first_name, last_name, email, phone, is_active, created_at, employed_caregivers: CaregiverEmploymentSummary[] }`
- `EmployCaregiverRequest` — `{ caregiver_id, job_title?, notes? }`
- `EmploymentResponse` — `{ id, founder_id, caregiver_id, employed_at, job_title, notes }`

### API Services (`src/services/api/`)

**`caregivers.ts`**
- `listCaregivers()` → `GET /caregivers/`
- `getCaregiverPatients(caregiverId)` → `GET /caregivers/{id}/patients`
- `assignPatient(caregiverId, body)` → `POST /caregivers/{id}/patients`
- `unassignPatient(caregiverId, patientId)` → `DELETE /caregivers/{id}/patients/{patientId}`

**`founders.ts`**
- `getFounderProfile(founderId)` → `GET /founders/{id}`
- `listEmployedCaregivers(founderId)` → `GET /founders/{id}/caregivers`
- `employCaregivers(founderId, body)` → `POST /founders/{id}/caregivers`
- `terminateEmployment(founderId, caregiverId)` → `DELETE /founders/{id}/caregivers/{caregiverId}`

### Hooks (`src/hooks/`)

**`useCaregivers.ts`**
- `useCaregivers()` — list all caregivers with assigned patients
- `useCaregiverPatients(caregiverId)` — assigned patients for a specific caregiver
- `useAssignPatient()` — mutation: assign patient to caregiver
- `useUnassignPatient()` — mutation: remove patient from caregiver

**`useFounders.ts`**
- `useFounderProfile(founderId)` — founder profile with employed caregivers
- `useEmployedCaregivers(founderId)` — list of caregivers employed by founder
- `useEmployCaregiver()` — mutation: employ a caregiver under a founder
- `useTerminateEmployment()` — mutation: terminate caregiver employment

**`useRoleAwarePatients.ts`**
- Single exported hook `useRoleAwarePatients()`
- Reads `user` from `useAuth()`
- Returns `{ data, isLoading, isError, refetch }` — same shape as `usePatients()`
- Internally branches on `user.role`:
  - `founder` → delegates to `usePatients()`
  - `caregiver` → delegates to `useCaregiverPatients(user.id)`
  - `patient` → fetches single patient by `user.patient_id` from patients API, returns as array

---

## HomeScreen Changes

### Navigation Cards by Role

| Card | Founder | Caregiver | Patient |
|------|---------|-----------|---------|
| Patients | ✓ | ✓ | — |
| Caregivers (new) | ✓ | — | — |
| Medications | ✓ | ✓ | ✓ |
| Appointments | ✓ | ✓ | ✓ |
| Uploads | ✓ | ✓ | ✓ |

### Patient Role Navigation Intercept

When a patient taps Medications, Appointments, or Uploads on HomeScreen, navigate directly to the list screen (bypassing the patient-picker) using `user.patient_id` and the user's full name. The picker screens (`MedicationsScreen`, `AppointmentsScreen`, `UploadsScreen`) are never visited by patients.

### Stats Row by Role

**Founder:**
| Slot | Label | Source |
|------|-------|--------|
| 1 | Total Patients | `GET /patients/` → count |
| 2 | Caregivers | `GET /founders/{id}/caregivers` → count |
| 3 | Unassigned Patients | All patients minus those in any caregiver's assigned list (client-side, from `GET /caregivers/`) |

**Caregiver:**
| Slot | Label | Source |
|------|-------|--------|
| 1 | My Patients | `GET /caregivers/{id}/patients` → count |
| 2 | Today's Appts | For each assigned patient: `GET /appointments/{patient_id}` → flatten and filter client-side by `scheduled_at` date = today |
| 3 | Unassigned Patients | Same computation as founder |

**Patient:**
| Slot | Label | Source |
|------|-------|--------|
| 1 | My Medications | `GET /medications/{patient_id}` → count of active medications |
| 2 | Upcoming Appts | `GET /appointments/{patient_id}` → count where `scheduled_at` > now and `completed = false` |
| 3 | Health Check | 0 or 1 — 1 if no health check recorded today (from `GET /health/checks/{patient_id}`) |

All stat slots show `—` while loading. Stats refresh on HomeScreen pull-to-refresh.

---

## Navigation Changes

### New Entries in `RootStackParamList`

```typescript
Caregivers: undefined
CaregiverDetail: { caregiverId: string }
AssignPatient: { caregiverId: string }
AssignCaregiverToPatient: { patientId: string }
```

### New Stack Screens in AppNavigator

- `Caregivers` → `CaregiversScreen` (title: "Caregivers")
- `CaregiverDetail` → `CaregiverDetailScreen` (title: dynamic — caregiver name)
- `AssignPatient` → `AssignPatientScreen` (title: "Assign Patient")

---

## New Screens (Founder Only)

### `CaregiversScreen`

- Lists all caregivers returned by `useEmployedCaregivers(user.id)`
- Each row: name, job title, patient count badge
- FAB "Employ Caregiver" → opens a searchable bottom-sheet of all registered caregivers (`useCaregivers()`) not yet in the employed list → selecting one calls `useEmployCaregiver()` mutation
- Pull-to-refresh
- Tapping a row → `CaregiverDetail`

### `CaregiverDetailScreen`

- Header: caregiver name, email, phone, job title
- "Assigned Patients" list using `useCaregiverPatients(caregiverId)`
- Each patient row has a trash/unassign icon → calls `useUnassignPatient()` with confirmation alert
- "Assign Patient" button → navigates to `AssignPatientScreen`

### `AssignPatientScreen`

- Shows all patients not currently assigned to any caregiver (computed: `usePatients()` minus patients across all `useCaregivers()` assignments)
- Searchable list
- Tapping a patient → calls `useAssignPatient()` and pops back to `CaregiverDetailScreen`

---

## Modified Existing Screens

### `PatientsScreen`

- Replace `usePatients()` with `useRoleAwarePatients()`
- For caregiver role: subtitle changes to "My Patients"
- Add Patient button remains — founders can still add patients; hidden for caregivers

### `MedicationsScreen`, `AppointmentsScreen`, `UploadsScreen`

- Replace `usePatients()` with `useRoleAwarePatients()`
- No other changes needed — hook returns correct patient list per role

### `PatientDetailScreen`

- Add "Assigned Caregivers" section at bottom, visible only when `user.role === 'founder'`
- Lists caregivers currently assigned to this patient (derived from `useCaregivers()` — filter assignments by `patient_id`)
- Each caregiver row has unassign button → calls `useUnassignPatient(caregiverId, patientId)` with confirmation alert
- "Assign Caregiver" button → navigates to a new `AssignCaregiverToPatient: { patientId: string }` screen (full-screen, consistent with existing navigation patterns) showing the founder's employed caregivers not yet assigned to this patient → tapping one calls `useAssignPatient()` and pops back

---

## Data Flow Summary

```
Founder logs in
  └── HomeScreen fetches: usePatients(), useEmployedCaregivers(id), useCaregivers()
  └── Caregivers card → CaregiversScreen → CaregiverDetailScreen → AssignPatientScreen
  └── Patients card → PatientsScreen (all) → PatientDetailScreen (with caregiver section)

Caregiver logs in
  └── HomeScreen fetches: useCaregiverPatients(id), useAppointments(), useCaregivers()
  └── Patients card → PatientsScreen (assigned only, via useRoleAwarePatients)
  └── Medications/Appointments/Uploads → picker shows assigned patients only

Patient logs in
  └── HomeScreen fetches: useMedications(patient_id), useAppointments(patient_id), useHealthChecks(patient_id)
  └── Medications tap → MedicationListScreen directly (patient_id from user)
  └── Appointments tap → AppointmentListScreen directly
  └── Uploads tap → UploadListScreen directly
```

---

## Out of Scope

- Backend changes (all APIs already exist)
- Health check recording screen (separate feature)
- Push notifications
- Offline support
