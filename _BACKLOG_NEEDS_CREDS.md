# Backlog — credentials required

503-stubbed in `backend/src/routes/integrations.js`:

| Endpoint | Required env var(s) |
|----------|---------------------|
| `POST /api/integrations/wait-times/sync` | `QUEUE_TIMES_API_URL`, `QUEUE_TIMES_API_KEY` |
| `POST /api/integrations/tickets/mobile/issue` | `TICKETING_PROVIDER`, `TICKETING_PROVIDER_API_KEY` |
| `POST /api/integrations/payments/charge` | `STRIPE_SECRET_KEY` |
| `POST /api/integrations/push/notify` | `FCM_SERVER_KEY` (Android) or `APNS_KEY_ID` + `APNS_TEAM_ID` (iOS) |

`GET /api/integrations/status` returns config booleans for the dashboard.
