# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Firebase-based bus tracking system (PROJET_BUS) designed to provide real-time GPS tracking, notifications, and management features for school buses. The project follows an iterative quality philosophy with vertical slice development.

**Firebase Project ID:** `projet-bus-60a3f`
**Region:** europe-west4

## Architecture

### Core Components

1. **Firebase Functions** (`/functions`)
   - TypeScript-based Cloud Functions
   - Node.js 22 runtime
   - Compiled output to `lib/` directory
   - Global max instances set to 10 for cost control

2. **Backend** (`/backend`)
   - Separate Node.js environment with firebase-admin
   - Used for backend services distinct from Cloud Functions

3. **Frontend** (`/private`)
   - Firebase Hosting static files
   - Single-page application with Firebase SDK integration
   - Configured with emulator support

4. **Firestore Database**
   - Collections structure for GPS tracking:
     - `/gps_live/{busId}` - Real-time GPS positions
     - `/gps_history/{busId}/{jour}` - Historical tracking data
   - Location: europe-west4
   - Security rules: Currently permissive (expires 2025-12-13) - needs production rules

## Development Commands

### Functions Development

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Lint code
npm run lint

# Build TypeScript
npm run build

# Watch mode (auto-rebuild)
npm run build:watch

# Serve locally with emulators
npm run serve

# Deploy to Firebase
npm run deploy

# View logs
npm run logs
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

# Run emulators
firebase emulators:start
firebase emulators:start --only functions
```

### Backend Development

```bash
cd backend
npm install
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
2. Backend logic (WebSocket/Cloud Function)
3. Backend unit tests
4. API endpoints
5. API integration tests
6. Web frontend (admin)
7. Mobile frontend (parents/drivers)
8. Functional tests on real devices

## Code Quality Standards

### TypeScript Configuration
- Target: ES2017
- Strict mode enabled
- No implicit returns
- No unused locals
- Module system: NodeNext

### Backend Testing Requirements
**MANDATORY** unit tests for:
- GPS data processing
- Distance/ETA calculations
- Route compliance validation
- Notification triggers
- Absence tracking and boarding/exiting rules

**Rule:** No business logic in endpoints - all logic must be in `/services/` modules

### API Standards
- **Strict validation** using Zod (TypeScript) or Pydantic (Python)
- Test all endpoints for:
  - Normal operation
  - Invalid parameters (422)
  - Not found scenarios (404)

Example GPS schema:
```typescript
{
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
}
```

### Firestore Security Rules
Production rules must enforce:
- **Parents:** Access only to their child + assigned bus
- **Drivers:** Access only to their assigned bus
- **Admins:** Full read/write access
- **Principle:** Backend decides, Firestore stores (no logic in security rules)

### Frontend Standards
- **TypeScript strongly recommended** for web admin
- Component-based architecture: `BusCard`, `MapView`, `NotificationTable`, `MaintenanceCard`
- Mobile-first UX: simple screens, clear CTAs, map updates every 3-5 seconds
- State management: Provider/Redux Toolkit/Context with clear states: `en_route`, `arrived`, `delayed`

## CI/CD & Git Workflow

### Branch Strategy
- `main` - Production
- `develop` - Stable development version
- `feature/...` - One feature per branch

### Pull Request Requirements
Each PR must include:
- Short description
- What functionality is added
- How to test
- Screenshots (if UI changes)

### GitHub Actions
Configured workflows:
- **On merge to main:** Deploy to Firebase Hosting
- **On PR:** Preview deployment

### Pre-deployment Hooks
Functions deployment runs:
1. `npm run lint`
2. `npm run build`

**ABSOLUTE RULE:** If tests fail → PR blocked → no merge

## Monitoring & Logs

Monitor for:
- GPS data stream failures
- API latency > 200ms
- Failed notification deliveries
- Mobile crashes

Tools:
- Google Cloud Logging
- Firebase Crashlytics (mobile)
- UptimeRobot/GCP Monitoring

## 5 Pillars of Quality

1. **Automated Testing** (unit, integration, real device)
2. **Strict Typing** (TypeScript/Python)
3. **Strict Validation** (Zod/Pydantic)
4. **Git Flow + Pull Requests**
5. **Mandatory CI/CD** (tests + lint + build)

## Important Notes

- Current Firestore rules are **permissive and temporary** - expire 2025-12-13
- Storage rules currently block all access - configure based on requirements
- Firebase emulator mode is enabled in hosted index.html
- Maximum 10 concurrent Cloud Function instances (cost control)
