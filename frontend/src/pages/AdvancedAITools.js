import React, { useEffect, useState } from 'react';
import api, { ridesAPI, parkZonesAPI, restaurantsAPI } from '../services/api';

const TOOLS = [
  {
    id: 'wait-time-prediction',
    title: 'Wait Time Prediction',
    icon: '⏱️',
    endpoint: '/ai/wait-time-prediction',
    desc: 'Next 30/60/120 minute wait predictions with trend and confidence per ride.',
  },
  {
    id: 'crowd-flow-recommendation',
    title: 'Crowd Flow Recommendation',
    icon: '🗺️',
    endpoint: '/ai/crowd-flow-recommendation',
    desc: 'Step-by-step routing with expected waits and walking estimate.',
  },
  {
    id: 'accessibility-recommendations',
    title: 'Accessibility Recommendations',
    icon: '♿',
    endpoint: '/ai/accessibility-recommendations',
    desc: 'Recommended rides/shows/dining matched to mobility, sensory, age, intensity, and dietary inputs.',
  },
  {
    id: 'dining-queue-prediction',
    title: 'Dining Queue Prediction',
    icon: '🍽️',
    endpoint: '/ai/dining-queue-prediction',
    desc: 'Next 30/60/120 minute queue minutes per restaurant with capacity-risk and best-window callouts.',
  },
  {
    id: 'concierge-plan',
    title: 'Personal Concierge',
    icon: '🎩',
    endpoint: '/ai/concierge-plan',
    desc: 'Agentic park-day plan sequencing rides, shows, dining, and shopping by zone & guest profile.',
  },
  {
    id: 'upsell-recommendation',
    title: 'Upsell / Merch',
    icon: '🛍️',
    endpoint: '/ai/upsell-recommendation',
    desc: 'Tasteful merch / dining / photo / show upgrades matched to today\'s actual experience and budget.',
  },
];

