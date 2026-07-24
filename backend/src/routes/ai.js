const express = require('express');
const https = require('https');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const OPENROUTER_BASE_URL = new URL(process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1');

// ====== RATE LIMITER ======
const aiRateLimitStore = new Map();
function aiRateLimiter(req, res, next) {
  const key = req.user?.id || req.ip;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const max = 20;

  if (!aiRateLimitStore.has(key)) {
    aiRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  const entry = aiRateLimitStore.get(key);
  if (now > entry.resetAt) {
    aiRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (entry.count >= max) {
    return res.status(429).json({
      error: 'AI rate limit exceeded. You may make 20 AI requests per hour.',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000)
    });
  }
  entry.count++;
  next();
}

// Ensure tables exist
async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        session_id TEXT UNIQUE,
        messages JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guest_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        favorite_ride_types TEXT[],
        dietary_restrictions TEXT[],
        group_size INTEGER,
        mobility_needs TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guest_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        session_id TEXT,
        duration_hours INTEGER,
        group_type TEXT,
        interests TEXT,
        plan JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recommendation_analytics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        recommended_item_type TEXT,
        recommended_item_id INTEGER,
        recommendation_source TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('Table init error:', err.message);
  }
}
ensureTables();

async function getParkContext() {
  try {
    const [rides, shows, restaurants, events] = await Promise.all([
      pool.query("SELECT name, zone, wait_time, status, thrill_level FROM rides WHERE status = 'open' ORDER BY wait_time LIMIT 10"),
      pool.query("SELECT name, zone, show_times, venue, duration FROM shows ORDER BY name LIMIT 10"),
      pool.query("SELECT name, zone, cuisine_type, price_range, hours FROM restaurants ORDER BY name LIMIT 10"),
      pool.query("SELECT name, zone, event_date, start_time, end_time, event_type FROM events ORDER BY event_date LIMIT 10"),
    ]);
    return `
CURRENT PARK DATA:
--- Open Rides (sorted by wait time) ---
${rides.rows.map(r => `${r.name} | Zone: ${r.zone} | Wait: ${r.wait_time} min | Thrill: ${r.thrill_level}`).join('\n')}

--- Shows Today ---
${shows.rows.map(s => `${s.name} | Zone: ${s.zone} | Times: ${s.show_times} | Venue: ${s.venue} | Duration: ${s.duration}`).join('\n')}

--- Dining Options ---
${restaurants.rows.map(r => `${r.name} | Zone: ${r.zone} | Cuisine: ${r.cuisine_type} | Price: ${r.price_range} | Hours: ${r.hours}`).join('\n')}

--- Upcoming Events ---
${events.rows.map(e => `${e.name} | Zone: ${e.zone} | Date: ${e.event_date} | Time: ${e.start_time}-${e.end_time} | Type: ${e.event_type}`).join('\n')}
`;
  } catch (err) {
    return 'Park data currently unavailable.';
  }
}

