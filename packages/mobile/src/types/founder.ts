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
