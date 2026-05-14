const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM shows ORDER BY name LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM shows')
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: dataResult.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shows WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Show not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, show_times, duration, venue, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO shows (name, description, zone, show_times, duration, venue, capacity) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description, zone, show_times, duration || '30 min', venue, capacity || 200]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, show_times, duration, venue, capacity } = req.body;
    const result = await pool.query(
      'UPDATE shows SET name=$1, description=$2, zone=$3, show_times=$4, duration=$5, venue=$6, capacity=$7, updated_at=NOW() WHERE id=$8 RETURNING *',
      [name, description, zone, show_times, duration, venue, capacity, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Show not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM shows WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Show not found' });
    res.json({ message: 'Show deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