async function getUserPreferences(userId) {
  try {
    const res = await pool.query('SELECT * FROM guest_preferences WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  } catch {
    return null;
  }
}

function callOpenRouter(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: messages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const options = {
      hostname: OPENROUTER_BASE_URL.hostname,
      port: OPENROUTER_BASE_URL.port || undefined,
      path: `${OPENROUTER_BASE_URL.pathname.replace(/\/$/, '')}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Park Digital Assistant',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode < 200 || res.statusCode >= 300) throw new Error(parsed.error?.message || `OpenRouter request failed with HTTP ${res.statusCode}`);
          const content = parsed.choices?.[0]?.message?.content;
          if (!content || !String(content).trim()) throw new Error('OpenRouter returned empty content');
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse OpenRouter response'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// Apply pass 4: 503 guard for endpoints added in this pass.
function requireApiKey(res) {
  if (!OPENROUTER_API_KEY) {
    res.status(503).json({
      error: 'OpenRouter API key not configured. Set OPENROUTER_API_KEY in .env to enable AI endpoints.',
      noKey: true,
    });
    return false;
  }
  return true;
}

// General park assistant chat (with persistent session)
router.post('/chat', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { message, history, session_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const parkContext = await getParkContext();
    const userId = req.user?.id;

    let sessionId = session_id;
    let storedMessages = [];

    // Load or create session
    if (sessionId) {
      try {
        const sessRes = await pool.query('SELECT * FROM chat_sessions WHERE session_id = $1', [sessionId]);
        if (sessRes.rows.length > 0) {
          storedMessages = sessRes.rows[0].messages || [];
        }
      } catch { /* ignore */ }
    } else {
      sessionId = generateSessionId();
    }

    // Build message history: stored + any additional client-provided history, deduped
    const historyToUse = storedMessages.length > 0
      ? storedMessages.slice(-10)
      : (history || []).slice(-6);

    const messages = [
      {
        role: 'system',
        content: `You are a friendly and knowledgeable theme park digital assistant for "Adventure Kingdom".
Help guests navigate the park, find showtimes, check ride wait times, recommend restaurants, and make their visit magical.
Be enthusiastic, helpful, and concise. Use emojis sparingly for a fun feel.
When recommending rides or shows, consider wait times and the guest's preferences.
${parkContext}`
      },
      ...historyToUse,
      { role: 'user', content: message }
    ];

    const response = await callOpenRouter(messages);

    if (response.error) {
      return res.status(500).json({ error: response.error.message || 'AI service error' });
    }

    const assistantMsg = response.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Persist updated conversation
    const newMessages = [
      ...historyToUse,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMsg }
    ];

    try {
      await pool.query(
        `INSERT INTO chat_sessions (user_id, session_id, messages, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (session_id) DO UPDATE SET messages = $3, updated_at = NOW()`,
        [userId, sessionId, JSON.stringify(newMessages)]
      );
    } catch { /* ignore session persistence errors */ }

    // Log analytics
    try {
      await pool.query(
        'INSERT INTO recommendation_analytics (user_id, recommended_item_type, recommendation_source) VALUES ($1, $2, $3)',
        [userId, 'chat', 'ai_chat']
      );
    } catch { /* ignore */ }

    res.json({
      message: assistantMsg,
      model: response.model,
      usage: response.usage,
      session_id: sessionId,
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Fetch chat session history
router.get('/session/:session_id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT messages FROM chat_sessions WHERE session_id = $1 AND user_id = $2',
      [req.params.session_id, req.user?.id]
    );
    if (result.rows.length === 0) return res.json({ messages: [] });
    res.json({ messages: result.rows[0].messages || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI ride recommendations
router.post('/recommend-rides', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { preferences } = req.body;
    const parkContext = await getParkContext();
    const prefs = await getUserPreferences(req.user?.id);

    const prefContext = prefs ? `Guest preferences: favorite ride types: ${(prefs.favorite_ride_types || []).join(', ')}, group size: ${prefs.group_size || 'unknown'}, mobility needs: ${prefs.mobility_needs || 'none'}` : '';

    const messages = [
      {
        role: 'system',
        content: `You are a theme park ride recommendation expert. Based on the guest's preferences and current park data, recommend the best rides.
Format your response as a structured recommendation with ride names, reasons, and tips.
${prefContext}
${parkContext}`
      },
      { role: 'user', content: `My preferences: ${preferences || 'I want the best experience with shortest waits'}` }
    ];

    const response = await callOpenRouter(messages);

    // Log analytics
    try {
      await pool.query(
        'INSERT INTO recommendation_analytics (user_id, recommended_item_type, recommendation_source) VALUES ($1, $2, $3)',
        [req.user?.id, 'ride', 'ai_recommend_rides']
      );
    } catch { /* ignore */ }

    res.json({
      recommendations: response.choices?.[0]?.message?.content || 'Unable to generate recommendations.',
      model: response.model,
      usage: response.usage,
    });
  } catch (err) {
    console.error('AI recommend error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// AI itinerary planner
router.post('/plan-itinerary', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { duration, interests, group_type } = req.body;
    const parkContext = await getParkContext();

    const messages = [
      {
        role: 'system',
        content: `You are a theme park itinerary planning expert. Create an optimized day plan for the guest.
Consider ride wait times, show schedules, meal times, and walking distances between zones.
Format as a time-based schedule.
${parkContext}`
      },
      {
        role: 'user',
        content: `Plan my day: Duration: ${duration || 'full day'}, Interests: ${interests || 'everything'}, Group: ${group_type || 'family'}`
      }
    ];

    const response = await callOpenRouter(messages);

    // Log analytics
    try {
      await pool.query(
        'INSERT INTO recommendation_analytics (user_id, recommended_item_type, recommendation_source) VALUES ($1, $2, $3)',
        [req.user?.id, 'itinerary', 'ai_plan_itinerary']
      );
    } catch { /* ignore */ }

    res.json({
      itinerary: response.choices?.[0]?.message?.content || 'Unable to generate itinerary.',
      model: response.model,
      usage: response.usage,
    });
  } catch (err) {
    console.error('AI itinerary error:', err);
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

// AI dining recommendations
router.post('/recommend-dining', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { cuisine_preference, budget, dietary } = req.body;
    const parkContext = await getParkContext();
    const prefs = await getUserPreferences(req.user?.id);

    const prefContext = prefs && prefs.dietary_restrictions?.length
      ? `Guest dietary restrictions: ${prefs.dietary_restrictions.join(', ')}`
      : '';

    const messages = [
      {
        role: 'system',
        content: `You are a theme park dining expert. Recommend the best restaurants based on guest preferences.
Consider cuisine type, budget, location, and current availability.
${prefContext}
${parkContext}`
      },
      {
        role: 'user',
        content: `Looking for dining: Cuisine: ${cuisine_preference || 'any'}, Budget: ${budget || 'moderate'}, Dietary needs: ${dietary || 'none'}`
      }
    ];

    const response = await callOpenRouter(messages);

    // Log analytics
    try {
      await pool.query(
        'INSERT INTO recommendation_analytics (user_id, recommended_item_type, recommendation_source) VALUES ($1, $2, $3)',
        [req.user?.id, 'dining', 'ai_recommend_dining']
      );
    } catch { /* ignore */ }

    res.json({
      dining: response.choices?.[0]?.message?.content || 'Unable to generate dining recommendations.',
      model: response.model,
      usage: response.usage,
    });
  } catch (err) {
    console.error('AI dining error:', err);
    res.status(500).json({ error: 'Failed to get dining recommendations' });
  }
});

// Tool-calling structured itinerary builder
router.post('/build-plan', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { session_id, duration_hours, group_type, interests } = req.body;
    const parkContext = await getParkContext();
    const prefs = await getUserPreferences(req.user?.id);

    const prefContext = prefs ? `
Guest saved preferences:
- Favorite ride types: ${(prefs.favorite_ride_types || []).join(', ') || 'none specified'}
- Dietary restrictions: ${(prefs.dietary_restrictions || []).join(', ') || 'none'}
- Group size: ${prefs.group_size || 'unknown'}
- Mobility needs: ${prefs.mobility_needs || 'none'}` : '';

    const messages = [
      {
        role: 'system',
        content: `You are an expert theme park itinerary planner. Create a detailed, structured park plan.
Return ONLY valid JSON matching this schema exactly:
{
  "morning_activities": [{"type": string, "name": string, "time": string, "notes": string}],
  "afternoon_activities": [{"type": string, "name": string, "time": string, "notes": string}],
  "dining": [{"name": string, "time": string, "cuisine": string}],
  "estimated_wait_total_minutes": number,
  "tips": [string]
}
${prefContext}
${parkContext}`
      },
      {
        role: 'user',
        content: `Build my park plan: duration ${duration_hours || 8} hours, group: ${group_type || 'family'}, interests: ${interests || 'everything'}`
      }
    ];

    const response = await callOpenRouter(messages);
    const rawContent = response.choices?.[0]?.message?.content || '';

    let plan = null;
    try {
      const stripped = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      plan = JSON.parse(stripped);
    } catch {
      plan = { raw: rawContent };
    }

    // Save plan to DB
    let savedPlanId = null;
    try {
      const planRes = await pool.query(
        `INSERT INTO guest_plans (user_id, session_id, duration_hours, group_type, interests, plan)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [req.user?.id, session_id || null, duration_hours || 8, group_type || 'family', interests || '', JSON.stringify(plan)]
      );
      savedPlanId = planRes.rows[0].id;
    } catch { /* ignore */ }

    // Log analytics
    try {
      await pool.query(
        'INSERT INTO recommendation_analytics (user_id, recommended_item_type, recommendation_source) VALUES ($1, $2, $3)',
        [req.user?.id, 'full_plan', 'ai_build_plan']
      );
    } catch { /* ignore */ }

    res.json({ plan, plan_id: savedPlanId, model: response.model });
  } catch (err) {
    console.error('AI build-plan error:', err);
    res.status(500).json({ error: 'Failed to build plan' });
  }
});

