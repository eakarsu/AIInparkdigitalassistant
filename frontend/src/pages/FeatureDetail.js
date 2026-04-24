import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ridesAPI, showsAPI, restaurantsAPI, attractionsAPI, eventsAPI,
  giftShopsAPI, facilitiesAPI, parkZonesAPI, ticketsAPI
} from '../services/api';

const apiMap = {
  rides: ridesAPI,
  shows: showsAPI,
  restaurants: restaurantsAPI,
  attractions: attractionsAPI,
  events: eventsAPI,
  'gift-shops': giftShopsAPI,
  facilities: facilitiesAPI,
  'park-zones': parkZonesAPI,
  tickets: ticketsAPI,
};

const fieldConfig = {
  rides: {
    title: 'Ride',
    displayFields: [
      { key: 'zone', label: 'Zone' },
      { key: 'wait_time', label: 'Wait Time', suffix: ' min' },
      { key: 'status', label: 'Status' },
      { key: 'thrill_level', label: 'Thrill Level' },
      { key: 'min_height', label: 'Min Height', suffix: ' cm' },
      { key: 'duration', label: 'Duration' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
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
    title: 'Show',
    displayFields: [
      { key: 'zone', label: 'Zone' },
      { key: 'show_times', label: 'Show Times' },
      { key: 'duration', label: 'Duration' },
      { key: 'venue', label: 'Venue' },
      { key: 'capacity', label: 'Capacity' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'show_times', label: 'Show Times', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'venue', label: 'Venue', type: 'text' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
    ],
  },
  restaurants: {
    title: 'Restaurant',
    displayFields: [
      { key: 'zone', label: 'Zone' },
      { key: 'cuisine_type', label: 'Cuisine' },
      { key: 'price_range', label: 'Price Range' },
      { key: 'hours', label: 'Hours' },
      { key: 'seating_capacity', label: 'Seating Capacity' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'cuisine_type', label: 'Cuisine Type', type: 'text' },
      { key: 'price_range', label: 'Price Range', type: 'select', options: ['$', '$$', '$$$', '$$$$'] },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'seating_capacity', label: 'Seating Capacity', type: 'number' },
    ],
  },
  attractions: {
    title: 'Attraction',
    displayFields: [
      { key: 'zone', label: 'Zone' },
      { key: 'type', label: 'Type' },
      { key: 'age_group', label: 'Age Group' },
      { key: 'duration', label: 'Duration' },
      { key: 'capacity', label: 'Capacity' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'age_group', label: 'Age Group', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'capacity', label: 'Capacity', type: 'number' },
    ],
  },
  events: {
    title: 'Event',
    displayFields: [
      { key: 'zone', label: 'Zone' },
      { key: 'event_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
      { key: 'start_time', label: 'Start Time' },
      { key: 'end_time', label: 'End Time' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'event_type', label: 'Type' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
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
    title: 'Gift Shop',
    displayFields: [
      { key: 'zone', label: 'Zone' },
      { key: 'specialty', label: 'Specialty' },
      { key: 'hours', label: 'Hours' },
      { key: 'price_range', label: 'Price Range' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'specialty', label: 'Specialty', type: 'text' },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'price_range', label: 'Price Range', type: 'select', options: ['$', '$$', '$$$'] },
    ],
  },
  facilities: {
    title: 'Facility',
    displayFields: [
      { key: 'zone', label: 'Zone' },
      { key: 'facility_type', label: 'Type' },
      { key: 'hours', label: 'Hours' },
      { key: 'accessibility', label: 'Accessible', render: (v) => v ? 'Yes' : 'No' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'facility_type', label: 'Facility Type', type: 'text' },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'accessibility', label: 'Accessible', type: 'select', options: ['true', 'false'] },
    ],
  },
  'park-zones': {
    title: 'Park Zone',
    displayFields: [
      { key: 'theme', label: 'Theme' },
      { key: 'hours', label: 'Hours' },
      { key: 'highlights', label: 'Highlights' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'theme', label: 'Theme', type: 'text' },
      { key: 'hours', label: 'Hours', type: 'text' },
      { key: 'highlights', label: 'Highlights', type: 'textarea' },
    ],
  },
  tickets: {
    title: 'Ticket',
    displayFields: [
      { key: 'price', label: 'Price', render: (v) => `$${parseFloat(v).toFixed(2)}` },
      { key: 'ticket_type', label: 'Type' },
      { key: 'valid_days', label: 'Valid Days' },
      { key: 'includes', label: 'Includes' },
    ],
    editFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'ticket_type', label: 'Type', type: 'text' },
      { key: 'valid_days', label: 'Valid Days', type: 'number' },
      { key: 'includes', label: 'Includes', type: 'textarea' },
    ],
  },
};

function FeatureDetail({ feature }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const api = apiMap[feature];
  const config = fieldConfig[feature];
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getById(id);
      setItem(res.data);
    } catch (err) {
      console.error('Failed to load item:', err);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = () => {
    const data = {};
    config.editFields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'date' && val) {
        val = val.substring(0, 10);
      }
      data[f.key] = val !== null && val !== undefined ? String(val) : '';
    });
    setFormData(data);
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.update(id, formData);
      setEditing(false);
      loadData();
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(id);
      navigate(`/${feature}`);
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div> Loading...</div>;
  }

  if (!item) {
    return <div className="loading">Item not found</div>;
  }

  return (
    <div className="detail-page">
      <button className="btn-back" onClick={() => navigate(`/${feature}`)} style={{ marginBottom: 20 }}>
        ← Back to {config.title}s
      </button>

      <div className="detail-card">
        <div className="detail-header">
          <h1>{item.name}</h1>
          {item.zone && <span className="zone-tag">{item.zone}</span>}
        </div>

        <div className="detail-body">
          {item.description && (
            <div className="detail-description">{item.description}</div>
          )}

          <div className="detail-grid">
            {config.displayFields.map(field => (
              <div className="detail-field" key={field.key}>
                <label>{field.label}</label>
                <span>
                  {field.render
                    ? field.render(item[field.key])
                    : `${item[field.key] || '-'}${field.suffix || ''}`
                  }
                </span>
              </div>
            ))}
          </div>

          <div className="detail-actions">
            <button className="btn-edit" onClick={handleEdit}>Edit {config.title}</button>
            <button className="btn-delete" onClick={() => setShowConfirm(true)}>Delete {config.title}</button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit {config.title}</h2>
            <form onSubmit={handleSave}>
              {config.editFields.map(field => (
                <div className="form-group" key={field.key}>
                  <label>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
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
                      step={field.type === 'number' ? 'any' : undefined}
                    />
                  )}
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Delete {config.title}?</h3>
            <p>Are you sure you want to delete "{item.name}"? This action cannot be undone.</p>
            <div className="actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-delete" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeatureDetail;
