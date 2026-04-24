const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tickets ORDER BY price');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, ticket_type, valid_days, includes } = req.body;
    const result = await pool.query(
      'INSERT INTO tickets (name, description, price, ticket_type, valid_days, includes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description, price, ticket_type || 'standard', valid_days || 1, includes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, ticket_type, valid_days, includes } = req.body;
    const result = await pool.query(
      'UPDATE tickets SET name=$1, description=$2, price=$3, ticket_type=$4, valid_days=$5, includes=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, description, price, ticket_type, valid_days, includes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
