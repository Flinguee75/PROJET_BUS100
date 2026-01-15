# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Projet personnel de système de suivi GPS pour flottes de transport scolaire.
Solution complète pour aider les écoles et parents à localiser les bus en temps réel.
Architecture Firebase multi-plateforme (Backend Node.js, Dashboard React, App Flutter).

The project follows an iterative quality philosophy with vertical slice development.

**Statut:** Prototype fonctionnel - Projet personnel
**Firebase Project ID:** `projet-bus-60a3f`
**Region:** europe-west4 (RGPD compliance)

## Contexte du Projet

### Objectif
Développer une solution complète de tracking GPS pour le transport scolaire permettant:
- Aux **écoles** de superviser leurs flottes en temps réel
- Aux **parents** de savoir où se trouve le bus de leur enfant
- Aux **conducteurs** de signaler leur position automatiquement

### Problématique adressée
Dans de nombreux systèmes de transport scolaire:
- Les parents manquent de visibilité sur les trajets
- Les écoles ont peu de contrôle centralisé sur la flotte
- Le suivi GPS et la communication sont fragmentés ou inexistants

### Compétences démontrées
- Architecture backend cloud-native avec Firebase Cloud Functions
- Développement frontend React moderne avec TypeScript strict
- Développement mobile cross-platform avec Flutter
- CI/CD automatisé avec GitHub Actions
- Testing rigoureux (unit, integration) avec coverage
- Documentation technique professionnelle
- Pratiques de sécurité (validation, authentification)

**Note pour les contributeurs:** Ce repository suit des patterns professionnels.
Certaines fonctionnalités avancées sont en cours de développement (voir Known Gaps section).

## Architecture

### Core Components

1. **Firebase Cloud Functions** (`/backend`)
   - TypeScript-based Cloud Functions with Express.js
   - Node.js 22 runtime
   - Compiled output to `lib/` directory
   - Global max instances set to 10 for cost control
   - Region: europe-west4

2. **Web Admin Dashboard** (`/web-admin`)
   - React 18.2.0 + TypeScript 5.3.3
   - Vite 5.0.11 build tool
   - Tailwind CSS 3.4.1 for styling
   - Mapbox GL 3.1.2 for real-time map display
   - React Router v7 for navigation
   - Firebase SDK 10.7.2
   - Testing: Vitest 1.2.1 with React Testing Library

3. **Flutter Parent Mobile App** (`/mobile-parent/parent_app`)
   - Flutter SDK ^3.10.0 with Dart
   - Google Maps integration for bus tracking
   - Provider 6.1.2 for state management
   - Firebase SDK (Auth, Firestore, Messaging)
   - Real-time ETA display and notifications

4. **Firestore Database**
   - Location: europe-west4
   - Collections structure:
     - `/buses/{busId}` - Bus information (plate, capacity, driver assignment)
     - `/gps_live/{busId}` - Real-time GPS positions
     - `/gps_history/{busId}/{day}/{positionId}` - Historical tracking data
     - `/students/{studentId}` - Student/child information
     - `/users/{userId}` - User profiles (admin, driver, parent)
     - `/notifications/{notificationId}` - Push notifications
     - `/routes/{routeId}` - Bus routes and schedules
     - `/attendance/{attendanceId}` - Student boarding/alighting records
     - `/fcm_tokens/{userId}_{token}` - Push notification device tokens
   - Security rules: Currently permissive (expires 2025-12-13) - needs production rules

## Directory Structure

