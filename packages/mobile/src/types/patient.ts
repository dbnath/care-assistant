export enum EmergencyContactRelation {
  SPOUSE = 'spouse',
  CHILD = 'child',
  SIBLING = 'sibling',
  FRIEND = 'friend',
  CAREGIVER = 'caregiver',
  OTHER = 'other',
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: EmergencyContactRelation;
  is_primary: boolean;
}

export interface Patient {
  id?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO string
  email?: string;
  phone: string;
  address?: string;
  emergency_contacts: EmergencyContact[];
  medical_notes?: string;
  created_at?: string;
  updated_at?: string;
}
