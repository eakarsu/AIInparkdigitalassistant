/*
 * routes/groupPlanning.js — Apply pass 5
 *
 * Mechanical group itinerary planning + invite management. No AI.
 * Additive tables: park_groups, park_group_members.
 */
const express = require('express');
const pool = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS park_groups (
        id SERIAL PRIMARY KEY,
        organizer_id INTEGER,
        name TEXT,
        visit_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS park_group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES park_groups(id) ON DELETE CASCADE,
        guest_name TEXT,
        guest_email TEXT,
        role TEXT,
        thrill_level INTEGER,
        accessibility_notes TEXT,
        joined_at TIMESTAMP DEFAULT NOW()
      )`);
  } catch (e) {
    console.error('park_groups bootstrap error:', e.message);
  }
})();

// POST /api/group-planning — create a group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, visit_date, notes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(
      `INSERT INTO park_groups (organizer_id, name, visit_date, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user?.id || null, name, visit_date || null, notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/group-planning/mine — list groups organized by current user
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM park_groups WHERE organizer_id = $1 ORDER BY created_at DESC`,
      [req.user?.id || null]
    );
    res.json({ groups: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/group-planning/:id/members — add a member
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { guest_name, guest_email, role, thrill_level, accessibility_notes } = req.body || {};
    const r = await pool.query(
      `INSERT INTO park_group_members (group_id, guest_name, guest_email, role, thrill_level, accessibility_notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [Number(req.params.id), guest_name || null, guest_email || null, role || 'guest', Number(thrill_level) || null, accessibility_notes || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/group-planning/:id/itinerary — deterministic group itinerary suggestion
router.get('/:id/itinerary', authenticateToken, async (req, res) => {
  try {
    const groupId = Number(req.params.id);
    const g = await pool.query(`SELECT * FROM park_groups WHERE id = $1`, [groupId]);
    if (g.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
    const m = await pool.query(`SELECT * FROM park_group_members WHERE group_id = $1`, [groupId]);
    const members = m.rows;

    const minThrill = members.reduce((acc, x) => x.thrill_level != null ? Math.min(acc, x.thrill_level) : acc, 10);
    const hasAccessibility = members.some((x) => x.accessibility_notes && x.accessibility_notes.trim().length > 0);

    let rides = { rows: [] };
    try {
      rides = await pool.query(`SELECT id, name, COALESCE(thrill_level, 5) AS thrill_level, COALESCE(wheelchair_accessible, false) AS wheelchair_accessible FROM rides`);
    } catch (_) { /* table may not exist */ }

    const eligible = rides.rows.filter((r) => {
      if (r.thrill_level > minThrill) return false;
      if (hasAccessibility && r.wheelchair_accessible !== true) return false;
      return true;
    });

    res.json({
      group: g.rows[0],
      member_count: members.length,
      min_thrill_level: minThrill === 10 ? null : minThrill,
      requires_accessibility: hasAccessibility,
      eligible_rides: eligible.slice(0, 25),
      method: 'min-thrill, accessibility-aware deterministic filter',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
