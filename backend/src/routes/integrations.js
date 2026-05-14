/*
 * routes/integrations.js — Apply pass 5 (NEEDS-CREDS stubs)
 *
 * Real-time wait-time feeds, mobile-ticketing, payment processing, and push
 * notifications. Each endpoint returns 503 with explicit env-var hints when
 * credentials are missing (matches quickbooks/routes/ai.js pattern).
 */
const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function noKey(res, provider, vars) {
  return res.status(503).json({
    error: `${provider} integration unavailable: credentials not configured`,
    required_env: vars,
    provider_status: 'not_configured',
  });
}

router.post('/wait-times/sync', authenticateToken, (_req, res) => {
  if (!process.env.QUEUE_TIMES_API_URL) {
    return noKey(res, 'Queue times feed', ['QUEUE_TIMES_API_URL', 'QUEUE_TIMES_API_KEY']);
  }
  // TODO: GET ${QUEUE_TIMES_API_URL}/parks/<park_id>/queue_times.json
  res.status(501).json({ error: 'Real-time wait-time sync scaffolded but not implemented' });
});

router.post('/tickets/mobile/issue', authenticateToken, (_req, res) => {
  if (!process.env.TICKETING_PROVIDER_API_KEY) {
    return noKey(res, 'Mobile ticketing', ['TICKETING_PROVIDER', 'TICKETING_PROVIDER_API_KEY']);
  }
  // TODO: provider issue-call (e.g., Galaxy / Accesso)
  res.status(501).json({ error: 'Mobile ticketing scaffolded but not implemented' });
});

router.post('/payments/charge', authenticateToken, (_req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return noKey(res, 'Payments', ['STRIPE_SECRET_KEY']);
  }
  // TODO: stripe.paymentIntents.create({...})
  res.status(501).json({ error: 'Payments scaffolded but not implemented' });
});

router.post('/push/notify', authenticateToken, (_req, res) => {
  if (!process.env.FCM_SERVER_KEY && !process.env.APNS_KEY_ID) {
    return noKey(res, 'Push notifications', ['FCM_SERVER_KEY', 'APNS_KEY_ID', 'APNS_TEAM_ID']);
  }
  // TODO: FCM / APNs send
  res.status(501).json({ error: 'Push notifications scaffolded but not implemented' });
});

router.get('/status', authenticateToken, (_req, res) => {
  res.json({
    queue_times_feed: !!process.env.QUEUE_TIMES_API_URL,
    mobile_ticketing: !!process.env.TICKETING_PROVIDER_API_KEY,
    payments: !!process.env.STRIPE_SECRET_KEY,
    push_notifications: !!(process.env.FCM_SERVER_KEY || process.env.APNS_KEY_ID),
  });
});

module.exports = router;
