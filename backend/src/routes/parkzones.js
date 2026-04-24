const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM park_zones ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM park_zones WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Park zone not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, theme, hours, highlights } = req.body;
    const result = await pool.query(
      'INSERT INTO park_zones (name, description, theme, hours, highlights) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description, theme, hours || '9:00 AM - 10:00 PM', highlights]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, theme, hours, highlights } = req.body;
    const result = await pool.query(
      'UPDATE park_zones SET name=$1, description=$2, theme=$3, hours=$4, highlights=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, description, theme, hours, highlights, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Park zone not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM park_zones WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Park zone not found' });
    res.json({ message: 'Park zone deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
