import React, { useState } from 'react';
import api from '../services/api';

// NON-VIZ 1: itinerary planner PDF generator
function ItineraryPlannerPDF() {
  const [form, setForm] = useState({
    guest_name: 'Akarsu Family',
    party_size: 4,
    interests: 'rides,shows,dining',
    start_hour: 9,
    end_hour: 20,
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const handleGenerate = async () => {
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        ...form,
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        party_size: Number(form.party_size),
        start_hour: Number(form.start_hour),
        end_hour: Number(form.end_hour),
      };
      const r = await api.post('/custom-views/itinerary-pdf', payload);
      setResult(r.data);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: result.mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="nonviz-itinerary" style={styles.card}>
      <h3 style={styles.h3}>📄 Itinerary Planner — PDF Export</h3>
      <div style={styles.grid}>
        <label style={styles.lbl}>Guest name
          <input style={styles.inp} value={form.guest_name} onChange={upd('guest_name')} />
        </label>
        <label style={styles.lbl}>Party size
          <input type="number" min="1" max="20" style={styles.inp} value={form.party_size} onChange={upd('party_size')} />
        </label>
        <label style={styles.lbl}>Interests (comma sep)
          <input style={styles.inp} value={form.interests} onChange={upd('interests')} />
        </label>
        <label style={styles.lbl}>Start hour
          <input type="number" min="0" max="23" style={styles.inp} value={form.start_hour} onChange={upd('start_hour')} />
        </label>
        <label style={styles.lbl}>End hour
          <input type="number" min="0" max="23" style={styles.inp} value={form.end_hour} onChange={upd('end_hour')} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button style={styles.btn} onClick={handleGenerate} disabled={busy}>
          {busy ? 'Generating…' : 'Generate Itinerary'}
        </button>
        {result && (
          <button style={{ ...styles.btn, background: '#4ecca3' }} onClick={handleDownload}>
            Download {result.filename}
          </button>
        )}
      </div>
      {err && <div style={styles.err}>Error: {err}</div>}
      {result && (
        <pre style={styles.pre}>{result.content}</pre>
      )}
    </div>
  );
}

const styles = {
  card: { background: '#16213e', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid #2a2a4a' },
  h3: { color: '#f0c040', marginBottom: 10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 },
  lbl: { display: 'flex', flexDirection: 'column', color: '#a0a0b8', fontSize: 12 },
  inp: { marginTop: 4, padding: '6px 8px', background: '#0f0f1a', color: '#e8e8e8', border: '1px solid #2a2a4a', borderRadius: 6 },
  btn: { padding: '8px 14px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  err: { color: '#e94560', marginTop: 10 },
  pre: { marginTop: 12, background: '#0f0f1a', color: '#e8e8e8', padding: 12, borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap' },
};

export default ItineraryPlannerPDF;