// Wait-time prediction
router.post('/wait-time-prediction', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { ride_ids, time_of_day, weather, season } = req.body || {};
    let rides = [];
    if (Array.isArray(ride_ids) && ride_ids.length > 0) {
      const r = await pool.query('SELECT * FROM rides WHERE id = ANY($1)', [ride_ids]).catch(() => ({ rows: [] }));
      rides = r.rows;
    } else {
      const r = await pool.query("SELECT * FROM rides WHERE status = 'open' ORDER BY wait_time DESC LIMIT 25").catch(() => ({ rows: [] }));
      rides = r.rows;
    }
    if (rides.length === 0) return res.status(400).json({ error: 'No rides found to predict' });

    const messages = [
      { role: 'system', content: 'You are a theme park operations forecaster. Predict wait times for rides over the next 4 hours given current waits, time of day, weather, and seasonality. Calibrate confidence honestly.' },
      { role: 'user', content: `Predict wait times.

Rides (current wait in minutes):
${rides.map(r => `- id=${r.id} ${r.name} zone=${r.zone} thrill=${r.thrill_level} current_wait=${r.wait_time}m status=${r.status}`).join('\n')}

Time of day: ${time_of_day || 'mid-day'}
Weather: ${weather || 'unspecified'}
Season: ${season || 'unspecified'}

Return JSON only:
{
  "predictions": [
    { "ride_id": number, "ride_name": string, "next_30m": number, "next_60m": number, "next_120m": number, "trend": "rising|stable|falling", "confidence_0_100": number }
  ],
  "park_wide_pressure": "low|moderate|high|extreme",
  "shortest_lines_now": string[],
  "longest_lines_in_2h": string[],
  "summary": string
}` },
    ];

    const response = await callOpenRouter(messages);
    const raw = response?.choices?.[0]?.message?.content || '';
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (_) {
      const m = raw.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
    }
    res.json({ predictions: parsed, raw, model: response?.model });
  } catch (err) {
    console.error('Wait-time prediction error:', err);
    res.status(500).json({ error: 'Failed to predict wait times' });
  }
});

