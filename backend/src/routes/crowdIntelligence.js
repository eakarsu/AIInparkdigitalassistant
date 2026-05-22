// Real-time crowd intelligence ingesting wait times and density maps for
// in-the-moment adjustments.
// Audit: batch_04.md / AIInparkdigitalassistant / Custom Feature Suggestions #2
const express = require('express');
const fetch = require('node-fetch');
const { authenticateToken: auth } = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();
router.use(auth);

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'In-Park Assistant - Crowd Intelligence'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, max_tokens: 2500
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(t) { try { const m = t.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {} return { notes: t }; }

pool.query(`CREATE TABLE IF NOT EXISTS wait_time_observations (
  id SERIAL PRIMARY KEY, ride_id INTEGER, wait_minutes INT, recorded_at TIMESTAMPTZ DEFAULT NOW()
)`).catch(() => {});

// POST /api/crowd-intelligence/ingest { ride_id, wait_minutes }
router.post('/ingest', async (req, res) => {
  try {
    const { ride_id, wait_minutes } = req.body || {};
    if (!ride_id || wait_minutes == null) return res.status(400).json({ error: 'ride_id and wait_minutes required' });
    await pool.query(
      `INSERT INTO wait_time_observations (ride_id, wait_minutes) VALUES ($1,$2)`,
      [ride_id, wait_minutes]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crowd-intelligence/snapshot { zone_id? }
router.post('/snapshot', async (req, res) => {
  try {
    const { zone_id } = req.body || {};

    let waits = { rows: [] }, rides = { rows: [] };
    try {
      waits = await pool.query(
        `SELECT ride_id, AVG(wait_minutes) AS avg_wait, MAX(recorded_at) AS recent
         FROM wait_time_observations
         WHERE recorded_at > NOW() - INTERVAL '60 minutes' GROUP BY ride_id`
      );
    } catch (_) {}
    try {
      rides = await pool.query(
        `SELECT id, name, zone_id, capacity_per_hour FROM rides ${zone_id ? 'WHERE zone_id = $1' : ''} LIMIT 50`,
        zone_id ? [zone_id] : []
      );
    } catch (_) {}

    const systemPrompt = `You are a theme-park crowd intelligence agent. Synthesize current wait times,
ride capacity, and recent flow into a density map and recommend in-the-moment guest nudges. Return STRICT JSON only.`;

    const userPrompt = `Zone filter: ${zone_id || 'all'}
Current wait times (avg over 60min): ${JSON.stringify(waits.rows)}
Rides: ${JSON.stringify(rides.rows.slice(0, 30))}

Return JSON:
{
  "summary": "...",
  "zone_density": [{ "zone_id": 0, "density_score_0_100": 0, "trend": "rising|stable|falling" }],
  "hot_attractions": [{ "ride_id": 0, "wait_minutes": 0, "recommendation_for_guests": "string" }],
  "underutilized_attractions": [{ "ride_id": 0, "wait_minutes": 0 }],
  "guest_nudges": ["..."],
  "next_check_minutes": 0,
  "disclaimer": "Estimates based on supplied observations."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ zone_id: zone_id || null, snapshot: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/current-waits', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT ride_id, AVG(wait_minutes) AS avg_wait, COUNT(*) AS samples
       FROM wait_time_observations WHERE recorded_at > NOW() - INTERVAL '30 minutes' GROUP BY ride_id`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
