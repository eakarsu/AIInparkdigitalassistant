const express = require('express');
const https = require('https');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

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

function callOpenRouter(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
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
          resolve(JSON.parse(body));
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

// General park assistant chat
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const parkContext = await getParkContext();

    const messages = [
      {
        role: 'system',
        content: `You are a friendly and knowledgeable theme park digital assistant for "Adventure Kingdom".
Help guests navigate the park, find showtimes, check ride wait times, recommend restaurants, and make their visit magical.
Be enthusiastic, helpful, and concise. Use emojis sparingly for a fun feel.
When recommending rides or shows, consider wait times and the guest's preferences.
${parkContext}`
      },
      ...(history || []).slice(-6),
      { role: 'user', content: message }
    ];

    const response = await callOpenRouter(messages);

    if (response.error) {
      return res.status(500).json({ error: response.error.message || 'AI service error' });
    }

    res.json({
      message: response.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.',
      model: response.model,
      usage: response.usage,
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// AI ride recommendations
router.post('/recommend-rides', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    const parkContext = await getParkContext();

    const messages = [
      {
        role: 'system',
        content: `You are a theme park ride recommendation expert. Based on the guest's preferences and current park data, recommend the best rides.
Format your response as a structured recommendation with ride names, reasons, and tips.
${parkContext}`
      },
      { role: 'user', content: `My preferences: ${preferences || 'I want the best experience with shortest waits'}` }
    ];

    const response = await callOpenRouter(messages);
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
router.post('/plan-itinerary', authenticateToken, async (req, res) => {
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
router.post('/recommend-dining', authenticateToken, async (req, res) => {
  try {
    const { cuisine_preference, budget, dietary } = req.body;
    const parkContext = await getParkContext();

    const messages = [
      {
        role: 'system',
        content: `You are a theme park dining expert. Recommend the best restaurants based on guest preferences.
Consider cuisine type, budget, location, and current availability.
${parkContext}`
      },
      {
        role: 'user',
        content: `Looking for dining: Cuisine: ${cuisine_preference || 'any'}, Budget: ${budget || 'moderate'}, Dietary needs: ${dietary || 'none'}`
      }
    ];

    const response = await callOpenRouter(messages);
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

module.exports = router;
