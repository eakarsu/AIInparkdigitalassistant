import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeatureList from './pages/FeatureList';
import FeatureDetail from './pages/FeatureDetail';
import AIAssistant from './pages/AIAssistant';
import AdvancedAITools from './pages/AdvancedAITools';
import Pass5Tools from './pages/Pass5Tools';
import Navbar from './components/Navbar';

// === Batch 04 Gaps & Frontend Mounts ===
import CfAgenticPersonalConciergeBuildingItin from './pages/CfAgenticPersonalConciergeBuildingItin';
import CfRealTimeCrowdIntelligenceIngestingW from './pages/CfRealTimeCrowdIntelligenceIngestingW';
import CfDynamicPricingAiExtendingDynamicpric from './pages/CfDynamicPricingAiExtendingDynamicpric';
import CfAccessibilityInclusivityRecommenderFo from './pages/CfAccessibilityInclusivityRecommenderFo';
import CfGroupPlanningAiExtendingGroupplannin from './pages/CfGroupPlanningAiExtendingGroupplannin';
import CfUpsellMerchandiseRecommenderLearning from './pages/CfUpsellMerchandiseRecommenderLearning';
import GapNoWaitTimePredictionAi from './pages/GapNoWaitTimePredictionAi';
import GapNoCrowdFlowRecommendation from './pages/GapNoCrowdFlowRecommendation';
import GapNoDiningQueuePrediction from './pages/GapNoDiningQueuePrediction';
import GapNoAccessibilityRecommender from './pages/GapNoAccessibilityRecommender';
import GapLiveWaitTimeDataIngestionStill from './pages/GapLiveWaitTimeDataIngestionStill';
import GapNoMobilePushNotifications from './pages/GapNoMobilePushNotifications';
import GapNoWebhookSurfaceForTicketScan from './pages/GapNoWebhookSurfaceForTicketScan';
import GapNoAuditLog0References from './pages/GapNoAuditLog0References';
import GapNoFileUploadForGuestPhoto from './pages/GapNoFileUploadForGuestPhoto';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const handleLogin = (userData, tokenData) => {
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          {/* // === Batch 04 Gaps & Frontend Mounts === */}
          <Route path="/cf-agentic-personal-concierge-building-itin" element={<CfAgenticPersonalConciergeBuildingItin />} />
          <Route path="/cf-real-time-crowd-intelligence-ingesting-w" element={<CfRealTimeCrowdIntelligenceIngestingW />} />
          <Route path="/cf-dynamic-pricing-ai-extending-dynamicpric" element={<CfDynamicPricingAiExtendingDynamicpric />} />
          <Route path="/cf-accessibility-inclusivity-recommender-fo" element={<CfAccessibilityInclusivityRecommenderFo />} />
          <Route path="/cf-group-planning-ai-extending-groupplannin" element={<CfGroupPlanningAiExtendingGroupplannin />} />
          <Route path="/cf-upsell-merchandise-recommender-learning-" element={<CfUpsellMerchandiseRecommenderLearning />} />
          <Route path="/gap-no-wait-time-prediction-ai" element={<GapNoWaitTimePredictionAi />} />
          <Route path="/gap-no-crowd-flow-recommendation" element={<GapNoCrowdFlowRecommendation />} />
          <Route path="/gap-no-dining-queue-prediction" element={<GapNoDiningQueuePrediction />} />
          <Route path="/gap-no-accessibility-recommender" element={<GapNoAccessibilityRecommender />} />
          <Route path="/gap-live-wait-time-data-ingestion-still" element={<GapLiveWaitTimeDataIngestionStill />} />
          <Route path="/gap-no-mobile-push-notifications" element={<GapNoMobilePushNotifications />} />
          <Route path="/gap-no-webhook-surface-for-ticket-scan" element={<GapNoWebhookSurfaceForTicketScan />} />
          <Route path="/gap-no-audit-log-0-references" element={<GapNoAuditLog0References />} />
          <Route path="/gap-no-file-upload-for-guest-photo" element={<GapNoFileUploadForGuestPhoto />} />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rides" element={<FeatureList feature="rides" />} />
          <Route path="/rides/:id" element={<FeatureDetail feature="rides" />} />
          <Route path="/shows" element={<FeatureList feature="shows" />} />
          <Route path="/shows/:id" element={<FeatureDetail feature="shows" />} />
          <Route path="/restaurants" element={<FeatureList feature="restaurants" />} />
          <Route path="/restaurants/:id" element={<FeatureDetail feature="restaurants" />} />
          <Route path="/attractions" element={<FeatureList feature="attractions" />} />
          <Route path="/attractions/:id" element={<FeatureDetail feature="attractions" />} />
          <Route path="/events" element={<FeatureList feature="events" />} />
          <Route path="/events/:id" element={<FeatureDetail feature="events" />} />
          <Route path="/gift-shops" element={<FeatureList feature="gift-shops" />} />
          <Route path="/gift-shops/:id" element={<FeatureDetail feature="gift-shops" />} />
          <Route path="/facilities" element={<FeatureList feature="facilities" />} />
          <Route path="/facilities/:id" element={<FeatureDetail feature="facilities" />} />
          <Route path="/park-zones" element={<FeatureList feature="park-zones" />} />
          <Route path="/park-zones/:id" element={<FeatureDetail feature="park-zones" />} />
          <Route path="/tickets" element={<FeatureList feature="tickets" />} />
          <Route path="/tickets/:id" element={<FeatureDetail feature="tickets" />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/advanced-ai" element={<AdvancedAITools />} />
          <Route path="/pass5-tools" element={<Pass5Tools />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
