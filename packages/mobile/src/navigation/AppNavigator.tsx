import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {useAuth} from '../context/AuthContext';
import {AuthStackParamList, RootStackParamList} from './types';
import {COLORS} from '../config/constants';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main app screens
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

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {backgroundColor: COLORS.primary},
        headerTintColor: COLORS.white,
        headerTitleStyle: {fontWeight: 'bold'},
        headerBackTitleVisible: false,
      }}>
      <MainStack.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <MainStack.Screen name="Patients" component={PatientsScreen} options={{title: 'Patients'}} />
      <MainStack.Screen name="PatientDetail" component={PatientDetailScreen} options={{title: ''}} />
      <MainStack.Screen name="AddEditPatient" component={AddEditPatientScreen} options={{title: ''}} />
      <MainStack.Screen name="Medications" component={MedicationsScreen} options={{title: 'Select Patient'}} />
      <MainStack.Screen name="MedicationList" component={MedicationListScreen} options={{title: ''}} />
      <MainStack.Screen name="AddEditMedication" component={AddEditMedicationScreen} options={{title: ''}} />
      <MainStack.Screen name="Appointments" component={AppointmentsScreen} options={{title: 'Select Patient'}} />
      <MainStack.Screen name="AppointmentList" component={AppointmentListScreen} options={{title: ''}} />
      <MainStack.Screen name="AddEditAppointment" component={AddEditAppointmentScreen} options={{title: ''}} />
      <MainStack.Screen name="Uploads" component={UploadsScreen} options={{title: 'Select Patient'}} />
      <MainStack.Screen name="UploadList" component={UploadListScreen} options={{title: ''}} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
