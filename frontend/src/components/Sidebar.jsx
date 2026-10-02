import React from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: "/login", label: "Login" },
  { to: "/cf-agentic-personal-concierge-building-itin", label: "Cf Agentic Personal Concierge Building Itin" },
  { to: "/cf-real-time-crowd-intelligence-ingesting-w", label: "Cf Real Time Crowd Intelligence Ingesting W" },
  { to: "/cf-dynamic-pricing-ai-extending-dynamicpric", label: "Cf Dynamic Pricing Ai Extending Dynamicpric" },
  { to: "/cf-accessibility-inclusivity-recommender-fo", label: "Cf Accessibility Inclusivity Recommender Fo" },
  { to: "/cf-group-planning-ai-extending-groupplannin", label: "Cf Group Planning Ai Extending Groupplannin" },
  { to: "/cf-upsell-merchandise-recommender-learning-", label: "Cf Upsell Merchandise Recommender Learning" },
  { to: "/gap-no-wait-time-prediction-ai", label: "Gap No Wait Time Prediction Ai" },
  { to: "/gap-no-crowd-flow-recommendation", label: "Gap No Crowd Flow Recommendation" },
  { to: "/gap-no-dining-queue-prediction", label: "Gap No Dining Queue Prediction" },
  { to: "/gap-no-accessibility-recommender", label: "Gap No Accessibility Recommender" },
  { to: "/gap-live-wait-time-data-ingestion-still", label: "Gap Live Wait Time Data Ingestion Still" },
  { to: "/gap-no-mobile-push-notifications", label: "Gap No Mobile Push Notifications" },
  { to: "/gap-no-webhook-surface-for-ticket-scan", label: "Gap No Webhook Surface For Ticket Scan" },
  { to: "/gap-no-audit-log-0-references", label: "Gap No Audit Log0 References" },
  { to: "/gap-no-file-upload-for-guest-photo", label: "Gap No File Upload For Guest Photo" },
  { to: "/rides", label: "Feature List" },
  { to: "/shows", label: "Feature List" },
  { to: "/restaurants", label: "Feature List" },
  { to: "/attractions", label: "Feature List" },
  { to: "/events", label: "Feature List" },
  { to: "/gift-shops", label: "Feature List" },
  { to: "/facilities", label: "Feature List" },
  { to: "/park-zones", label: "Feature List" },
  { to: "/tickets", label: "Feature List" },
  { to: "/ai-assistant", label: "AIAssistant" },
  { to: "/advanced-ai", label: "Advanced AITools" },
  { to: "/pass5-tools", label: "Pass5 Tools" },
  { to: "/custom-views", label: "Custom Views Page" },
  { to: "/itinerary-heat-stress-guard", label: "Itinerary Heat Stress Guard" },
];

const CSS = `
.app-shell{display:grid;grid-template-columns:264px 1fr;min-height:100vh}
.sidebar{background:#0b1220;color:#fff;padding:22px 14px;position:sticky;top:0;height:100vh;overflow:auto;display:flex;flex-direction:column;gap:6px}
.sidebar-brand{padding:6px 10px 16px;border-bottom:1px solid #ffffff18;margin-bottom:10px}
.sidebar-brand .eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:800;color:#7dd3fc}
.sidebar-brand h1{font-size:17px;margin:8px 0 0;line-height:1.25;word-break:break-word}
.sidebar-nav{display:flex;flex-direction:column;gap:2px;flex:1;overflow:auto}
.sidebar-nav a{display:block;border-radius:10px;color:#94a3b8;padding:9px 12px;text-decoration:none;font-weight:600;font-size:13.5px}
.sidebar-nav a:hover{background:#ffffff12;color:#fff}
.sidebar-nav a.active{background:#2563eb;color:#fff}
.sidebar-foot{margin-top:12px;padding-top:12px;border-top:1px solid #ffffff18;display:flex;flex-direction:column;gap:8px}
.sidebar-user{font-size:12px;color:#cbd5e1}
.sidebar-logout{border:0;border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer;background:#1e293b;color:#e2e8f0}
.sidebar-logout:hover{background:#334155}
@media(max-width:900px){.app-shell{grid-template-columns:1fr}.sidebar{position:relative;height:auto}}
`;

export default function Sidebar({ user, onLogout }) {
  return (
    <>
      <style>{CSS}</style>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">Sidebar app</span>
          <h1>AIInparkdigitalassistant</h1>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          {user && <span className="sidebar-user">{user.name || user.email || 'Signed in'}</span>}
          <button className="sidebar-logout" onClick={onLogout}>Logout</button>
        </div>
      </aside>
    </>
  );
}
