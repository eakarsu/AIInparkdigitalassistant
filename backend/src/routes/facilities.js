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
      pool.query('SELECT * FROM facilities ORDER BY name LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM facilities')
    ]);
    const total = parseInt(countResult.rows[0].count);
    res.json({ data: dataResult.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } });
    return;
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM facilities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Facility not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, facility_type, hours, accessibility } = req.body;
    const result = await pool.query(
      'INSERT INTO facilities (name, description, zone, facility_type, hours, accessibility) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description, zone, facility_type || 'general', hours || '8:00 AM - 11:00 PM', accessibility || true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, facility_type, hours, accessibility } = req.body;
    const result = await pool.query(
      'UPDATE facilities SET name=$1, description=$2, zone=$3, facility_type=$4, hours=$5, accessibility=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, description, zone, facility_type, hours, accessibility, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Facility not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM facilities WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Facility not found' });
    res.json({ message: 'Facility deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
