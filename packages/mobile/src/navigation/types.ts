export type RootStackParamList = {
  Home: undefined;
  Patients: undefined;
  PatientDetail: {patientId: string};
  AddEditPatient: {patientId?: string};
  Medications: undefined;
  MedicationList: {patientId: string; patientName: string};
  AddEditMedication: {patientId: string; medicationId?: string};
  Appointments: undefined;
  AppointmentList: {patientId: string; patientName: string};
  AddEditAppointment: {patientId: string; appointmentId?: string};
  Uploads: undefined;
  UploadList: {patientId: string; patientName: string};
};