// Crowd-flow recommendation
router.post('/crowd-flow-recommendation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { current_zone, end_time, group_type } = req.body || {};
    const context = await getParkContext();

    const messages = [
      { role: 'system', content: 'You are a theme park crowd-flow advisor. Recommend a routing through the park that minimizes total wait and walking, while hitting requested experiences. Use current park data, then compose a step-by-step route.' },
      { role: 'user', content: `Recommend optimal park routing.

Current zone: ${current_zone || 'park entrance'}
End time: ${end_time || 'park close'}
Group type: ${group_type || 'family'}

${context}

Return JSON only:
{
  "route": [{ "step": number, "zone": string, "experience": string, "type": "ride|show|dining|rest", "expected_wait_min": number, "rationale": string }],
  "total_walking_minutes_estimate": number,
  "total_wait_minutes_estimate": number,
  "alternative_routes": string[],
  "tips": string[],
  "summary": string
}` },
    ];

    const response = await callOpenRouter(messages);
    const raw = response?.choices?.[0]?.message?.content || '';
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (_) {
      const m = raw.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
    }
    res.json({ recommendation: parsed, raw, model: response?.model });
  } catch (err) {
    console.error('Crowd-flow recommendation error:', err);
    res.status(500).json({ error: 'Failed to recommend route' });
  }
});

