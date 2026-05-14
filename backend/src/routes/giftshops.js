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
      pool.query('SELECT * FROM gift_shops ORDER BY name LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM gift_shops')
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
    const result = await pool.query('SELECT * FROM gift_shops WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gift shop not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, specialty, hours, price_range } = req.body;
    const result = await pool.query(
      'INSERT INTO gift_shops (name, description, zone, specialty, hours, price_range) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description, zone, specialty, hours || '9:00 AM - 9:00 PM', price_range || '$$']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, zone, specialty, hours, price_range } = req.body;
    const result = await pool.query(
      'UPDATE gift_shops SET name=$1, description=$2, zone=$3, specialty=$4, hours=$5, price_range=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, description, zone, specialty, hours, price_range, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gift shop not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM gift_shops WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gift shop not found' });
    res.json({ message: 'Gift shop deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
