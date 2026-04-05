# Care Assistant Mobile App

React Native mobile application for the Elderly Care Assistant system.

## Setup

This mobile app is part of a monorepo structure. The app structure, TypeScript types, API services, and React Query hooks are already created.

### Complete React Native Setup

To finish the React Native setup with native code (iOS/Android):

```bash
cd packages/mobile

# Initialize React Native native code
npx react-native init CareAssistantMobile --template react-native-template-typescript

# Merge the generated files with our existing structure
# Note: Keep our src/ folder and configuration files
```

### Install Dependencies

From the monorepo root:

```bash
npm install
```

From the mobile package:

```bash
cd packages/mobile
npm install

# iOS only: Install pods
cd ios && pod install && cd ..
```

## Running the App

### Start Metro Bundler

```bash
npm start
```

### Run on iOS

```bash
npm run ios
```

### Recommended Version Matrix  
  For an elderly care app targeting real users, cover:
  ┌──────────┬─────────────┬────────────────────────────────┐                                             
  │ Priority │ iOS Version │             Reason             |
  ├──────────┼─────────────┼────────────────────────────────┤ 
  │ High     │ iOS 26.4    │ Latest, physical device        │
  ├──────────┼─────────────┼────────────────────────────────┤
  │ High     │ iOS 26.0    │ Start of iOS 26 cycle          |
  ├──────────┼─────────────┼────────────────────────────────┤
  │ Medium   │ iOS 17.x    │ Many older iPhones still on 17 │
  ├──────────┼─────────────┼────────────────────────────────┤
  │ Medium   │ iOS 18.x    │ Common on mid-range devices    │
  └──────────┴─────────────┴────────────────────────────────┘    

### Run on Android

```bash
npm run android
```

## Project Structure

```
src/
├── services/api/        # API client and service functions
├── hooks/               # React Query hooks
├── types/               # TypeScript type definitions
├── navigation/          # Navigation configuration (to be added)
├── screens/             # Screen components (to be added)
├── components/          # Reusable components (to be added)
├── config/              # App configuration
└── utils/               # Utility functions
```

## Features Implemented

### API Services
- ✅ Patients API
- ✅ Health Checks API
- ✅ Medications API
- ✅ Appointments API
- ✅ File Uploads API

### React Query Hooks
- ✅ `usePatients`, `usePatient`, `useCreatePatient`, `useUpdatePatient`
- ✅ `useHealthChecks`, `useCreateHealthCheck`
- ✅ `useMedications`, `useCreateMedication`, `useUpdateMedication`
- ✅ `useAppointments`, `useCreateAppointment`, `useCompleteAppointment`

### TypeScript Types
- ✅ Patient, EmergencyContact
- ✅ HealthCheck
- ✅ Medication
- ✅ Appointment

## Next Steps

1. **Add React Navigation**
   - Install navigation packages
   - Create navigation structure (Stack + Bottom Tabs)
   - Define navigation types

2. **Create Screens**
   - Patient List & Details
   - Health Check Recording
   - Medication Management
   - Appointment Scheduling
   - Document Upload

3. **Create UI Components**
   - PatientCard
   - VitalSignsCard
   - FormField
   - Button, Input, etc.

4. **Add React Hook Form**
   - Install react-hook-form
   - Create form screens

5. **Add Image Picker**
   - Install react-native-image-picker
   - Implement document upload flow

## Backend Connection

The app connects to the FastAPI backend at `http://localhost:8000/api/v1`.

Make sure the backend is running:

```bash
# From monorepo root
npm run backend
```

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

## Type Checking

```bash
npm run type-check
```