```
/
├── backend/                    # Firebase Cloud Functions + Express API
│   ├── src/
│   │   ├── index.ts           # Main Cloud Function export
│   │   ├── controllers/       # Thin request handlers
│   │   ├── services/          # Business logic (thick services)
│   │   ├── routes/            # Express route definitions
│   │   ├── triggers/          # Firestore/Auth triggers
│   │   ├── types/             # Centralized TypeScript types
│   │   ├── config/            # Firebase Admin SDK config
│   │   └── utils/             # WebSocket manager, utilities
│   ├── lib/                   # Compiled JavaScript (build output)
│   ├── tests/
│   │   ├── unit/              # Service & controller unit tests
│   │   └── integration/       # Full endpoint integration tests
│   ├── tsconfig.json
│   ├── jest.config.js         # 100% coverage threshold
│   └── package.json
│
├── web-admin/                  # React Admin Dashboard
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Route/page components
│   │   ├── services/          # API clients & Firebase services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── contexts/          # React Context providers
│   │   ├── types/             # TypeScript definitions
│   │   ├── tests/             # Vitest unit/component tests
│   │   ├── App.tsx            # Main app with routing
│   │   └── main.tsx           # Entry point
│   ├── public/                # Static assets
│   ├── dist/                  # Build output (for Firebase Hosting)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── mobile-parent/parent_app/   # Flutter Parent App
│   ├── lib/
│   │   ├── main.dart          # App entry with MultiProvider
│   │   ├── screens/           # Full-page widgets (home, map, profile)
│   │   ├── services/          # Business logic & API clients
│   │   ├── providers/         # State management (auth, bus)
│   │   ├── models/            # Data models (bus, student, user)
│   │   ├── widgets/           # Reusable widgets
│   │   └── utils/             # Color constants, helpers
│   ├── test/                  # Flutter widget tests
│   ├── android/               # Android native configuration
│   ├── ios/                   # iOS native configuration
│   ├── pubspec.yaml
│   └── analysis_options.yaml
│
├── .github/workflows/          # CI/CD pipelines
│   ├── backend.yml            # Backend lint, test, deploy
│   ├── web-admin.yml          # Web admin build
│   ├── mobile-parent.yml      # Flutter build & test
│   ├── firebase-hosting-merge.yml
│   └── firebase-hosting-pull-request.yml
│
├── docs/                       # Documentation
├── INFO/                       # Information files
├── firebase.json               # Firebase configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore index definitions
├── storage.rules               # Cloud Storage security rules
├── .firebaserc                 # Firebase project config
├── CLAUDE.md                   # This file
└── README.md                   # Main documentation
```

## Development Commands

### Backend Development (Cloud Functions)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Lint code
npm run lint

# Build TypeScript
npm run build

# Watch mode (auto-rebuild)
npm run build:watch

# Run tests with coverage
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Serve locally with Firebase emulators
firebase emulators:start --only functions

# Deploy to Firebase
firebase deploy --only functions

# View logs
firebase functions:log
```

### Web Admin Development

```bash
# Navigate to web-admin directory
cd web-admin

# Install dependencies
npm install

# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests with Vitest
npm test

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check

# Lint
npm run lint
```

### Flutter Mobile Development

```bash
# Navigate to mobile-parent directory
cd mobile-parent/parent_app

# Get dependencies
flutter pub get

# Run app (development)
flutter run

# Build APK (Android)
flutter build apk

# Build iOS
flutter build ios

# Run tests
flutter test

# Generate mocks (for testing)
flutter pub run build_runner build

# Check for issues
flutter doctor
```

### Firebase Operations

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only firestore
firebase deploy --only hosting
firebase deploy --only storage

# Run all emulators
firebase emulators:start

# Run specific emulators
firebase emulators:start --only functions,firestore
```

## Development Philosophy

This project follows a **Vertical Slice** development approach:

1. **Never implement layers horizontally** (all backend, then all frontend)
2. **Always implement features vertically** - each feature goes from database → backend → API → frontend → tests before moving to the next
3. **Quality is iterative** - integrate quality at each step, not at the end
4. **One iteration = one stable, tested, usable feature**

### Feature Implementation Order

For each new feature (e.g., "Real-time Bus Tracking"):
1. Firestore collections/documents
2. Backend logic (Cloud Function/Express endpoint)
3. Backend unit tests
4. API endpoints with validation
5. API integration tests
6. Web admin frontend
7. Mobile frontend (parents/drivers)
8. End-to-end functional tests

## Code Quality Standards

### TypeScript Configuration

**Backend** (`backend/tsconfig.json`):
- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- No implicit returns
- No unused locals/parameters

**Web Admin** (`web-admin/tsconfig.json`):
- Target: ES2020
- Module: ESNext
- React JSX support
- Strict mode enabled
- Path aliases configured

### Backend Architecture Rules

**MANDATORY PATTERNS:**
- **Thick Services, Thin Controllers** - All business logic in `/services/`, controllers only handle request/response
- **Centralized Types** - All TypeScript interfaces in `/types/` directory
- **Validation First** - Use Zod schemas for all API inputs
- **Error Handling** - Try-catch in controllers, meaningful error messages
- **WebSocket** - Only for local development (emulator mode), production uses Firestore listeners

**Service Layer** (`/backend/src/services/`):
- `gps.service.ts` - GPS position updates, archiving, status determination
- `bus.service.ts` - Bus CRUD operations, driver/route assignment
- `notification.service.ts` - FCM push notifications, delivery tracking
- `dashboard.service.ts` - Statistics aggregation, metrics calculation

**Controller Layer** (`/backend/src/controllers/`):
- Validate inputs with Zod
- Call service methods
- Return standardized responses
- Handle errors gracefully

