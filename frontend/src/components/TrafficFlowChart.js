import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ 2: park traffic flow chart — stacked bars per hour by zone
function TrafficFlowChart() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/traffic-flow')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || e.message));
  }, []);

  if (err) return <div style={styles.err}>Error: {err}</div>;
  if (!data) return <div style={styles.loading}>Loading traffic flow…</div>;

  const palette = ['#e94560', '#f0c040', '#4ecca3', '#4e9af5', '#a855f7'];

  // For each hour, compute total + segments
  const totals = data.hours.map((_, hi) =>
    data.series.reduce((s, z) => s + z.guests[hi], 0)
  );
  const peak = Math.max(...totals, 1);

  return (
    <div data-testid="viz-traffic-flow" style={styles.card}>
      <h3 style={styles.h3}>🚶 Park Traffic Flow (Stacked by Zone)</h3>
      <div style={styles.legend}>
        {data.zones.map((z, i) => (
          <span key={z} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: palette[i % palette.length] }} />
            {z}
          </span>
        ))}
      </div>
      <div style={styles.chart}>
        {data.hours.map((h, hi) => {
          const total = totals[hi];
          const heightPx = Math.round((total / peak) * 220);
          return (
            <div key={h} style={styles.col}>
              <div style={{ ...styles.bar, height: heightPx }}>
                {data.series.map((z, zi) => {
                  const v = z.guests[hi];
                  const segH = total > 0 ? Math.round((v / total) * heightPx) : 0;
                  return (
                    <div
                      key={z.zone}
                      title={`${z.zone} @ ${h}:00 = ${v} guests`}
                      style={{ height: segH, background: palette[zi % palette.length] }}
                    />
                  );
                })}
              </div>
              <div style={styles.xLbl}>{h}</div>
            </div>
          );
        })}
      </div>
      <p style={styles.sub}>Peak hour total: {peak} guests</p>
    </div>
  );
}

const styles = {
  card: { background: '#16213e', padding: 18, borderRadius: 12, marginBottom: 20, border: '1px solid #2a2a4a' },
  h3: { color: '#f0c040', marginBottom: 10 },
  sub: { color: '#a0a0b8', marginTop: 10, fontSize: 13 },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12, color: '#a0a0b8', fontSize: 12 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3, display: 'inline-block' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: 6, padding: '10px 0', borderBottom: '1px solid #2a2a4a' },
  col: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 24 },
  bar: { width: 22, display: 'flex', flexDirection: 'column-reverse', borderRadius: 4, overflow: 'hidden' },
  xLbl: { color: '#a0a0b8', fontSize: 11, marginTop: 4 },
  loading: { color: '#a0a0b8', padding: 20 },
  err: { color: '#e94560', padding: 20 },
};

export default TrafficFlowChart;
