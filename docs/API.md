# CareNest API Docs

## REST endpoints
- `POST /api/auth/login` — demo email/password login. Default demo password: `password123` (override with `DEMO_PASSWORD`).
- `GET /api/patients` — list patient profiles including demographics, allergies, care plans, and consent metadata.
- `GET /api/visits` / `POST /api/visits` — list and create visits.
- `POST /api/visits/:id/start` — start a scheduled visit. Starting an already in-progress visit is idempotent; completed visits cannot be restarted.
- `POST /api/visits/:id/complete` — complete a visit and optionally record notes/duration.
- `POST /api/vitals` — record a typed vital value for a patient.
- `POST /api/messages` — create a validated demo message and fan it out through Socket.IO.
- `POST /api/invoices/generate/:visitId` / `GET /api/invoices/export.csv` — billing-demo endpoints.
- `GET /api/audit-logs` — read the in-memory audit trail.
- `POST /api/sync/visits` — synchronize up to 100 offline visits. Duplicate visit IDs are skipped safely.

## Offline sync payload
```json
{
  "visits": [
    {
      "id": "offline_123",
      "patientId": "pt_01",
      "caregiverId": "u_cg1",
      "startTime": "2026-09-08T12:00:00.000Z",
      "status": "in_progress",
      "visitType": "routine"
    }
  ]
}
```

Successful response:
```json
{ "synced": 1, "skipped": 0 }
```

## Real-time API
- Socket.IO event `message:new` — demo chat updates.
- Socket.IO event `telehealth:signal` — WebRTC signaling relay scaffold.

## Prototype security scope
The current server validates important write payloads and checks the demo password, but it does **not** yet enforce production authentication/RBAC on every route or provide end-to-end encrypted messaging. TLS, secure credential storage, authorization, data-at-rest encryption, retention rules, and regulatory controls are deployment requirements rather than implemented prototype guarantees.
