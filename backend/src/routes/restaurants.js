const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, cuisine_type, price_range, hours, seating_capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO restaurants (name, description, zone, cuisine_type, price_range, hours, seating_capacity) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, zone, cuisine_type, price_range || '$$', hours || '10:00 AM - 10:00 PM', seating_capacity || 100]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, cuisine_type, price_range, hours, seating_capacity } = req.body;
    const result = await pool.query(
      'UPDATE restaurants SET name=$1, description=$2, zone=$3, cuisine_type=$4, price_range=$5, hours=$6, seating_capacity=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, description, zone, cuisine_type, price_range, hours, seating_capacity, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM restaurants WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Restaurant not found' });
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
