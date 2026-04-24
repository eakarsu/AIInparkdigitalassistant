import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ridesAPI, showsAPI, restaurantsAPI, attractionsAPI, eventsAPI,
  giftShopsAPI, facilitiesAPI, parkZonesAPI, ticketsAPI
} from '../services/api';

const features = [
  { key: 'rides', title: 'Rides', icon: '🎢', desc: 'Check wait times, thrill levels, and ride details', color: '#e94560', api: ridesAPI },
  { key: 'shows', title: 'Shows & Entertainment', icon: '🎭', desc: 'Find showtimes, venues, and live entertainment', color: '#a855f7', api: showsAPI },
  { key: 'restaurants', title: 'Dining', icon: '🍽️', desc: 'Explore restaurants, menus, and cuisine options', color: '#f59e0b', api: restaurantsAPI },
  { key: 'attractions', title: 'Attractions', icon: '🎪', desc: 'Discover interactive experiences and unique attractions', color: '#4ecca3', api: attractionsAPI },
  { key: 'events', title: 'Events', icon: '🎉', desc: 'Special events, festivals, and seasonal celebrations', color: '#ec4899', api: eventsAPI },
  { key: 'gift-shops', title: 'Gift Shops', icon: '🛍️', desc: 'Find souvenirs, merchandise, and specialty stores', color: '#8b5cf6', api: giftShopsAPI },
  { key: 'facilities', title: 'Facilities', icon: '🏥', desc: 'Restrooms, first aid, lockers, and guest services', color: '#06b6d4', api: facilitiesAPI },
  { key: 'park-zones', title: 'Park Zones', icon: '🗺️', desc: 'Explore themed areas and navigate the park', color: '#10b981', api: parkZonesAPI },
  { key: 'tickets', title: 'Tickets & Passes', icon: '🎟️', desc: 'Day passes, annual memberships, and special packages', color: '#f0c040', api: ticketsAPI },
  { key: 'ai-assistant', title: 'AI Park Assistant', icon: '🤖', desc: 'Get personalized recommendations and plan your day', color: '#a855f7', api: null },
];

function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const loadCounts = async () => {
      const newCounts = {};
      for (const f of features) {
        if (f.api) {
          try {
            const res = await f.api.getAll();
            newCounts[f.key] = res.data.length;
          } catch {
            newCounts[f.key] = 0;
          }
        }
      }
      setCounts(newCounts);
    };
    loadCounts();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to Adventure Kingdom</h1>
        <p>Your digital guide to the ultimate theme park experience</p>
      </div>
      <div className="dashboard-grid">
        {features.map((f) => (
          <div
            key={f.key}
            className="dashboard-card"
            style={{ '--card-accent': f.color }}
            onClick={() => navigate(`/${f.key}`)}
          >
            <div className="card-icon">{f.icon}</div>
            <div className="card-title">{f.title}</div>
            <div className="card-desc">{f.desc}</div>
            {counts[f.key] !== undefined && (
              <div className="card-count">{counts[f.key]} items</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
