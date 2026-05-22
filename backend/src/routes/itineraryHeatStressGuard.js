const express = require('express');

const router = express.Router();

function guard(input = {}) {
  const stops = input.stops || [
    { attraction: 'Coaster Plaza', wait_minutes: 55, shade: false, heat_index_f: 101, walking_minutes: 14 },
    { attraction: 'River Theater', wait_minutes: 10, shade: true, heat_index_f: 92, walking_minutes: 4 },
  ];
  return {
    stops: stops.map((s) => {
      const score = Math.min(100, Number(s.wait_minutes) * 0.6 + (s.shade ? 0 : 18) + (Number(s.heat_index_f) - 85) * 2 + Number(s.walking_minutes) * 1.2);
      return { ...s, heat_stress_score: Math.round(score), recommendation: score >= 70 ? 'reroute_to_indoor_cooling' : score >= 45 ? 'add_hydration_break' : 'ok' };
    }),
  };
}

router.get('/', (req, res) => res.json(guard()));
router.post('/guard', (req, res) => res.json(guard(req.body || {})));

module.exports = router;
