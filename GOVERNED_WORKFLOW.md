# Governed park guidance workflow

`/api/governed-guidance` records official status snapshots, rejects unofficial safety messages, checks route resources for stale/closed status, applies accessibility barriers, supports language tags and verified offline snapshots, escalates emergencies to manual help, and retains only a coarse location cell for at most 15 minutes. Safety publishing is restricted to safety officers; incident escalation and all official status sources are audited.

Park maps/operations, queue/status, ticketing/reservations, accessibility, weather, and notification adapters are not bundled. `PARK_PROVIDER_ALLOWLIST` permits status records from separately approved adapters and fails closed when empty. The workflow never represents generated language as an official safety message.

Apply `backend/migrations/` in numeric order, then assign tenant IDs through an authorized identity-admin process. Install dependencies with `npm ci`, create an untracked `.env`, migrate, then run `./start.sh`. Startup never installs, seeds, migrates, creates databases, or kills processes. Demo seed is destructive and explicitly disabled by default.

No live park map, positioning system, queue feed, ticket account, accessibility certification, weather provider, notification provider, translation validation, emergency-dispatch integration, offline field test, or load test is supplied or claimed. Guests must retain access to official signs, staff, and emergency services.
