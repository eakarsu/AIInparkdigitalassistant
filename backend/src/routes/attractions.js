const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attractions ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM attractions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attraction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, type, age_group, duration, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO attractions (name, description, zone, type, age_group, duration, capacity) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, zone, type || 'interactive', age_group || 'all ages', duration || '15 min', capacity || 50]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, type, age_group, duration, capacity } = req.body;
    const result = await pool.query(
      'UPDATE attractions SET name=$1, description=$2, zone=$3, type=$4, age_group=$5, duration=$6, capacity=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, description, zone, type, age_group, duration, capacity, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attraction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM attractions WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attraction not found' });
    res.json({ message: 'Attraction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
