# CareNest — Offline-First Home Healthcare Coordination

CareNest is a web-first PWA and mobile-ready prototype for coordinating home healthcare across patients, caregivers, family contacts, and clinic teams. Its core demo focuses on reliable home-visit documentation when connectivity is weak or temporarily unavailable.

## Core demo flow
1. Open a patient and review the care context.
2. Start a caregiver visit.
3. If connectivity is unavailable, the visit is queued locally instead of being lost.
4. When connectivity returns, queued visits sync to the API.
5. Duplicate sync attempts are skipped safely and write operations are recorded in the audit log.
6. Messaging and telehealth signaling demonstrate escalation paths back to the wider care team.

## Stack
- Frontend: React + Vite
- Backend: Express + Socket.IO
- Data model: Prisma schema + SQL migration artifacts + in-memory demo data
- Realtime: Socket.IO messaging and WebRTC signaling relay scaffold
- Mobile/PWA: service worker + web manifest + Capacitor wrapper
- Tests: Vitest + Supertest API tests

## Run locally
Requires Node.js 20 or newer.

```bash
npm install
npm run seed
npm run dev
```

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

Demo login:
- Email: `admin@carenest.test`
- Password: `password123`

You can override the demo password with the `DEMO_PASSWORD` environment variable.

## Validate before a demo

```bash
npm run check
```

This runs TypeScript typechecking, API/unit tests, and the production web build.

## Production-style preview
The preview server still needs the API running.

Terminal 1:
```bash
npm run dev:api
```

Terminal 2:
```bash
npm run build
npm run preview
```

Then open `http://localhost:4173`.

## Offline behavior
After the app has been loaded online at least once, the service worker caches same-origin app assets so the interface can relaunch during a connectivity interruption. Home visits created offline are stored in a local queue and can be synchronized later. API and Socket.IO traffic are intentionally not cached.

## Implemented prototype pieces
- Patient list/detail screens
- Visit calendar and visit lifecycle API
- Offline visit queue + idempotent sync endpoint
- Vitals API with validation
- Realtime messaging scaffold
- Telehealth signaling channel
- Audit logging for demo write operations
- Basic invoice generation/export
- PWA service worker and manifest
- Capacitor Android/iOS wrapper configuration
- GitHub CI and Android debug APK workflows

## Security and clinical-safety scope
CareNest is a hackathon prototype, not a production clinical system.

Implemented in the prototype:
- Input validation for key API write endpoints
- Demo credential checking
- Consent fields in the patient model
- Audit logging for important demo actions
- Role fields in the domain model

Not yet implemented and required before real deployment:
- Production authentication and authorization/RBAC enforcement
- Secure password hashing and account recovery
- TLS termination and encrypted production storage
- Signed attachment URLs and retention policies
- 2FA/OTP
- Clinical validation, regulatory review, and real-world safety testing
- Production database persistence

CareNest does not make diagnoses. Any future risk-detection or AI component should be treated as clinician-reviewed decision support until clinically validated.

## Android debug APK
The workflow `.github/workflows/android-apk.yml` builds and uploads a `carenest-debug-apk` artifact. The APK contains the web application shell; a real mobile deployment must be configured to reach a deployed backend rather than relying on the local Vite proxy.

## Repository notes
- API reference: `docs/API.md`
- Postman collection: `docs/postman_collection.json`
- Migration artifacts: `prisma/migrations/...`
- Seed script: `backend/scripts/seed.ts`
- `ml-code-sample/` is a standalone learning/code sample and is **not part of the CareNest runtime or clinical workflow**.
