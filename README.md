# Care Assistant - Monorepo

An elderly care assistant system built as an npm workspaces monorepo with a FastAPI backend and React Native mobile app.

## Project Structure

```
care-assistant/
├── package.json              # Root workspace configuration
├── packages/
│   ├── backend/              # FastAPI Python backend
│   │   └── See packages/backend/README.md
│   └── mobile/               # React Native mobile app
│       └── See packages/mobile/README.md
```

## Features

### Backend (FastAPI)
- Patient management with demographics and emergency contacts
- Health monitoring (vital signs: BP, heart rate, temperature)
- Medication tracking with dosage and schedules
- Appointment scheduling
- File upload for prescriptions and medical reports (PDF, JPG, PNG)

### Mobile (React Native)
- TypeScript-based React Native app (bare workflow)
- React Query for server state management
- API services and hooks for all backend endpoints
- Screens for patients, health checks, medications, appointments, uploads
- Type-safe API communication

## Quick Start

### Prerequisites
- Node.js >=18.0.0
- Python 3.12
- npm >=9.0.0
- React Native development environment (Xcode for iOS, Android Studio for Android)

### Installation

```bash
# Install all npm dependencies
npm install

# Setup backend Python environment
cd packages/backend
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install -r requirements-dev.txt
pip install -e .
cd ../..
```

### Running the Application

**Option 1: Run both together**
```bash
npm run dev
```

**Option 2: Run separately**
```bash
# Terminal 1: Backend
npm run backend

# Terminal 2: Mobile Metro bundler
npm run mobile

# Terminal 3: iOS/Android
npm run mobile:ios
# or
npm run mobile:android
```

### API Documentation

Once the backend is running:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Available Commands

### From Root

| Command | Description |
|---------|-------------|
| `npm run dev` | Run backend and mobile together |
| `npm run backend` | Start FastAPI backend server |
| `npm run backend:test` | Run backend tests |
| `npm run mobile` | Start React Native Metro bundler |
| `npm run mobile:ios` | Run iOS app |
| `npm run mobile:android` | Run Android app |
| `npm run test` | Run all tests |

### Backend Specific

```bash
cd packages/backend

# Activate virtual environment
source .venv/bin/activate

# Run development server
uvicorn src.care_assistant.main:app --reload

# Run tests
pytest

# Code formatting
black src/ tests/

# Linting
ruff check src/ tests/
```

### Mobile Specific

```bash
cd packages/mobile

# Start Metro
npm start

# Run on iOS
npm run ios

# Run on Android
emulator -avd myEmu -gpu host
npm run android

# Tests
npm test

# Type check
npm run type-check
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Patients
- `GET /patients/` - List patients
- `POST /patients/` - Create patient
- `GET /patients/{id}` - Get patient details

### Health Checks
- `POST /health/checks` - Record health check
- `GET /health/checks/{patient_id}` - Get patient health history

### Medications
- `POST /medications/` - Add medication
- `GET /medications/{patient_id}` - Get patient medications
- `PATCH /medications/{id}` - Update medication
- `DELETE /medications/{id}` - Deactivate medication

### Appointments
- `POST /appointments/` - Schedule appointment
- `GET /appointments/{patient_id}` - Get patient appointments
- `PATCH /appointments/{id}/complete` - Mark complete
- `DELETE /appointments/{id}` - Cancel appointment

### File Uploads
- `POST /uploads/` - Upload prescription/report (multipart/form-data)
- `GET /uploads/{patient_id}` - List patient uploads
- `DELETE /uploads/{id}` - Delete upload

## Development

### Testing

```bash
# Backend tests
cd packages/backend
pytest --cov=src/care_assistant

# Mobile tests (after completing React Native setup)
cd packages/mobile
npm test
```

### Code Quality

**Backend:**
```bash
black src/ tests/
ruff check src/ tests/
```

**Mobile:**
```bash
npm run lint
npm run type-check
```

## Project Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI
- **Models**: Pydantic for validation
- **Storage**: In-memory (database integration pending)
- **File Storage**: Local filesystem (`uploads/`)

### Mobile (React Native + TypeScript)
- **Framework**: React Native (bare workflow)
- **State**: React Query/TanStack Query
- **API Client**: Axios
- **Navigation**: React Navigation (to be added)
- **Forms**: React Hook Form (to be added)

## Next Steps

### Backend
- [ ] Add PostgreSQL database
- [ ] Implement SQLAlchemy ORM
- [ ] Add authentication (JWT)
- [ ] Add database migrations (Alembic)

### Mobile
- [ ] Complete React Native native code setup (`npx react-native init`)
- [ ] Add React Navigation
- [ ] Create all screen components
- [ ] Add UI component library
- [ ] Implement file upload with react-native-image-picker
- [ ] Add offline support
- [ ] Add push notifications

## Documentation

- **Full documentation**: See [CLAUDE.md](./CLAUDE.md)
- **Backend docs**: See [packages/backend/README.md](./packages/backend/README.md)
- **Mobile docs**: See [packages/mobile/README.md](./packages/mobile/README.md)

## License

[Add your license here]
