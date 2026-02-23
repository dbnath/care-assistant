# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An elderly care assistant system built as an **npm workspaces monorepo** containing:
- **Backend**: FastAPI service for managing patient records, health monitoring, medications, appointments, and file uploads
- **Mobile**: React Native app (bare workflow) for caregivers to interact with the backend APIs

## Monorepo Structure

```
care-assistant/
├── package.json                    # Root workspace configuration
├── packages/
│   ├── backend/                    # FastAPI Python backend
│   │   ├── src/care_assistant/
│   │   ├── tests/
│   │   ├── uploads/                # File storage directory
│   │   ├── pyproject.toml
│   │   ├── requirements.txt
│   │   └── package.json
│   └── mobile/                     # React Native mobile app
│       ├── src/
│       │   ├── services/api/       # API client and services
│       │   ├── hooks/              # React Query hooks
│       │   ├── types/              # TypeScript types
│       │   ├── navigation/         # Navigation (to be added)
│       │   ├── screens/            # Screen components (to be added)
│       │   └── components/         # Reusable components (to be added)
│       ├── android/                # Android native code (run react-native init)
│       ├── ios/                    # iOS native code (run react-native init)
│       ├── package.json
│       └── tsconfig.json
```

## Development Environment

### Prerequisites
- **Node.js**: >=18.0.0
- **npm**: >=9.0.0
- **Python**: 3.12
- **React Native CLI**: `npm install -g react-native-cli` (optional)
- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development

### Initial Setup

```bash
# Clone and navigate to project
cd /path/to/care-assistant

# Install all dependencies
npm install

# Setup Python backend
cd packages/backend
python -m venv .venv
source .venv/bin/activate  # On macOS/Linux
# .venv\Scripts\activate   # On Windows
pip install -r requirements-dev.txt
pip install -e .
cd ../..

# Complete React Native setup (generate native code)
cd packages/mobile
npx react-native init CareAssistantMobile --template react-native-template-typescript
# Merge generated files with existing structure (keep src/, keep configs)
npm install
cd ios && pod install && cd ..  # iOS only
cd ../..
```

## Common Commands

### From Root

```bash
# Run both backend and mobile together
npm run dev

# Run backend only
npm run backend

# Run mobile Metro bundler
npm run mobile

# Run mobile on iOS
npm run mobile:ios

# Run mobile on Android
npm run mobile:android

# Run tests (all workspaces)
npm run test

# Backend tests specifically
npm run backend:test
```

### Backend (packages/backend/)

```bash
cd packages/backend

# Activate virtual environment first
source .venv/bin/activate  # macOS/Linux

# Run development server
npm run dev
# OR
uvicorn src.care_assistant.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Run tests with coverage
pytest --cov=src/care_assistant --cov-report=term-missing

# Code formatting
black src/ tests/

# Linting
ruff check src/ tests/

# Fix auto-fixable issues
ruff check --fix src/ tests/
```

### Mobile (packages/mobile/)

