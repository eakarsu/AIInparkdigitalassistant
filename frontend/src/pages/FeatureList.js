import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ridesAPI, showsAPI, restaurantsAPI, attractionsAPI, eventsAPI,
  giftShopsAPI, facilitiesAPI, parkZonesAPI, ticketsAPI
} from '../services/api';

const featureConfig = {
  rides: {
    title: 'Rides', icon: '🎢', api: ridesAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'zone', label: 'Zone' },
      { key: 'wait_time', label: 'Wait Time', render: (v) => <span className={`wait-time ${v <= 15 ? 'wait-low' : v <= 35 ? 'wait-medium' : 'wait-high'}`}>{v} min</span> },
      { key: 'status', label: 'Status', render: (v) => <span className={`status-badge status-${v}`}>{v}</span> },
      { key: 'thrill_level', label: 'Thrill', render: (v) => <span className={`thrill-${v}`}>{v}</span> },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'wait_time', label: 'Wait Time (min)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'closed', 'maintenance'] },
      { key: 'thrill_level', label: 'Thrill Level', type: 'select', options: ['low', 'medium', 'high', 'extreme'] },
      { key: 'min_height', label: 'Min Height (cm)', type: 'number' },
      { key: 'duration', label: 'Duration', type: 'text' },
    ],
  },
  shows: {
    title: 'Shows & Entertainment', icon: '🎭', api: showsAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'zone', label: 'Zone' },
      { key: 'show_times', label: 'Show Times' },
      { key: 'duration', label: 'Duration' },
      { key: 'venue', label: 'Venue' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'show_times', label: 'Show Times', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'venue', label: 'Venue', type: 'text' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
    ],
  },
  restaurants: {
    title: 'Dining', icon: '🍽️', api: restaurantsAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'zone', label: 'Zone' },
      { key: 'cuisine_type', label: 'Cuisine' },
      { key: 'price_range', label: 'Price' },
      { key: 'hours', label: 'Hours' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'cuisine_type', label: 'Cuisine Type', type: 'text' },
      { key: 'price_range', label: 'Price Range', type: 'select', options: ['$', '$$', '$$$', '$$$$'] },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'seating_capacity', label: 'Seating Capacity', type: 'number' },
    ],
  },
  attractions: {
    title: 'Attractions', icon: '🎪', api: attractionsAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'zone', label: 'Zone' },
      { key: 'type', label: 'Type' },
      { key: 'age_group', label: 'Age Group' },
      { key: 'duration', label: 'Duration' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'age_group', label: 'Age Group', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
    ],
  },
  events: {
    title: 'Events', icon: '🎉', api: eventsAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'zone', label: 'Zone' },
      { key: 'event_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '' },
      { key: 'start_time', label: 'Start' },
      { key: 'event_type', label: 'Type' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'event_date', label: 'Date', type: 'date' },
      { key: 'start_time', label: 'Start Time', type: 'text' },
      { key: 'end_time', label: 'End Time', type: 'text' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
      { key: 'event_type', label: 'Event Type', type: 'text' },
    ],
  },
  'gift-shops': {
    title: 'Gift Shops', icon: '🛍️', api: giftShopsAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'zone', label: 'Zone' },
      { key: 'specialty', label: 'Specialty' },
      { key: 'hours', label: 'Hours' },
      { key: 'price_range', label: 'Price' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'specialty', label: 'Specialty', type: 'text' },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'price_range', label: 'Price Range', type: 'select', options: ['$', '$$', '$$$'] },
    ],
  },
  facilities: {
    title: 'Facilities', icon: '🏥', api: facilitiesAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'zone', label: 'Zone' },
      { key: 'facility_type', label: 'Type' },
      { key: 'hours', label: 'Hours' },
      { key: 'accessibility', label: 'Accessible', render: (v) => v ? '✅' : '❌' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'facility_type', label: 'Facility Type', type: 'text' },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'accessibility', label: 'Accessible', type: 'select', options: ['true', 'false'] },
    ],
  },
  'park-zones': {
    title: 'Park Zones', icon: '🗺️', api: parkZonesAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'theme', label: 'Theme' },
      { key: 'hours', label: 'Hours' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'theme', label: 'Theme', type: 'text' },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'highlights', label: 'Highlights', type: 'textarea' },
    ],
  },
  tickets: {
    title: 'Tickets & Passes', icon: '🎟️', api: ticketsAPI,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'price', label: 'Price', render: (v) => <span className="price">${parseFloat(v).toFixed(2)}</span> },
      { key: 'ticket_type', label: 'Type' },
      { key: 'valid_days', label: 'Valid Days' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'ticket_type', label: 'Type', type: 'text' },
      { key: 'valid_days', label: 'Valid Days', type: 'number' },
      { key: 'includes', label: 'Includes', type: 'textarea' },
    ],
  },
};

function FeatureList({ feature }) {
  const navigate = useNavigate();
  const config = featureConfig[feature];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await config.api.getAll();
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [config.api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    const initial = {};
    config.fields.forEach(f => { initial[f.key] = ''; });
    setFormData(initial);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await config.api.create(formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Failed to create item: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div> Loading {config.title}...</div>;
  }

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div className="feature-header-left">
          <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
          <h2>{config.icon} {config.title}</h2>
        </div>
        <button className="btn-add" onClick={handleAdd}>+ Add New</button>
      </div>

      <table className="list-table">
        <thead>
          <tr>
            <th>#</th>
            {config.columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} onClick={() => navigate(`/${feature}/${item.id}`)}>
              <td>{idx + 1}</td>
              {config.columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(item[col.key]) : (item[col.key] || '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No items found. Click "Add New" to create one.
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add New {config.title.replace(/s$/, '').replace(/ie$/, 'y')}</h2>
            <form onSubmit={handleSubmit}>
              {config.fields.map(field => (
                <div className="form-group" key={field.key}>
                  <label>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      required={field.required}
                      step={field.type === 'number' ? 'any' : undefined}
                    />
                  )}
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureList;