### Backend Testing Requirements

**MANDATORY** unit tests for:
- GPS data processing and archiving
- Distance/ETA calculations
- Route compliance validation
- Notification triggers
- Attendance tracking and boarding/exiting rules
- All service methods
- Input validation schemas

**Coverage Requirement:** 100% (branches, functions, lines, statements)

**Test Structure:**
```
tests/
├── unit/              # Isolated unit tests (services, validation)
└── integration/       # Full HTTP endpoint tests with supertest
```

**Example Test Pattern:**
```typescript
// Unit test
describe('GPSService', () => {
  it('should archive GPS data correctly', async () => {
    // Arrange, Act, Assert
  });
});

// Integration test
describe('POST /api/gps', () => {
  it('should return 200 with valid GPS data', async () => {
    const response = await request(app)
      .post('/api/gps')
      .send({ busId: '123', lat: 48.8566, lng: 2.3522 });
    expect(response.status).toBe(200);
  });
});
```

### API Standards

- **Strict validation** using Zod (TypeScript)
- **REST conventions** - Proper HTTP verbs and status codes
- **Error responses** - Consistent JSON format with error codes
- Test all endpoints for:
  - Normal operation (200/201)
  - Invalid parameters (400/422)
  - Not found scenarios (404)
  - Unauthorized access (401/403)

**Example GPS Position Schema:**
```typescript
{
  busId: string;
  position: {
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
    timestamp: number;
  };
  driverId?: string;
  routeId?: string;
  status: 'moving' | 'stopped' | 'idle';
}
```

**API Endpoints:**
- `GET /health` - Health check (includes WebSocket client count)
- `POST /api/gps` - Update bus GPS position
- `GET /api/gps/:busId` - Get latest GPS position
- `GET /api/buses` - List all buses
- `POST /api/buses` - Create bus
- `PATCH /api/buses/:id` - Update bus
- `DELETE /api/buses/:id` - Delete bus
- `GET /dashboard/stats` - Dashboard statistics

### Firestore Security Rules

**Architecture Principle:** Backend decides, Firestore stores (no complex logic in security rules)

**Production Rules Must Enforce:**
- **Parents:** Access only to their child + assigned bus GPS data
- **Drivers:** Access only to their assigned bus + ability to write GPS positions
- **Admins:** Full read/write access to all collections
- **Authentication Required:** All operations require valid Firebase Auth token

**Role-Based Access Summary:**
- `/buses` - Admin write, Driver read (assigned), Parent read (assigned bus)
- `/gps_live` - Authenticated read, Driver write (assigned bus only)
- `/gps_history` - Admin read, Driver read (own bus), Parent read (assigned bus)
- `/students` - Admin write, Parent read (own children only)
- `/users` - User reads own profile, Admin reads all
- `/notifications` - Authenticated read (if in recipientIds), Admin write
- `/routes` - Authenticated read, Admin write
- `/attendance` - Driver/Admin write, Admin read
- `/fcm_tokens` - User manages own tokens only (doc id: `{userId}_{token}`)

**CRITICAL:** Current rules expire 2025-12-13 - Update before expiration!

### Frontend Standards

**Web Admin (React):**
- **Component Architecture:** Reusable components (`BusCard`, `MapView`, `StatsCard`, `ErrorBoundary`)
- **State Management:** React Query (TanStack) for server state, Context API for auth
- **Styling:** Tailwind CSS utility classes, responsive design
- **Maps:** Mapbox GL for real-time tracking visualization
- **Error Handling:** ErrorBoundary component catches React errors
- **Testing:** Vitest with React Testing Library

**Page Components:**
- `LoginPage` - Firebase authentication
- `DashboardPage` - Overview with statistics cards
- `RealtimeMapPage` - Live GPS map with bus markers
- `BusesManagementPage` - CRUD operations for buses
- `BusDetailsPage` - Individual bus information

**Mobile (Flutter):**
- **Architecture:** Provider pattern for state management
- **UI/UX:** Material Design, mobile-first, simple screens with clear CTAs
- **Maps:** Google Maps Flutter for bus tracking
- **Real-time Updates:** Firestore listeners with StreamBuilder
- **State:** `AuthProvider`, `BusProvider`
- **Services:** `AuthService`, `BusService`, `ETAService`, `FirebaseService`

**Screen Components:**
- `SplashScreen` - Initial loading
- `LoginScreen` - Parent authentication
- `HomeScreen` - ETA display, quick actions
- `MapScreen` - Real-time bus tracking map
- `ProfileScreen` - User profile view and editing
- `EnfantSettingsScreen` - Child/student settings