```bash
cd packages/mobile

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## Backend Architecture

### API Structure

All endpoints are prefixed with `/api/v1`.

**Patients:**
- `GET /api/v1/patients/` - List all patients
- `POST /api/v1/patients/` - Create new patient
- `GET /api/v1/patients/{patient_id}` - Get patient details

**Health Checks:**
- `POST /api/v1/health/checks` - Record health check (BP, heart rate, temperature)
- `GET /api/v1/health/checks/{patient_id}` - Get patient health history

**Medications:**
- `POST /api/v1/medications/` - Add medication
- `GET /api/v1/medications/{patient_id}` - Get patient medications
- `PATCH /api/v1/medications/{medication_id}` - Update medication
- `DELETE /api/v1/medications/{medication_id}` - Deactivate medication

**Appointments:**
- `POST /api/v1/appointments/` - Schedule appointment
- `GET /api/v1/appointments/{patient_id}` - Get patient appointments
- `PATCH /api/v1/appointments/{appointment_id}/complete` - Mark complete
- `DELETE /api/v1/appointments/{appointment_id}` - Cancel appointment

**File Uploads:**
- `POST /api/v1/uploads/` - Upload prescription/medical report
  - Form fields: `patient_id`, `file_type` ("prescription" or "report"), `file`
  - Supported formats: PDF, JPG, PNG (max 10MB)
  - Files stored in `packages/backend/uploads/{type}s/{patient_id}/`
- `GET /api/v1/uploads/{patient_id}` - List patient uploads
- `DELETE /api/v1/uploads/{upload_id}` - Delete upload

**Static Files:**
- `/uploads/*` - Serve uploaded files

**Documentation:**
- API docs (Swagger): http://localhost:8000/docs
- Alternative docs (ReDoc): http://localhost:8000/redoc

### Backend Code Structure

```
packages/backend/src/care_assistant/
├── main.py              # FastAPI app with all routers, CORS, static files
├── config.py            # Settings (API prefix, CORS, upload config)
├── models/
│   ├── patient.py       # Patient, EmergencyContact, HealthCheck, Medication, Appointment
│   └── __init__.py
├── routers/
│   ├── patients.py      # Patient CRUD
│   ├── health.py        # Health check recording
│   ├── medications.py   # Medication management
│   ├── appointments.py  # Appointment scheduling
│   ├── uploads.py       # File upload handling
│   └── __init__.py
└── services/            # Business logic (currently empty)
    └── __init__.py
```

### Configuration

Environment variables (`.env` in packages/backend/):
- `APP_NAME` - Application name
- `APP_VERSION` - Version
- `DEBUG` - Debug mode (True/False)
- `API_PREFIX` - API route prefix (default: `/api/v1`)
- `ALLOWED_ORIGINS` - CORS origins (comma-separated, includes `http://localhost:8081` for React Native)
- `UPLOAD_DIR` - Upload directory path
- `MAX_UPLOAD_SIZE_MB` - Max file size
- `ALLOWED_UPLOAD_EXTENSIONS` - Allowed file extensions

## Mobile Architecture

### Tech Stack
- **Framework**: React Native (bare workflow)
- **Language**: TypeScript
- **State Management**: React Query/TanStack Query for server state
- **Forms**: React Hook Form (to be added)
- **Navigation**: React Navigation (to be added)
- **File Picker**: react-native-image-picker, react-native-document-picker (to be added)
- **API Client**: Axios

### API Services

Located in `packages/mobile/src/services/api/`:
- `client.ts` - Axios instance with interceptors
- `patients.ts` - Patient API calls
- `health.ts` - Health check API calls
- `medications.ts` - Medication API calls
- `appointments.ts` - Appointment API calls
- `uploads.ts` - File upload API calls

### React Query Hooks

Located in `packages/mobile/src/hooks/`:
- **usePatients.ts**: `usePatients()`, `usePatient(id)`, `useCreatePatient()`, `useUpdatePatient()`, `useDeletePatient()`
- **useHealthChecks.ts**: `useHealthChecks(patientId)`, `useCreateHealthCheck()`
- **useMedications.ts**: `useMedications(patientId)`, `useCreateMedication()`, `useUpdateMedication()`, `useDeactivateMedication()`
- **useAppointments.ts**: `useAppointments(patientId)`, `useCreateAppointment()`, `useCompleteAppointment()`, `useCancelAppointment()`

### TypeScript Types

Located in `packages/mobile/src/types/`:
- `patient.ts` - Patient, EmergencyContact, EmergencyContactRelation
- `health.ts` - HealthCheck
- `medication.ts` - Medication
- `appointment.ts` - Appointment

Types mirror the backend Pydantic models for type safety.

### Next Steps for Mobile App

1. **Complete React Native Setup**:
   ```bash
   cd packages/mobile
   npx react-native init CareAssistantMobile --template react-native-template-typescript
   # Merge with existing files
   ```

2. **Add Navigation**:
   - Install: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
   - Create navigation structure (bottom tabs + stack)
   - Define navigation types

3. **Create Screens**:
   - PatientListScreen, PatientDetailsScreen
   - HealthCheckScreen
   - MedicationListScreen, AddMedicationScreen
   - AppointmentListScreen, ScheduleAppointmentScreen
   - UploadDocumentScreen

4. **Add UI Components**:
   - PatientCard, VitalSignsCard
   - Button, Input, Card
   - FormField (with react-hook-form)

5. **Implement File Upload**:
   - Install react-native-image-picker
   - Install react-native-document-picker
   - Create upload flow

## Development Workflow

### Running Both Services

```bash
# Terminal 1: Start backend
npm run backend

# Terminal 2: Start Metro bundler
npm run mobile

# Terminal 3: Run on device/simulator
npm run mobile:ios
# OR
npm run mobile:android
```

### Or use concurrently:

```bash
npm run dev
```

### Testing the Integration

1. Start backend: `npm run backend`
2. Backend available at http://localhost:8000
3. Start mobile app: `npm run mobile:ios`
4. Mobile app connects to http://localhost:8000/api/v1
5. Test API calls from mobile app to backend

## Database

Currently using **in-memory storage** (no persistence).

**Next steps**:
- Add PostgreSQL
- Implement database layer in `services/`
- Use SQLAlchemy ORM
- Add Alembic for migrations

## Testing

### Backend
```bash
cd packages/backend
pytest
pytest --cov=src/care_assistant
```

### Mobile
```bash
cd packages/mobile
npm test
```

## Key Pydantic Models (Backend)

**Patient**:
- first_name, last_name, date_of_birth, email, phone, address
- emergency_contacts: list[EmergencyContact]
- medical_notes

**HealthCheck**:
- patient_id
- blood_pressure_systolic, blood_pressure_diastolic
- heart_rate, temperature
- notes, checked_at

**Medication**:
- patient_id, name, dosage, frequency
- start_date, end_date, instructions
- active (boolean)

**Appointment**:
- patient_id, title, description, appointment_type
- scheduled_at, duration_minutes, location
- completed (boolean), notes

## File Upload Implementation

**Backend**:
- Multipart form data upload
- Validates file type and size
- Stores in `uploads/prescriptions/{patient_id}/` or `uploads/reports/{patient_id}/`
- Serves files via `/uploads/` static mount

**Mobile**:
- Use FormData to upload
- Include patient_id, file_type, and file in request
- Handle upload progress and errors

## Important Notes

- Backend Python virtual environment is NOT managed by npm (use `pip install` manually)
- Mobile dependencies ARE managed by npm workspaces
- Always activate Python venv before running backend commands
- React Native requires native code setup (`react-native init`) for full functionality
- Backend must be running for mobile app to function
- CORS is configured to allow React Native Metro bundler (port 8081)
