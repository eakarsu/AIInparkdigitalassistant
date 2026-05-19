const express = require('express');
const cors = require('cors');
const path = require('path');
// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_wait_time_prediction_ai = require('../routes/gap-no-wait-time-prediction-ai');
const route_gap_no_crowd_flow_recommendation = require('../routes/gap-no-crowd-flow-recommendation');
const route_gap_no_dining_queue_prediction = require('../routes/gap-no-dining-queue-prediction');
const route_gap_no_accessibility_recommender = require('../routes/gap-no-accessibility-recommender');
const route_gap_live_wait_time_data_ingestion_still = require('../routes/gap-live-wait-time-data-ingestion-still');
const route_gap_no_mobile_push_notifications = require('../routes/gap-no-mobile-push-notifications');
const route_gap_no_webhook_surface_for_ticket_scan = require('../routes/gap-no-webhook-surface-for-ticket-scan');
const route_gap_no_audit_log_0_references = require('../routes/gap-no-audit-log-0-references');
const route_gap_no_file_upload_for_guest_photo = require('../routes/gap-no-file-upload-for-guest-photo');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Startup validation
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not set');
  process.exit(1);
}

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Helmet-equivalent security headers (inline to avoid new dependency)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS with explicit origin
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/shows', require('./routes/shows'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/attractions', require('./routes/attractions'));
app.use('/api/events', require('./routes/events'));
app.use('/api/gift-shops', require('./routes/giftshops'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/park-zones', require('./routes/parkzones'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/guests', require('./routes/guests'));
// Apply pass 5 — additive
app.use('/api/group-planning', require('./routes/groupPlanning'));
app.use('/api/dynamic-pricing', require('./routes/dynamicPricing'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/crowd-intelligence', require('./routes/crowdIntelligence'));
app.use('/api/accessibility-advisor', require('./routes/accessibilityAdvisor'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Adventure Kingdom API is running' });
});


app.use('/api/gap-no-wait-time-prediction-ai', route_gap_no_wait_time_prediction_ai);
app.use('/api/gap-no-crowd-flow-recommendation', route_gap_no_crowd_flow_recommendation);
app.use('/api/gap-no-dining-queue-prediction', route_gap_no_dining_queue_prediction);
app.use('/api/gap-no-accessibility-recommender', route_gap_no_accessibility_recommender);
app.use('/api/gap-live-wait-time-data-ingestion-still', route_gap_live_wait_time_data_ingestion_still);
app.use('/api/gap-no-mobile-push-notifications', route_gap_no_mobile_push_notifications);
app.use('/api/gap-no-webhook-surface-for-ticket-scan', route_gap_no_webhook_surface_for_ticket_scan);
app.use('/api/gap-no-audit-log-0-references', route_gap_no_audit_log_0_references);
app.use('/api/gap-no-file-upload-for-guest-photo', route_gap_no_file_upload_for_guest_photo);

// === Park Views — Custom Views (2 VIZ + 2 NON-VIZ) ===
// MUST be mounted BEFORE the 404 catch-all.
app.use('/api/custom-views', require('./routes/customViews'));

// 404 catch-all for unknown /api routes — keep this LAST.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`Adventure Kingdom Backend running on port ${PORT}`);
});