// Accessibility recommendations
router.post('/accessibility-recommendations', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { mobility, sensory, age_groups, ride_intensity_max, dietary_needs } = req.body || {};
    const context = await getParkContext();

    const messages = [
      { role: 'system', content: 'You are a theme park accessibility and inclusion advisor. Recommend rides, shows, and dining suited to the requested needs. Always note known limitations and suggest alternatives.' },
      { role: 'user', content: `Recommend accessible experiences.

Mobility needs: ${mobility || 'none specified'}
Sensory considerations: ${sensory || 'none specified'}
Age groups: ${age_groups || 'mixed'}
Maximum ride intensity (1-5): ${ride_intensity_max || 'unspecified'}
Dietary needs: ${dietary_needs || 'none specified'}

${context}

Return JSON only:
{
  "rides": [{ "name": string, "zone": string, "fit": "great|good|caution", "notes": string }],
  "shows": [{ "name": string, "zone": string, "fit": "great|good|caution", "notes": string }],
  "dining": [{ "name": string, "zone": string, "fit": "great|good|caution", "notes": string }],
  "rest_zones": string[],
  "warnings": string[],
  "summary": string
}` },
    ];

    const response = await callOpenRouter(messages);
    const raw = response?.choices?.[0]?.message?.content || '';
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (_) {
      const m = raw.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
    }
    res.json({ recommendations: parsed, raw, model: response?.model });
  } catch (err) {
    console.error('Accessibility recommendation error:', err);
    res.status(500).json({ error: 'Failed to provide accessibility recommendations' });
  }
});

// Apply pass 4 backlog: dining-queue-prediction
// Mirrors wait-time-prediction but for restaurants. Returns next-30/60/120m
// queue minute estimates per restaurant, confidence, and a park-wide signal.
router.post('/dining-queue-prediction', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!requireApiKey(res)) return;

    const { restaurant_ids, time_of_day, weather, season, group_size } = req.body || {};
    let restaurants = [];
    if (Array.isArray(restaurant_ids) && restaurant_ids.length > 0) {
      const r = await pool
        .query('SELECT * FROM restaurants WHERE id = ANY($1)', [restaurant_ids])
        .catch(() => ({ rows: [] }));
      restaurants = r.rows;
    } else {
      const r = await pool
        .query('SELECT * FROM restaurants ORDER BY name LIMIT 25')
        .catch(() => ({ rows: [] }));
      restaurants = r.rows;
    }
    if (restaurants.length === 0) {
      return res.status(400).json({ error: 'No restaurants found to predict' });
    }

    const messages = [
      { role: 'system', content: 'You are a theme park dining operations forecaster. Predict queue / wait times at park restaurants over the next 4 hours given cuisine, price tier, hours, current time of day, weather, and seasonality. Calibrate confidence honestly and call out any restaurants likely to be at capacity.' },
      { role: 'user', content: `Predict dining queue times.

Restaurants:
${restaurants.map(r => `- id=${r.id} ${r.name} zone=${r.zone} cuisine=${r.cuisine_type} price=${r.price_range} hours=${r.hours}`).join('\n')}

Time of day: ${time_of_day || 'mid-day'}
Weather: ${weather || 'unspecified'}
Season: ${season || 'unspecified'}
Group size: ${group_size || 'unspecified'}

Return JSON only:
{
  "predictions": [
    { "restaurant_id": number, "restaurant_name": string, "next_30m_min": number, "next_60m_min": number, "next_120m_min": number, "trend": "rising|stable|falling", "at_capacity_risk": "low|moderate|high", "confidence_0_100": number }
  ],
  "park_wide_dining_pressure": "low|moderate|high|extreme",
  "shortest_lines_now": string[],
  "best_window_next_2h": string[],
  "alternatives_if_full": string[],
  "summary": string
}` },
    ];

    const response = await callOpenRouter(messages);
    const raw = response?.choices?.[0]?.message?.content || '';
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch (_) {
      const m = raw.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
    }
    res.json({ predictions: parsed, raw, model: response?.model });
  } catch (err) {
    console.error('Dining-queue prediction error:', err);
    res.status(500).json({ error: 'Failed to predict dining queues' });
  }
});

