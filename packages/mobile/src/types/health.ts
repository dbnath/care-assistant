export interface HealthCheck {
  id?: string;
  patient_id: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  notes?: string;
  checked_at?: string;
}