export default function AdvancedAITools() {
  const [tab, setTab] = useState(TOOLS[0].id);
  const [rides, setRides] = useState([]);
  const [zones, setZones] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Wait Time
  const [selectedRideIds, setSelectedRideIds] = useState([]);

  // Crowd Flow
  const [crowdForm, setCrowdForm] = useState({ current_zone: '', end_time: '', group_type: 'family' });

  // Accessibility
  const [accForm, setAccForm] = useState({ mobility: '', sensory: '', age: '', intensity: 'family', dietary: '' });

  // Dining Queue (apply pass 4)
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState([]);
  const [diningForm, setDiningForm] = useState({ time_of_day: 'mid-day', weather: '', season: '', group_size: '' });

  // Personal Concierge (apply pass 4 — additional)
  const [conciergeForm, setConciergeForm] = useState({
    visit_date: '', arrival_time: '', departure_time: '',
    group_size: '', group_composition: '', mobility_needs: '',
    dietary_restrictions: '', thrill_tolerance: 'medium',
    budget_per_person: '', must_do: '', avoid: '', notes: '',
  });

  // Upsell / Merch (apply pass 4 — additional)
  const [upsellForm, setUpsellForm] = useState({
    visited_attractions: '', booked_items: '', group_size: '',
    remaining_budget: '', preferences: '', visit_phase: 'mid-visit',
  });

  useEffect(() => {
    ridesAPI.getAll(1, 100).then((res) => setRides(res.data?.data || res.data || [])).catch(() => setRides([]));
    parkZonesAPI.getAll(1, 100).then((res) => setZones(res.data?.data || res.data || [])).catch(() => setZones([]));
    restaurantsAPI.getAll(1, 100).then((res) => setRestaurants(res.data?.data || res.data || [])).catch(() => setRestaurants([]));
  }, []);

  const switchTab = (id) => {
    setTab(id);
    setError(null);
    setResult(null);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let body = {};
      if (tab === 'wait-time-prediction') {
        if (selectedRideIds.length > 0) body.ride_ids = selectedRideIds.map(Number);
      } else if (tab === 'crowd-flow-recommendation') {
        if (crowdForm.current_zone) body.current_zone = crowdForm.current_zone;
        if (crowdForm.end_time) body.end_time = crowdForm.end_time;
        if (crowdForm.group_type) body.group_type = crowdForm.group_type;
      } else if (tab === 'accessibility-recommendations') {
        Object.entries(accForm).forEach(([k, v]) => {
          if (v) body[k] = k === 'age' ? Number(v) : v;
        });
      } else if (tab === 'dining-queue-prediction') {
        if (selectedRestaurantIds.length > 0) body.restaurant_ids = selectedRestaurantIds.map(Number);
        Object.entries(diningForm).forEach(([k, v]) => {
          if (v) body[k] = k === 'group_size' ? Number(v) : v;
        });
      } else if (tab === 'concierge-plan') {
        Object.entries(conciergeForm).forEach(([k, v]) => {
          if (v === '' || v == null) return;
          if (k === 'must_do' || k === 'avoid') {
            body[k] = String(v).split(',').map((s) => s.trim()).filter(Boolean);
          } else if (k === 'group_size' || k === 'budget_per_person') {
            const n = Number(v);
            if (!Number.isNaN(n)) body[k] = n;
          } else {
            body[k] = v;
          }
        });
      } else if (tab === 'upsell-recommendation') {
        Object.entries(upsellForm).forEach(([k, v]) => {
          if (v === '' || v == null) return;
          if (k === 'visited_attractions' || k === 'booked_items') {
            body[k] = String(v).split(',').map((s) => s.trim()).filter(Boolean);
          } else if (k === 'group_size' || k === 'remaining_budget') {
            const n = Number(v);
            if (!Number.isNaN(n)) body[k] = n;
          } else {
            body[k] = v;
          }
        });
      }
      const tool = TOOLS.find((t) => t.id === tab);
      const res = await api.post(tool.endpoint, body);
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.error || err.message || 'AI request failed';
      if (status === 503) msg = `AI unavailable (503): ${msg}`;
      setError(msg);
    }
    setLoading(false);
  };

  const toggleRide = (id) => {
    setSelectedRideIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ marginBottom: 4 }}>🤖 Advanced AI Tools</h1>
        <p style={{ color: '#94a3b8' }}>Wait-time, crowd flow, and accessibility recommendations</p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            style={{
              padding: '10px 16px', borderRadius: 8, border: '1px solid #334155',
              background: tab === t.id ? '#a855f7' : '#1e293b',
              color: 'white', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <span style={{ marginRight: 6 }}>{t.icon}</span>{t.title}
          </button>
        ))}
      </div>

      <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, color: 'white' }}>
        <h3 style={{ marginTop: 0, color: '#f0c040' }}>{TOOLS.find((t) => t.id === tab).icon} {TOOLS.find((t) => t.id === tab).title}</h3>
        <p style={{ color: '#94a3b8' }}>{TOOLS.find((t) => t.id === tab).desc}</p>

        {tab === 'wait-time-prediction' && (
          <div>
            <p style={{ fontSize: 13, color: '#cbd5e1' }}>Select rides (or none for all open rides):</p>
            <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              {rides.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 13 }}>No rides loaded.</div>
              ) : (
                rides.map((r) => (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedRideIds.includes(r.id)}
                      onChange={() => toggleRide(r.id)}
                    />
                    <span>{r.name} {r.status ? `(${r.status})` : ''}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'crowd-flow-recommendation' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Current Zone</div>
              <select
                value={crowdForm.current_zone}
                onChange={(e) => setCrowdForm({ ...crowdForm, current_zone: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              >
                <option value="">-- Select zone --</option>
                {zones.map((z) => <option key={z.id} value={z.name}>{z.name}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>End Time (e.g. 18:00)</div>
              <input
                type="time"
                value={crowdForm.end_time}
                onChange={(e) => setCrowdForm({ ...crowdForm, end_time: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Group Type</div>
              <select
                value={crowdForm.group_type}
                onChange={(e) => setCrowdForm({ ...crowdForm, group_type: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              >
                <option value="family">Family</option>
                <option value="thrill_seeker">Thrill Seekers</option>
                <option value="couple">Couple</option>
                <option value="solo">Solo</option>
                <option value="seniors">Seniors</option>
              </select>
            </label>
          </div>
        )}

        {tab === 'accessibility-recommendations' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Mobility</div>
              <select
                value={accForm.mobility}
                onChange={(e) => setAccForm({ ...accForm, mobility: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              >
                <option value="">No special needs</option>
                <option value="wheelchair">Wheelchair</option>
                <option value="walker">Walker</option>
                <option value="limited_mobility">Limited mobility</option>
              </select>
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Sensory</div>
              <select
                value={accForm.sensory}
                onChange={(e) => setAccForm({ ...accForm, sensory: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              >
                <option value="">None</option>
                <option value="autism_friendly">Autism-friendly</option>
                <option value="low_noise">Low noise</option>
                <option value="low_light">Low light</option>
              </select>
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Age</div>
              <input
                type="number"
                value={accForm.age}
                onChange={(e) => setAccForm({ ...accForm, age: e.target.value })}
                placeholder="e.g. 8"
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Intensity</div>
              <select
                value={accForm.intensity}
                onChange={(e) => setAccForm({ ...accForm, intensity: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              >
                <option value="gentle">Gentle</option>
                <option value="family">Family</option>
                <option value="moderate">Moderate</option>
                <option value="thrill">Thrill</option>
              </select>
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Dietary</div>
              <input
                type="text"
                value={accForm.dietary}
                onChange={(e) => setAccForm({ ...accForm, dietary: e.target.value })}
                placeholder="e.g. gluten-free, vegan"
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
          </div>
        )}

        {tab === 'dining-queue-prediction' && (
          <div>
            <p style={{ fontSize: 13, color: '#cbd5e1' }}>Select restaurants (or none for all):</p>
            <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              {restaurants.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 13 }}>No restaurants loaded.</div>
              ) : (
                restaurants.map((r) => (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedRestaurantIds.includes(r.id)}
                      onChange={() => setSelectedRestaurantIds((prev) => (prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id]))}
                    />
                    <span>{r.name} {r.cuisine_type ? `(${r.cuisine_type})` : ''}</span>
                  </label>
                ))
              )}
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <label>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Time of day</div>
                <select
                  value={diningForm.time_of_day}
                  onChange={(e) => setDiningForm({ ...diningForm, time_of_day: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                >
                  <option value="morning">Morning</option>
                  <option value="mid-day">Mid-day</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </label>
              <label>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Group size</div>
                <input
                  type="number"
                  min="1"
                  value={diningForm.group_size}
                  onChange={(e) => setDiningForm({ ...diningForm, group_size: e.target.value })}
                  placeholder="e.g. 4"
                  style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Weather</div>
                <input
                  type="text"
                  value={diningForm.weather}
                  onChange={(e) => setDiningForm({ ...diningForm, weather: e.target.value })}
                  placeholder="e.g. sunny 78F"
                  style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, marginBottom: 4 }}>Season</div>
                <select
                  value={diningForm.season}
                  onChange={(e) => setDiningForm({ ...diningForm, season: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                >
                  <option value="">--</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                  <option value="winter">Winter</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {tab === 'concierge-plan' && (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {[
              ['visit_date', 'Visit date', 'date'],
              ['arrival_time', 'Arrival time', 'time'],
              ['departure_time', 'Departure time', 'time'],
              ['group_size', 'Group size', 'number'],
              ['group_composition', 'Group composition (e.g. 2 adults, 2 kids 6/9)', 'text'],
              ['mobility_needs', 'Mobility needs', 'text'],
              ['dietary_restrictions', 'Dietary restrictions', 'text'],
              ['budget_per_person', 'Budget per person ($)', 'number'],
              ['must_do', 'Must-do (comma-separated)', 'text'],
              ['avoid', 'Avoid (comma-separated)', 'text'],
            ].map(([k, label, type]) => (
              <label key={k}>
                <div style={{ fontSize: 13, marginBottom: 4 }}>{label}</div>
                <input
                  type={type}
                  value={conciergeForm[k]}
                  onChange={(e) => setConciergeForm({ ...conciergeForm, [k]: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
                />
              </label>
            ))}
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Thrill tolerance</div>
              <select
                value={conciergeForm.thrill_tolerance}
                onChange={(e) => setConciergeForm({ ...conciergeForm, thrill_tolerance: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              >
                <option value="gentle">Gentle</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Notes</div>
              <textarea
                value={conciergeForm.notes}
                onChange={(e) => setConciergeForm({ ...conciergeForm, notes: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
          </div>
        )}

        {tab === 'upsell-recommendation' && (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Visited attractions today (comma-separated)</div>
              <input
                type="text"
                value={upsellForm.visited_attractions}
                onChange={(e) => setUpsellForm({ ...upsellForm, visited_attractions: e.target.value })}
                placeholder="Hyperion Coaster, Splash Mountain"
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Already-booked items (comma-separated)</div>
              <input
                type="text"
                value={upsellForm.booked_items}
                onChange={(e) => setUpsellForm({ ...upsellForm, booked_items: e.target.value })}
                placeholder="2x lunch reservation, evening parade VIP"
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Group size</div>
              <input
                type="number"
                min="1"
                value={upsellForm.group_size}
                onChange={(e) => setUpsellForm({ ...upsellForm, group_size: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Remaining budget ($)</div>
              <input
                type="number"
                min="0"
                value={upsellForm.remaining_budget}
                onChange={(e) => setUpsellForm({ ...upsellForm, remaining_budget: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
            <label>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Visit phase</div>
              <select
                value={upsellForm.visit_phase}
                onChange={(e) => setUpsellForm({ ...upsellForm, visit_phase: e.target.value })}
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              >
                <option value="arrival">Arrival</option>
                <option value="mid-visit">Mid-visit</option>
                <option value="late-day">Late-day</option>
                <option value="exit">Exit / souvenir stop</option>
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Stated preferences</div>
              <input
                type="text"
                value={upsellForm.preferences}
                onChange={(e) => setUpsellForm({ ...upsellForm, preferences: e.target.value })}
                placeholder="loves coasters, kids want plush; no apparel"
                style={{ width: '100%', padding: 10, borderRadius: 6, background: '#0f172a', color: 'white', border: '1px solid #334155' }}
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 16, padding: '10px 20px', borderRadius: 8, border: 'none',
            background: loading ? '#64748b' : '#a855f7', color: 'white', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Run AI Analysis'}
        </button>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#7f1d1d', color: '#fecaca', borderRadius: 8 }}>{error}</div>
        )}

        {result && (
          <div style={{ marginTop: 16, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
            <h4 style={{ marginTop: 0, color: '#f0c040' }}>Result</h4>
            <pre style={{ background: '#020617', color: '#e2e8f0', padding: 14, borderRadius: 8, overflow: 'auto', fontSize: 12, maxHeight: 520 }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
