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