**Key Features:**
- Real-time ETA display on home screen
- Google Maps integration with bus markers
- Push notifications for bus updates
- User profile management
- Child/student information

## CI/CD & Git Workflow

### Branch Strategy
- `main` - Production (protected, deploys to Firebase)
- `develop` - Stable development version
- `feature/*` - One feature per branch
- `claude/*` - AI assistant work branches

### Pull Request Requirements

Each PR must include:
- Short description of changes
- What functionality is added/modified
- How to test the changes
- Screenshots (if UI changes)
- All tests passing
- Lint checks passing

### GitHub Actions Workflows

**Backend CI/CD** (`.github/workflows/backend.yml`):
- **Trigger:** Push to main/develop on `backend/**` changes
- **Steps:**
  1. Setup Node.js 22 with npm cache
  2. Install dependencies
  3. Run `npm run lint` (ESLint)
  4. Run `npm test -- --coverage` (Jest with 100% threshold)
  5. Build TypeScript (`npm run build`)
  6. Deploy to Firebase Functions (main branch only)
  7. Upload coverage to Codecov

**Web Admin CI/CD** (`.github/workflows/web-admin.yml`):
- **Trigger:** Push on `web-admin/**` changes
- **Steps:**
  1. Lint and type-check
  2. Run Vitest tests
  3. Build with Vite

**Firebase Hosting:**
- **Merge to main** - Deploy to production hosting
- **Pull Request** - Generate preview URL

**Mobile CI/CD** (`.github/workflows/mobile-parent.yml`):
- **Trigger:** Push on `mobile-parent/**` changes
- **Steps:**
  1. Setup Flutter environment
  2. Run `flutter test`
  3. Build APK/iOS artifacts

### Pre-deployment Hooks

**Functions Deployment** (configured in `firebase.json`):
```bash
npm run lint && npm run build
```

**ABSOLUTE RULE:** If tests fail → PR blocked → no merge

## Testing Strategy

### Backend Testing (Jest)

**Configuration:** `backend/jest.config.js`
- Framework: Jest 29.7.0 with ts-jest
- Environment: Node.js
- Coverage Threshold: 100% (all metrics)
- Timeout: 10 seconds per test

**Run Commands:**
```bash
npm test              # All tests with coverage
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch    # Watch mode
```

**Coverage Requirements:**
- Branches: 100%
- Functions: 100%
- Lines: 100%
- Statements: 100%

### Web Admin Testing (Vitest)

**Configuration:** Inline in `vite.config.ts`
- Framework: Vitest 1.2.1
- Environment: jsdom (DOM emulation)
- Testing Library: @testing-library/react
- Coverage Provider: v8

**Run Commands:**
```bash
npm test          # Run all tests
npm run test:ui   # Visual test runner
npm run test:coverage  # With coverage report
```

### Flutter Testing

**Configuration:** `pubspec.yaml`
- Framework: Flutter test
- Mocking: mockito 5.4.4
- Firebase Mocks: fake_cloud_firestore, firebase_auth_mocks

**Run Commands:**
```bash
flutter test
flutter test --coverage
```

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend Runtime** | Node.js | 22 |
| **Backend Framework** | Express.js | 4.19.2 |
| **Backend Language** | TypeScript | 5.7.3 |
| **Database** | Cloud Firestore | - |
| **Database SDK** | firebase-admin | 12.6.0 |
| **Validation** | Zod | 3.23.8 |
| **Backend Testing** | Jest + ts-jest | 29.7.0 |
| **Web Framework** | React | 18.2.0 |
| **Web Bundler** | Vite | 5.0.11 |
| **Web Language** | TypeScript | 5.3.3 |
| **Web Router** | React Router | 7.9.6 |
| **Web Styling** | Tailwind CSS | 3.4.1 |
| **Web Maps** | Mapbox GL | 3.1.2 |
| **Web HTTP Client** | Axios | 1.6.5 |
| **Web State** | React Query (TanStack) | 5.17.19 |
| **Web Testing** | Vitest | 1.2.1 |
| **Mobile Framework** | Flutter | ^3.10.0 |
| **Mobile Language** | Dart | - |
| **Mobile State** | Provider | 6.1.2 |
| **Mobile Maps** | Google Maps Flutter | 2.12.0 |
| **Mobile Firebase** | firebase_core | 3.11.0 |
| **Cloud Platform** | Firebase (GCP) | - |
| **Cloud Functions** | Firebase Functions | Node.js 22 |
| **Hosting** | Firebase Hosting | - |
| **CI/CD** | GitHub Actions | - |

## Monitoring & Observability

