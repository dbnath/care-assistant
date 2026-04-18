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
