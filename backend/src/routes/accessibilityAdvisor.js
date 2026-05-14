// Accessibility + inclusivity recommender for mobility/sensory considerations.
// Audit: batch_04.md / AIInparkdigitalassistant / Custom Feature Suggestions #4
const express = require('express');
const fetch = require('node-fetch');
const auth = require('../middleware/auth');
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
      'X-Title': 'In-Park - Accessibility Advisor'
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

// POST /api/accessibility-advisor/plan
// Body: { mobility_needs?, sensory_needs?, dietary_needs?, age_groups?, group_size? }
router.post('/plan', async (req, res) => {
  try {
    const {
      mobility_needs, sensory_needs, dietary_needs,
      age_groups = [], group_size = 1
    } = req.body || {};

    let rides = { rows: [] }, restaurants = { rows: [] }, facilities = { rows: [] };
    try { rides = await pool.query(`SELECT id, name, height_min_in, accessibility, intensity FROM rides LIMIT 100`); } catch (_) {}
    try { restaurants = await pool.query(`SELECT id, name, allergen_info, accessibility FROM restaurants LIMIT 50`); } catch (_) {}
    try { facilities = await pool.query(`SELECT id, name, type, accessibility FROM facilities LIMIT 50`); } catch (_) {}

    const systemPrompt = `You are a theme-park accessibility advisor. Build an inclusive day plan honoring
mobility (wheelchair, fatigue), sensory (autism, hearing, vision), and dietary needs. Recommend ride
alternatives, quiet zones, accessible entrances, allergen-aware dining. Return STRICT JSON only.`;

    const userPrompt = `Mobility needs: ${mobility_needs || 'none'}
Sensory needs: ${sensory_needs || 'none'}
Dietary needs: ${dietary_needs || 'none'}
Age groups: ${JSON.stringify(age_groups)}
Group size: ${group_size}
Rides catalog (sample): ${JSON.stringify(rides.rows.slice(0, 30))}
Restaurants (sample): ${JSON.stringify(restaurants.rows.slice(0, 20))}
Facilities (sample): ${JSON.stringify(facilities.rows.slice(0, 20))}

Return JSON:
{
  "summary": "...",
  "recommended_rides": [{ "ride_id": 0, "name": "string", "why_appropriate": "string", "accommodations": ["..."] }],
  "rides_to_avoid": [{ "ride_id": 0, "name": "string", "reason": "string" }],
  "dining_recommendations": [{ "restaurant_id": 0, "name": "string", "safe_menu_items": ["..."] }],
  "quiet_zones": [{ "facility_id": 0, "name": "string", "note": "string" }],
  "logistics_tips": ["..."],
  "guest_services_checklist": ["..."],
  "disclaimer": "Recommendations based on supplied catalog; confirm specifics at guest services."
}`;

    const raw = await callAI(systemPrompt, userPrompt);
    res.json({ plan: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/accessible-rides', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, accessibility FROM rides WHERE accessibility IS NOT NULL LIMIT 50`
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