// Apply pass 4 backlog: agentic personal concierge.
// Mechanical: text-only LLM helper that synthesises an end-to-end park-day plan
// using already-stored ride/show/restaurant context + user-provided preferences.
router.post('/concierge-plan', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!requireApiKey(res)) return;

    const {
      visit_date,
      arrival_time,
      departure_time,
      group_size,
      group_composition,
      mobility_needs,
      dietary_restrictions,
      thrill_tolerance,
      budget_per_person,
      must_do,
      avoid,
      notes,
    } = req.body || {};

    const ctx = await getParkContext();

    const messages = [
      {
        role: 'system',
        content:
          'You are a personal theme-park concierge. Given park inventory and a guest profile, produce a single agent-style structured plan that sequences attractions, breaks, meals, and merchandise stops, with reasoning. Keep walking efficient by zone. Honor mobility, dietary, and budget constraints.',
      },
      {
        role: 'user',
        content: `Build a personal concierge plan.

Park inventory:
${ctx}

Guest profile:
- visit_date: ${visit_date || 'today'}
- arrival_time: ${arrival_time || 'park open'}
- departure_time: ${departure_time || 'park close'}
- group_size: ${group_size || 'unspecified'}
- group_composition: ${group_composition || 'unspecified'}
- mobility_needs: ${mobility_needs || 'none'}
- dietary_restrictions: ${dietary_restrictions || 'none'}
- thrill_tolerance: ${thrill_tolerance || 'medium'}
- budget_per_person: ${budget_per_person || 'unspecified'}
- must_do: ${Array.isArray(must_do) ? must_do.join(', ') : (must_do || 'none')}
- avoid: ${Array.isArray(avoid) ? avoid.join(', ') : (avoid || 'none')}
- notes: ${notes || 'none'}

Return JSON only:
{
  "plan": [
    { "time": string, "zone": string, "activity_type": "ride|show|dining|break|shop", "name": string, "reason": string, "estimated_minutes": number }
  ],
  "must_do_coverage": string[],
  "skipped_with_reason": [{ "name": string, "reason": string }],
  "total_walking_minutes_est": number,
  "estimated_cost_per_person": number,
  "summary": string
}`,
      },
    ];

    const response = await callOpenRouter(messages);
    const raw = response?.choices?.[0]?.message?.content || '';
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch (_) {}
      }
    }
    res.json({ concierge_plan: parsed, raw, model: response?.model });
  } catch (err) {
    console.error('Concierge plan error:', err);
    res.status(500).json({ error: 'Failed to build concierge plan' });
  }
});

// Apply pass 4 backlog: upsell / merch recommendation.
// Mechanical: text-only LLM helper that recommends merchandise / dining / show
// upgrades based on the guest's already-booked items and visit context.
router.post('/upsell-recommendation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    if (!requireApiKey(res)) return;

    const {
      visited_attractions,
      booked_items,
      group_size,
      remaining_budget,
      preferences,
      visit_phase,
    } = req.body || {};

    let giftshops = [];
    try {
      const r = await pool.query('SELECT id, name, zone, specialty FROM giftshops ORDER BY name LIMIT 25');
      giftshops = r.rows || [];
    } catch (_) {}

    const messages = [
      {
        role: 'system',
        content:
          'You are a tasteful theme-park upsell assistant. Recommend merchandise, premium dining, photo packages, and show upgrades that match the guest\'s actual experience and budget. Be specific and avoid pushy or off-brand items.',
      },
      {
        role: 'user',
        content: `Suggest upsell items.

Visited attractions today: ${Array.isArray(visited_attractions) ? visited_attractions.join(', ') : (visited_attractions || 'unspecified')}
Already-booked items: ${Array.isArray(booked_items) ? booked_items.join(', ') : (booked_items || 'unspecified')}
Group size: ${group_size || 'unspecified'}
Remaining budget: ${remaining_budget || 'unspecified'}
Stated preferences: ${preferences || 'unspecified'}
Visit phase: ${visit_phase || 'mid-visit'}

Available gift shops:
${giftshops.map((g) => `- id=${g.id} ${g.name} zone=${g.zone} specialty=${g.specialty}`).join('\n') || '- (none on file)'}

Return JSON only:
{
  "recommendations": [
    { "category": "merch|dining|photo|show|experience", "item": string, "where": string, "estimated_cost_per_person": number, "fit_score_0_100": number, "reasoning": string }
  ],
  "bundle_suggestion": string,
  "do_not_recommend": string[],
  "summary": string
}`,
      },
    ];

    const response = await callOpenRouter(messages);
    const raw = response?.choices?.[0]?.message?.content || '';
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch (_) {}
      }
    }
    res.json({ upsell: parsed, raw, model: response?.model });
  } catch (err) {
    console.error('Upsell recommendation error:', err);
    res.status(500).json({ error: 'Failed to build upsell recommendation' });
  }
});

module.exports = router;
