import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from './types';
import HomeScreen from '../screens/HomeScreen';
import PatientsScreen from '../screens/patients/PatientsScreen';
import PatientDetailScreen from '../screens/patients/PatientDetailScreen';
import AddEditPatientScreen from '../screens/patients/AddEditPatientScreen';
import MedicationsScreen from '../screens/medications/MedicationsScreen';
import MedicationListScreen from '../screens/medications/MedicationListScreen';
import AddEditMedicationScreen from '../screens/medications/AddEditMedicationScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import AppointmentListScreen from '../screens/appointments/AppointmentListScreen';
import AddEditAppointmentScreen from '../screens/appointments/AddEditAppointmentScreen';
import UploadsScreen from '../screens/uploads/UploadsScreen';
import UploadListScreen from '../screens/uploads/UploadListScreen';
import {COLORS} from '../config/constants';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {backgroundColor: COLORS.primary},
          headerTintColor: COLORS.white,
          headerTitleStyle: {fontWeight: 'bold'},
          headerBackTitleVisible: false,
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Patients"
          component={PatientsScreen}
          options={{title: 'Patients'}}
        />
        <Stack.Screen
          name="PatientDetail"
          component={PatientDetailScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="AddEditPatient"
          component={AddEditPatientScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="Medications"
          component={MedicationsScreen}
          options={{title: 'Select Patient'}}
        />
        <Stack.Screen
          name="MedicationList"
          component={MedicationListScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="AddEditMedication"
          component={AddEditMedicationScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="Appointments"
          component={AppointmentsScreen}
          options={{title: 'Select Patient'}}
        />
        <Stack.Screen
          name="AppointmentList"
          component={AppointmentListScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="AddEditAppointment"
          component={AddEditAppointmentScreen}
          options={{title: ''}}
        />
        <Stack.Screen
          name="Uploads"
          component={UploadsScreen}
          options={{title: 'Select Patient'}}
        />
        <Stack.Screen
          name="UploadList"
          component={UploadListScreen}
          options={{title: ''}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
