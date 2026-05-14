import React, { useEffect, useState } from 'react';
import api from '../services/api';

/* Apply pass 5: 3-tab page covering group planning, dynamic pricing
   recommendations, and integration status. */
export default function Pass5Tools() {
  const [tab, setTab] = useState('groups');
  return (
    <div style={{ padding: 16 }}>
      <h2>Pass 5 Tools</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['groups', 'pricing', 'integrations'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: '6px 12px', background: tab === t ? '#222' : '#fff', color: tab === t ? '#fff' : '#222', border: '1px solid #ccc' }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'groups' && <GroupPlanning />}
      {tab === 'pricing' && <DynamicPricing />}
      {tab === 'integrations' && <Integrations />}
    </div>
  );
}

function GroupPlanning() {
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState(null);

  function load() {
    api.get('/group-planning/mine').then((r) => setGroups(r.data.groups || [])).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!name) return;
    try {
      await api.post('/group-planning', { name, visit_date: date || null });
      setName(''); setDate('');
      load();
    } catch (e) { setError(e.response?.data?.error || e.message); }
  }

  return (
    <div>
      <h3>Group Planning</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
        <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
        <button onClick={create}>Create</button>
      </div>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      <ul>
        {groups.map((g) => (
          <li key={g.id}>#{g.id} {g.name} — {g.visit_date || 'unscheduled'}</li>
        ))}
      </ul>
    </div>
  );
}

function DynamicPricing() {
  const [form, setForm] = useState({ category: 'dining', base_price: '50', hour: '12', day_of_week: '1', crowd_level: 'medium' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function recommend() {
    setError(null);
    try {
      const r = await api.post('/dynamic-pricing/recommend', { ...form, base_price: Number(form.base_price), hour: Number(form.hour), day_of_week: Number(form.day_of_week) });
      setResult(r.data);
    } catch (e) { setError(e.response?.data?.error || e.message); }
  }

  return (
    <div>
      <h3>Dynamic Pricing Recommend</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.keys(form).map((k) => (
          <input key={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={k} />
        ))}
      </div>
      <button onClick={recommend} style={{ marginTop: 8 }}>Recommend</button>
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {result && <pre style={{ background: '#f6f6f6', padding: 8 }}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

function Integrations() {
  const [status, setStatus] = useState(null);
  useEffect(() => { api.get('/integrations/status').then((r) => setStatus(r.data)).catch(() => {}); }, []);
  if (!status) return <div>Loading...</div>;
  return (
    <div>
      <h3>Integration Status</h3>
      <ul>
        {Object.entries(status).map(([k, v]) => (
          <li key={k}>{k}: {v ? 'configured' : 'NOT configured (returns 503)'}</li>
        ))}
      </ul>
      <p>See <code>_BACKLOG_NEEDS_CREDS.md</code> for required env vars.</p>
    </div>
  );
}
