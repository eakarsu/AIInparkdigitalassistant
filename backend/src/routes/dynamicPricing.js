/*
 * routes/dynamicPricing.js — Apply pass 5
 *
 * Mechanical dynamic-pricing recommendations for premium experiences (dining,
 * shows, attractions). Pure heuristic — no AI, no external feeds. Designed to
 * surface optimal-time hints derived from configured "demand profiles" plus
 * day-of-week / time-of-day modifiers.
 */
const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS premium_pricing_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        category TEXT,
        item_id INTEGER,
        base_price NUMERIC,
        recommended_price NUMERIC,
        modifier NUMERIC,
        rationale TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`);
  } catch (e) {
    console.error('premium_pricing_log bootstrap error:', e.message);
  }
})();

// Demand modifiers — keep deterministic & explicit. Values are multipliers.
const DOW_MULT = [1.0, 0.9, 0.9, 0.95, 1.05, 1.25, 1.2]; // Sun..Sat (JS getDay)
function timeOfDayMult(hour) {
  if (hour >= 11 && hour < 14) return 1.15;        // lunch peak
  if (hour >= 18 && hour < 21) return 1.2;          // dinner peak
  if (hour >= 14 && hour < 17) return 0.85;         // off-peak afternoon
  if (hour < 9 || hour >= 21) return 0.8;           // edge hours
  return 1.0;
}
function crowdMult(level) {
  switch ((level || '').toLowerCase()) {
    case 'low': return 0.85;
    case 'medium': return 1.0;
    case 'high': return 1.2;
    case 'extreme': return 1.35;
    default: return 1.0;
  }
}

// POST /api/dynamic-pricing/recommend
router.post('/recommend', authenticateToken, async (req, res) => {
  try {
    const { category, item_id, base_price, hour, day_of_week, crowd_level } = req.body || {};
    const bp = Number(base_price);
    if (!bp || bp <= 0) return res.status(400).json({ error: 'base_price (positive number) required' });

    const now = new Date();
    const h = Number.isFinite(Number(hour)) ? Number(hour) : now.getHours();
    const dow = Number.isFinite(Number(day_of_week)) ? Number(day_of_week) : now.getDay();
    const dowM = DOW_MULT[((dow % 7) + 7) % 7];
    const todM = timeOfDayMult(h);
    const crM = crowdMult(crowd_level);
    const modifier = +(dowM * todM * crM).toFixed(3);
    const rec = +(bp * modifier).toFixed(2);

    const rationale = `dow_mult=${dowM}, time_of_day_mult=${todM} (h=${h}), crowd_mult=${crM} (level=${crowd_level || 'unknown'})`;

    pool.query(
      `INSERT INTO premium_pricing_log (user_id, category, item_id, base_price, recommended_price, modifier, rationale)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user?.id || null, category || null, item_id ? Number(item_id) : null, bp, rec, modifier, rationale]
    ).catch(() => {});

    res.json({
      base_price: bp,
      recommended_price: rec,
      modifier,
      rationale,
      explainability: { dow_multiplier: dowM, time_of_day_multiplier: todM, crowd_multiplier: crM },
      disclaimer: 'Heuristic only. Not a real-time pricing engine.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/dynamic-pricing/log/recent
router.get('/log/recent', authenticateToken, async (_req, res) => {
  try {
    const r = await pool.query(`SELECT * FROM premium_pricing_log ORDER BY created_at DESC LIMIT 50`);
    res.json({ entries: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
