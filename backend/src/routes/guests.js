const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/guests/preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM guest_preferences WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guests/preferences (upsert)
router.post('/preferences', authenticateToken, async (req, res) => {
  try {
    const { favorite_ride_types, dietary_restrictions, group_size, mobility_needs } = req.body;
    const result = await pool.query(
      `INSERT INTO guest_preferences (user_id, favorite_ride_types, dietary_restrictions, group_size, mobility_needs, last_updated)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         favorite_ride_types = EXCLUDED.favorite_ride_types,
         dietary_restrictions = EXCLUDED.dietary_restrictions,
         group_size = EXCLUDED.group_size,
         mobility_needs = EXCLUDED.mobility_needs,
         last_updated = NOW()
       RETURNING *`,
      [
        req.user.id,
        favorite_ride_types || [],
        dietary_restrictions || [],
        group_size || null,
        mobility_needs || null
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
