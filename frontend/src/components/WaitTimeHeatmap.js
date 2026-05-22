import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ 1: ride x hour wait time heatmap
function WaitTimeHeatmap() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/wait-heatmap')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  }, []);

  if (err) return <div style={styles.err}>Error: {err}</div>;
  if (!data) return <div style={styles.loading}>Loading wait-time heatmap…</div>;

  const colorFor = (v) => {
    const max = 90;
    const t = Math.min(1, v / max);
    const r = Math.round(40 + t * 200);
    const g = Math.round(190 - t * 160);
    const b = Math.round(140 - t * 100);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div data-testid="viz-wait-heatmap" style={styles.card}>
      <h3 style={styles.h3}>🎢 Wait-Time Heatmap (Ride × Hour)</h3>
      <p style={styles.sub}>Unit: {data.unit}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ride</th>
              {data.hours.map((h) => (
                <th key={h} style={styles.th}>{h}:00</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row) => (
              <tr key={row.ride}>
                <td style={styles.tdRide}>{row.ride}</td>
                {row.waits.map((v, i) => (
                  <td
                    key={i}
                    style={{ ...styles.tdCell, background: colorFor(v) }}
                    title={`${row.ride} @ ${data.hours[i]}:00 = ${v} min`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#16213e', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid #2a2a4a' },
  h3: { color: '#f0c040', marginBottom: 6 },
  sub: { color: '#a0a0b8', marginBottom: 10, fontSize: 13 },
  table: { borderCollapse: 'collapse', width: '100%', color: '#e8e8e8', fontSize: 13 },
  th: { padding: '6px 8px', borderBottom: '1px solid #2a2a4a', textAlign: 'left', color: '#a0a0b8' },
  tdRide: { padding: '6px 10px', borderBottom: '1px solid #2a2a4a', fontWeight: 600 },
  tdCell: { padding: '6px 10px', borderBottom: '1px solid #0f0f1a', textAlign: 'center', color: '#0f0f1a', fontWeight: 600, minWidth: 40 },
  loading: { color: '#a0a0b8', padding: 20 },
  err: { color: '#e94560', padding: 20 },
};

export default WaitTimeHeatmap;
