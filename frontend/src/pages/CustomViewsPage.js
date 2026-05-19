import React from 'react';
import WaitTimeHeatmap from '../components/WaitTimeHeatmap';
import TrafficFlowChart from '../components/TrafficFlowChart';
import ItineraryPlannerPDF from '../components/ItineraryPlannerPDF';
import RecommendationRulesEditor from '../components/RecommendationRulesEditor';

function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page" style={{ padding: '20px 0' }}>
      <h1 style={{ color: '#f0c040', marginBottom: 8 }}>🏰 Park Views — Custom Operational Views</h1>
      <p style={{ color: '#a0a0b8', marginBottom: 20 }}>
        Two visualizations and two non-visualization tools for in-park digital assistant operations.
      </p>

      <section>
        <h2 style={{ color: '#4ecca3', fontSize: 18, marginBottom: 12 }}>Visualizations</h2>
        <WaitTimeHeatmap />
        <TrafficFlowChart />
      </section>

      <section>
        <h2 style={{ color: '#4e9af5', fontSize: 18, marginBottom: 12, marginTop: 20 }}>Tools</h2>
        <ItineraryPlannerPDF />
        <RecommendationRulesEditor />
      </section>
    </div>
  );
}

export default CustomViewsPage;
