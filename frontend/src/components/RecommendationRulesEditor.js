import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ 2: recommendation rules CRUD editor (age + preference)
function RecommendationRulesEditor() {
  const [rules, setRules] = useState([]);
  const [draft, setDraft] = useState({ age_min: 0, age_max: 99, preference: '', recommendation: '' });
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({});
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/custom-views/rules');
      setRules(r.data.rules || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setBusy(true); setErr(null);
    try {
      await api.post('/custom-views/rules', {
        age_min: Number(draft.age_min),
        age_max: Number(draft.age_max),
        preference: draft.preference,
        recommendation: draft.recommendation,
      });
      setDraft({ age_min: 0, age_max: 99, preference: '', recommendation: '' });
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  const startEdit = (r) => { setEditingId(r.id); setEdit({ ...r }); };
  const cancelEdit = () => { setEditingId(null); setEdit({}); };

  const handleSave = async () => {
    setBusy(true); setErr(null);
    try {
      await api.put(`/custom-views/rules/${editingId}`, edit);
      cancelEdit();
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    setBusy(true); setErr(null);
    try {
      await api.delete(`/custom-views/rules/${id}`);
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally { setBusy(false); }
  };

  const updDraft = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const updEdit = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  return (
    <div data-testid="nonviz-rules" style={styles.card}>
      <h3 style={styles.h3}>🛠️ Recommendation Rules — Age / Preference CRUD</h3>
      {err && <div style={styles.err}>Error: {err}</div>}

      <div style={styles.formRow}>
        <input type="number" placeholder="age_min" style={styles.inp} value={draft.age_min} onChange={updDraft('age_min')} />
        <input type="number" placeholder="age_max" style={styles.inp} value={draft.age_max} onChange={updDraft('age_max')} />
        <input placeholder="preference (e.g. thrill)" style={styles.inp} value={draft.preference} onChange={updDraft('preference')} />
        <input placeholder="recommendation" style={{ ...styles.inp, flex: 2 }} value={draft.recommendation} onChange={updDraft('recommendation')} />
        <button style={styles.btn} disabled={busy} onClick={handleCreate}>Add</button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Age min</th>
            <th style={styles.th}>Age max</th>
            <th style={styles.th}>Preference</th>
            <th style={styles.th}>Recommendation</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td style={styles.td}>{r.id}</td>
              {editingId === r.id ? (
                <>
                  <td style={styles.td}><input type="number" style={styles.inpSm} value={edit.age_min} onChange={updEdit('age_min')} /></td>
                  <td style={styles.td}><input type="number" style={styles.inpSm} value={edit.age_max} onChange={updEdit('age_max')} /></td>
                  <td style={styles.td}><input style={styles.inpSm} value={edit.preference} onChange={updEdit('preference')} /></td>
                  <td style={styles.td}><input style={styles.inpSm} value={edit.recommendation} onChange={updEdit('recommendation')} /></td>
                  <td style={styles.td}>
                    <button style={styles.btnSm} onClick={handleSave} disabled={busy}>Save</button>
                    <button style={{ ...styles.btnSm, background: '#6b6b80' }} onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td style={styles.td}>{r.age_min}</td>
                  <td style={styles.td}>{r.age_max}</td>
                  <td style={styles.td}>{r.preference}</td>
                  <td style={styles.td}>{r.recommendation}</td>
                  <td style={styles.td}>
                    <button style={styles.btnSm} onClick={() => startEdit(r)}>Edit</button>
                    <button style={{ ...styles.btnSm, background: '#e94560' }} onClick={() => handleDelete(r.id)} disabled={busy}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  card: { background: '#16213e', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid #2a2a4a' },
  h3: { color: '#f0c040', marginBottom: 10 },
  formRow: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  inp: { padding: '6px 8px', background: '#0f0f1a', color: '#e8e8e8', border: '1px solid #2a2a4a', borderRadius: 6, flex: 1, minWidth: 90 },
  inpSm: { padding: '4px 6px', background: '#0f0f1a', color: '#e8e8e8', border: '1px solid #2a2a4a', borderRadius: 4, width: '95%' },
  btn: { padding: '8px 14px', background: '#4ecca3', color: '#0f0f1a', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700 },
  btnSm: { padding: '4px 10px', background: '#4e9af5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginRight: 4, fontSize: 12 },
  table: { borderCollapse: 'collapse', width: '100%', color: '#e8e8e8', fontSize: 13 },
  th: { padding: '6px 8px', borderBottom: '1px solid #2a2a4a', textAlign: 'left', color: '#a0a0b8' },
  td: { padding: '6px 8px', borderBottom: '1px solid #2a2a4a' },
  err: { color: '#e94560', marginBottom: 10 },
};

export default RecommendationRulesEditor;
