# Audit Apply Notes — AIInparkdigitalassistant

## Source
`/Users/erolakarsu/projects/_AUDIT/reports/batch_04.md` section 32.

## Original Recommendations (AI Counterparts)
- `/wait-time-prediction`
- `/crowd-flow-recommendation`
- `/dining-queue-prediction`
- `/accessibility-recommendations`

## Implemented (this pass)
Three endpoints appended to `backend/src/routes/ai.js`, using the existing `callOpenRouter`, `getParkContext`, `authenticateToken`, and `aiRateLimiter`:

- `POST /api/ai/wait-time-prediction` — returns next-30m / 60m / 120m wait predictions with trend and confidence per ride; pulls all open rides if no `ride_ids` supplied.
- `POST /api/ai/crowd-flow-recommendation` — returns step-by-step routing JSON with expected waits and walking estimate, given current zone, end time, group type.
- `POST /api/ai/accessibility-recommendations` — recommends rides/shows/dining matching mobility, sensory, age, intensity, dietary inputs.

Syntax: `node --check` passes.

## Backlog
- `/dining-queue-prediction` — analogous to wait-time-prediction but for restaurants; deferred to keep ≤3 implementations.
- Custom: agentic personal concierge, real-time crowd intelligence (NEEDS-CREDS for park feeds), dynamic experience pricing, social group optimization, upsell/merch recommendation.
- Non-AI: real-time wait time integration, mobile ticketing, payment processing, push notifications, group planning.

## Categorization
- MECHANICAL: 3 endpoints (done).
- MECHANICAL but deferred: dining-queue-prediction.
- NEEDS-CREDS: real-time park telemetry feeds, payments, push notifications.
- NEEDS-PRODUCT-DECISION: dynamic pricing rules, group coordination model.

## Apply pass 3 (frontend)

LEFT-AS-IS. The React frontend already calls every AI endpoint:
- `services/api.js` exposes `aiAPI.{chat, recommendRides, planItinerary, recommendDining, buildPlan}`.
- `pages/AdvancedAITools.js` covers the apply2 additions (`wait-time-prediction`, `crowd-flow-recommendation`, `accessibility-recommendations`).
- `pages/AIAssistant.js` consumes chat/itinerary.
- JWT Bearer is attached globally by the axios interceptor in `services/api.js`, with 401 → login redirect.

Idempotent; no FE changes required. See `_AUDIT/apply3_logs/ab3_75.md`.

## Apply pass 4 (mechanical backlog)

Added 2 new mechanical AI features (under the 5/project cap) — pulling forward two of the previously deferred "custom" backlog items that were mechanical (text-only LLM helpers) rather than NEEDS-CREDS:

- `POST /api/ai/concierge-plan` — agentic personal-concierge end-to-end park-day plan (visit window, group profile, must-do/avoid → time/zone/activity sequence with reasoning).
- `POST /api/ai/upsell-recommendation` — tasteful merch / dining / photo / show upgrades, scoped to the guest's actual visit + remaining budget; pulls `giftshops` for context.

Both endpoints reuse `callOpenRouter`, `requireApiKey` (503 noKey), `authenticateToken`, and `aiRateLimiter`. Frontend: 2 new tabs in `pages/AdvancedAITools.js` with their own form state, JWT Bearer via the global axios interceptor, and the existing 503/error handling. No new deps, no `npm install`. `node --check` passes for both files. NEEDS-CREDS items (real-time park telemetry, payments, push notifications) and NEEDS-PRODUCT-DECISION items (dynamic pricing, group coordination model) remain deferred.
