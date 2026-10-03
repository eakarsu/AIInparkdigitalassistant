import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './AppSidebar.css';

const LINKS = [
  { to: '/insights/timeline', label: 'Timeline', group: 'Insights' },
  { to: '/codex/custom-viz', label: 'Custom Viz', group: 'Insights' },
  { to: '/codex/operations', label: 'Operations', group: 'Insights' },
  { to: '/', label: 'Dashboard', group: 'Workspace' },
  { to: '/rides', label: 'Rides', group: 'Workspace' },
  { to: '/shows', label: 'Shows', group: 'Workspace' },
  { to: '/restaurants', label: 'Restaurants', group: 'Workspace' },
  { to: '/attractions', label: 'Attractions', group: 'Workspace' },
  { to: '/events', label: 'Events', group: 'Workspace' },
  { to: '/gift-shops', label: 'Gift Shops', group: 'Workspace' },
  { to: '/facilities', label: 'Facilities', group: 'Workspace' },
  { to: '/park-zones', label: 'Park Zones', group: 'Workspace' },
  { to: '/tickets', label: 'Tickets', group: 'Workspace' },
  { to: '/ai-assistant', label: 'Ai Assistant', group: 'AI tools' },
  { to: '/advanced-ai', label: 'Advanced Ai', group: 'Workspace' },
  { to: '/pass5-tools', label: 'Pass5 Tools', group: 'Workspace' },
  { to: '/custom-views', label: 'Custom Views', group: 'Workspace' },
  { to: '/itinerary-heat-stress-guard', label: 'Itinerary Heat Stress Guard', group: 'Workspace' },
];

export default function AppSidebar() {
  const [query, setQuery] = useState('');
  const visible = LINKS.filter(link => link.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <aside className="codex-side" aria-label="Application navigation">
    <div className="codex-side-brand"><strong>AIInparkdigitalassistant</strong><span>Workspace</span></div>
    <label className="codex-side-search-label" htmlFor="codex-side-search">Find a section</label>
    <input id="codex-side-search" className="codex-side-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search navigation" />
    <nav className="codex-side-links" aria-label="Sections">
      {['Workspace', 'AI tools', 'Insights'].map(group => {
        const items = visible.filter(link => link.group === group);
        return items.length ? <div className="codex-side-group" key={group}>
          <span className="codex-side-heading">{group}</span>
          {items.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => `codex-side-link${isActive ? ' active' : ''}`}>{link.label}</NavLink>)}
        </div> : null;
      })}
      {visible.length === 0 && <p className="codex-side-empty">No matching sections</p>}
    </nav>
  </aside>;
}