**Monitor for:**
- GPS data stream failures (missing position updates)
- API latency > 200ms
- Failed notification deliveries
- Cloud Function errors and cold starts
- Mobile app crashes (Crashlytics)
- Firestore read/write spikes

**Tools:**
- **Backend:** Google Cloud Logging (Firebase Console)
- **Mobile:** Firebase Crashlytics
- **Uptime:** Consider UptimeRobot or GCP Monitoring
- **Performance:** Firebase Performance Monitoring

**Logs Access:**
```bash
# View Cloud Function logs
firebase functions:log

# Tail logs in real-time
firebase functions:log --only api

# View in Google Cloud Console
gcloud logging read "resource.type=cloud_function"
```

## Known Gaps & Technical Debt

### Critical Items

1. **Firestore Security Rules - URGENT**
   - Current rules expire: 2025-12-13
   - Rules are permissive for development
   - **Action:** Update with production role-based rules before expiration

2. **Storage Rules**
   - Currently block all access
   - **Action:** Configure if file upload/download is needed (e.g., profile photos, documents)

### Missing Components

3. **Driver Mobile App**
   - Referenced in workflows but not implemented
   - Only parent app exists
   - **Action:** Implement driver app for GPS tracking and attendance management

4. **Incomplete Web Admin Pages**
   - Drivers management page is placeholder
   - Students management page is placeholder
   - Settings page is placeholder
   - **Action:** Complete CRUD interfaces for drivers and students

### Technical Improvements

5. **Environment Configuration**
   - No `.env.example` files in web-admin or backend
   - **Action:** Create template files for new developer onboarding

6. **API Documentation**
   - No OpenAPI/Swagger specification
   - **Action:** Generate API docs for easier frontend integration

7. **WebSocket Limitations**
   - WebSocket only works in emulator mode (local development)
   - Production relies on Firestore listeners (5-10 second latency)
   - **Action:** Consider Firebase Realtime Database for sub-second GPS updates

8. **Error Monitoring**
   - No centralized error tracking (Sentry, Rollbar, etc.)
   - **Action:** Integrate error monitoring service for production

9. **Test Coverage Gaps**
   - Flutter tests configured but limited implementation
   - Web admin tests don't cover all edge cases
   - **Action:** Increase test coverage incrementally

10. **Performance Optimization**
    - No CDN for static assets
    - No image optimization pipeline
    - **Action:** Configure Firebase Hosting CDN properly, implement image optimization

## 5 Pillars of Quality

1. **Automated Testing** - Unit, integration, and end-to-end tests at every layer
2. **Strict Typing** - TypeScript/Dart with no `any` types allowed
3. **Strict Validation** - Zod/Pydantic for all API inputs
4. **Git Flow + Pull Requests** - Feature branches, code review, protected main
5. **Mandatory CI/CD** - Tests, lint, and build must pass before merge/deploy

## Important Notes for AI Assistants

- **Vertical Slice First:** When adding features, implement database → backend → tests → frontend in sequence
- **Test Before Deploy:** Always run tests before committing backend changes
- **Type Everything:** No `any` types, no implicit returns, strict mode always enabled
- **Services Over Controllers:** Business logic belongs in services, not controllers
- **Validate All Inputs:** Use Zod schemas for all API request validation
- **Security Rules Expire:** Remember 2025-12-13 deadline for Firestore rules
- **WebSocket Local Only:** Don't rely on WebSocket for production features
- **100% Coverage Required:** Backend tests must maintain 100% coverage threshold
- **Mobile-First UX:** Keep mobile interfaces simple with clear call-to-action buttons
- **Real-time Updates:** Use Firestore listeners, update GPS every 3-5 seconds on map
- **Error Handling:** Always provide meaningful error messages for debugging
- **Firebase Emulators:** Use emulators for local development to avoid costs

## Quick Reference Commands

```bash
# Start full local environment
firebase emulators:start

# Backend: Test + Build + Deploy
cd backend && npm test && npm run build && firebase deploy --only functions

# Web Admin: Build + Deploy
cd web-admin && npm run build && firebase deploy --only hosting

# Mobile: Run on device
cd mobile-parent/parent_app && flutter run

# View all logs
firebase functions:log

# Check Firebase project
firebase projects:list
firebase use projet-bus-60a3f
```

## Resources

- **Firebase Console:** https://console.firebase.google.com/project/projet-bus-60a3f
- **Documentation:** `/docs` directory
- **Quick Start:** `QUICK_START.md`
- **Backend Setup:** `BACKEND_SETUP.md`
- **Testing Guide:** `TESTS.md`
- **Connection Guide:** `CONNECTION.md`
