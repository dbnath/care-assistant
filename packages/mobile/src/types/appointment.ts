export interface Appointment {
  id?: string;
  patient_id: string;
  title: string;
  description?: string;
  appointment_type: string;
  scheduled_at: string;
  duration_minutes: number;
  location?: string;
  completed: boolean;
  notes?: string;
}
