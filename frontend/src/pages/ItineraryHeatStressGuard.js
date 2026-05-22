import React, { useEffect, useState } from 'react';

export default function ItineraryHeatStressGuard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/itinerary-heat-stress-guard').then((r) => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <div>
      <h1>Itinerary Heat Stress Guard</h1>
      <p>Reorders park stops when heat index, walking time, shade, and queue length create guest stress risk.</p>
      {data?.stops?.map((s) => <section key={s.attraction} className="card"><h2>{s.attraction}</h2><p>{s.recommendation} - score {s.heat_stress_score}</p></section>)}
    </div>
  );
}
