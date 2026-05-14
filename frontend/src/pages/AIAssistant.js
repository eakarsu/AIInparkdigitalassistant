import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, guestsAPI } from '../services/api';

const SESSION_KEY = 'park_chat_session_id';
const RIDE_TYPE_OPTIONS = ['thrill', 'family', 'water', 'roller_coaster', 'dark_ride', 'gentle'];

function RateLimitError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
      padding: '12px 16px', color: '#b91c1c', fontWeight: 500, margin: '8px 0'
    }}>
      {message}
    </div>
  );
}

function AIAssistant() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to Adventure Kingdom! I\'m your AI Park Assistant. Ask me about rides, shows, restaurants, or let me help you plan your perfect day!', meta: null }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_KEY) || null);
  const messagesEndRef = useRef(null);

  // Recommendation form states
  const [ridePrefs, setRidePrefs] = useState('');
  const [itineraryDuration, setItineraryDuration] = useState('full day');
  const [itineraryInterests, setItineraryInterests] = useState('');
  const [itineraryGroup, setItineraryGroup] = useState('family');
  const [diningCuisine, setDiningCuisine] = useState('');
  const [diningBudget, setDiningBudget] = useState('moderate');
  const [diningDietary, setDiningDietary] = useState('');

  // Plan builder states
  const [planDuration, setPlanDuration] = useState(8);
  const [planGroup, setPlanGroup] = useState('family');
  const [planInterests, setPlanInterests] = useState('');
  const [builtPlan, setBuiltPlan] = useState(null);

  // Guest preferences states
  const [prefs, setPrefs] = useState({ favorite_ride_types: [], dietary_restrictions: [], group_size: '', mobility_needs: '' });
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [dietaryInput, setDietaryInput] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load session history on mount
  useEffect(() => {
    const storedSid = localStorage.getItem(SESSION_KEY);
    if (storedSid) {
      aiAPI.getSession(storedSid).then(res => {
        const hist = res.data?.messages || [];
        if (hist.length > 0) {
          setMessages(hist.map(m => ({ role: m.role, content: m.content, meta: null })));
        }
      }).catch(() => {});
    }
  }, []);

  // Load preferences on mount
  useEffect(() => {
    guestsAPI.getPreferences().then(res => {
      if (res.data) {
        setPrefs({
          favorite_ride_types: res.data.favorite_ride_types || [],
          dietary_restrictions: res.data.dietary_restrictions || [],
          group_size: res.data.group_size || '',
          mobility_needs: res.data.mobility_needs || '',
        });
      }
    }).catch(() => {});
  }, []);

  const clearRateLimit = () => setRateLimitError('');

  const formatAIContent = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/#{3}\s(.+)/g, '<h4 style="color:#f0c040;margin:12px 0 6px;">$1</h4>')
      .replace(/#{2}\s(.+)/g, '<h3 style="color:#f0c040;margin:14px 0 8px;">$1</h3>')
      .replace(/#{1}\s(.+)/g, '<h3 style="color:#f0c040;margin:16px 0 8px;">$1</h3>')
      .replace(/^[-•]\s(.+)/gm, '<div style="padding-left:16px;margin:4px 0;">• $1</div>')
      .replace(/^\d+\.\s(.+)/gm, '<div style="padding-left:16px;margin:4px 0;">$&</div>');
  };

  const addMessage = (role, content, meta = null) => {
    setMessages(prev => [...prev, { role, content, meta }]);
  };

  const handleChat = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    clearRateLimit();
    addMessage('user', userMsg);
    setLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat({ message: userMsg, history, session_id: sessionId });
      const newSid = res.data.session_id;
      if (newSid && newSid !== sessionId) {
        setSessionId(newSid);
        localStorage.setItem(SESSION_KEY, newSid);
      }
      addMessage('assistant', res.data.message, { model: res.data.model, usage: res.data.usage });
    } catch (err) {
      if (err.isRateLimit) {
        setRateLimitError(err.rateLimitMessage);
      } else {
        addMessage('assistant', 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRideRecommend = async () => {
    if (loading) return;
    clearRateLimit();
    setLoading(true);
    addMessage('user', `Recommend rides for me: ${ridePrefs || 'best experience with shortest waits'}`);
    try {
      const res = await aiAPI.recommendRides({ preferences: ridePrefs });
      addMessage('assistant', res.data.recommendations, { model: res.data.model, usage: res.data.usage });
    } catch (err) {
      if (err.isRateLimit) setRateLimitError(err.rateLimitMessage);
      else addMessage('assistant', 'Sorry, I couldn\'t generate ride recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleItinerary = async () => {
    if (loading) return;
    clearRateLimit();
    setLoading(true);
    addMessage('user', `Plan my day: ${itineraryDuration}, interests: ${itineraryInterests || 'everything'}, group: ${itineraryGroup}`);
    try {
      const res = await aiAPI.planItinerary({ duration: itineraryDuration, interests: itineraryInterests, group_type: itineraryGroup });
      addMessage('assistant', res.data.itinerary, { model: res.data.model, usage: res.data.usage });
    } catch (err) {
      if (err.isRateLimit) setRateLimitError(err.rateLimitMessage);
      else addMessage('assistant', 'Sorry, I couldn\'t generate your itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiningRecommend = async () => {
    if (loading) return;
    clearRateLimit();
    setLoading(true);
    addMessage('user', `Find dining: cuisine: ${diningCuisine || 'any'}, budget: ${diningBudget}, dietary: ${diningDietary || 'none'}`);
    try {
      const res = await aiAPI.recommendDining({ cuisine_preference: diningCuisine, budget: diningBudget, dietary: diningDietary });
      addMessage('assistant', res.data.dining, { model: res.data.model, usage: res.data.usage });
    } catch (err) {
      if (err.isRateLimit) setRateLimitError(err.rateLimitMessage);
      else addMessage('assistant', 'Sorry, I couldn\'t generate dining recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildPlan = async () => {
    if (loading) return;
    clearRateLimit();
    setLoading(true);
    setBuiltPlan(null);
    try {
      const res = await aiAPI.buildPlan({ session_id: sessionId, duration_hours: planDuration, group_type: planGroup, interests: planInterests });
      setBuiltPlan(res.data.plan);
    } catch (err) {
      if (err.isRateLimit) setRateLimitError(err.rateLimitMessage);
      else setRateLimitError('Failed to build plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrefs = async () => {
    setPrefsLoading(true);
    try {
      await guestsAPI.savePreferences({
        favorite_ride_types: prefs.favorite_ride_types,
        dietary_restrictions: prefs.dietary_restrictions,
        group_size: prefs.group_size ? parseInt(prefs.group_size) : null,
        mobility_needs: prefs.mobility_needs,
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setPrefsLoading(false);
    }
  };

  const toggleRideType = (type) => {
    setPrefs(p => ({
      ...p,
      favorite_ride_types: p.favorite_ride_types.includes(type)
        ? p.favorite_ride_types.filter(t => t !== type)
        : [...p.favorite_ride_types, type]
    }));
  };

  const addDietary = () => {
    const val = dietaryInput.trim();
    if (val && !prefs.dietary_restrictions.includes(val)) {
      setPrefs(p => ({ ...p, dietary_restrictions: [...p.dietary_restrictions, val] }));
    }
    setDietaryInput('');
  };

  const removeDietary = (item) => {
    setPrefs(p => ({ ...p, dietary_restrictions: p.dietary_restrictions.filter(d => d !== item) }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMessages([{ role: 'assistant', content: 'Welcome to Adventure Kingdom! I\'m your AI Park Assistant. Ask me about rides, shows, restaurants, or let me help you plan your perfect day!', meta: null }]);
  };

  const inputStyle = { padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' };

  return (
    <div className="ai-page">
      <button className="btn-back" onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        Back to Dashboard
      </button>

      <div className="ai-container">
        <div className="ai-header">
          <h2>AI Park Assistant</h2>
          <div className="ai-tabs">
            <button className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
            <button className={`ai-tab ${activeTab === 'rides' ? 'active' : ''}`} onClick={() => setActiveTab('rides')}>Ride Picks</button>
            <button className={`ai-tab ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}>Day Planner</button>
            <button className={`ai-tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>Build My Plan</button>
            <button className={`ai-tab ${activeTab === 'dining' ? 'active' : ''}`} onClick={() => setActiveTab('dining')}>Dining</button>
            <button className={`ai-tab ${activeTab === 'prefs' ? 'active' : ''}`} onClick={() => setActiveTab('prefs')}>My Preferences</button>
          </div>
        </div>

        <RateLimitError message={rateLimitError} />

        <div className="ai-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`ai-message ${msg.role}`}>
              {msg.role === 'assistant' ? (
                <div className="ai-content" dangerouslySetInnerHTML={{ __html: formatAIContent(msg.content) }} />
              ) : (
                <div className="ai-content">{msg.content}</div>
              )}
              {msg.meta && (
                <div className="ai-meta">
                  {msg.meta.model && <span>Model: {msg.meta.model}</span>}
                  {msg.meta.usage && (
                    <>
                      <span>Tokens In: {msg.meta.usage.prompt_tokens}</span>
                      <span>Tokens Out: {msg.meta.usage.completion_tokens}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="ai-loading">
              <div className="dots">
                <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              </div>
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {activeTab === 'chat' && (
          <div className="ai-input-area" style={{ flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about rides, shows, dining, or anything else..."
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button className="btn-send" onClick={handleChat} disabled={loading || !input.trim()}>Send</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {sessionId && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Session: {sessionId.slice(0, 20)}...</span>}
              <button onClick={clearSession} style={{ fontSize: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>
                Clear conversation
              </button>
            </div>
          </div>
        )}

        {activeTab === 'rides' && (
          <div className="ai-input-area" style={{ flexDirection: 'column', gap: 12 }}>
            <input value={ridePrefs} onChange={e => setRidePrefs(e.target.value)} placeholder="Describe your preferences (e.g., 'thrill seeker, no water rides')" disabled={loading} />
            <button className="btn-send" onClick={handleRideRecommend} disabled={loading} style={{ alignSelf: 'flex-end' }}>Get Ride Recommendations</button>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="ai-input-area" style={{ flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%' }}>
              <select value={itineraryDuration} onChange={e => setItineraryDuration(e.target.value)} style={inputStyle}>
                <option value="half day morning">Half Day (AM)</option>
                <option value="half day afternoon">Half Day (PM)</option>
                <option value="full day">Full Day</option>
                <option value="two days">Two Days</option>
              </select>
              <input value={itineraryInterests} onChange={e => setItineraryInterests(e.target.value)} placeholder="Interests (e.g., thrills, shows)" style={inputStyle} />
              <select value={itineraryGroup} onChange={e => setItineraryGroup(e.target.value)} style={inputStyle}>
                <option value="solo">Solo</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="group of friends">Friends</option>
              </select>
            </div>
            <button className="btn-send" onClick={handleItinerary} disabled={loading} style={{ alignSelf: 'flex-end' }}>Plan My Day</button>
          </div>
        )}

        {activeTab === 'plan' && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Duration (hours)</label>
                <input type="number" value={planDuration} min={2} max={16} onChange={e => setPlanDuration(Number(e.target.value))} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Group Type</label>
                <select value={planGroup} onChange={e => setPlanGroup(e.target.value)} style={inputStyle}>
                  <option value="solo">Solo</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family with Kids</option>
                  <option value="group of friends">Friends</option>
                  <option value="seniors">Seniors</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Interests</label>
                <input value={planInterests} onChange={e => setPlanInterests(e.target.value)} placeholder="e.g., thrills, shows, dining" style={inputStyle} />
              </div>
            </div>
            <button className="btn-send" onClick={handleBuildPlan} disabled={loading}>
              {loading ? 'Building Plan...' : 'Build My Plan'}
            </button>

            {builtPlan && !builtPlan.raw && (
              <div style={{ marginTop: 20 }}>
                {/* Morning */}
                {builtPlan.morning_activities?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ color: '#f0c040', marginBottom: 8 }}>Morning</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {builtPlan.morning_activities.map((act, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ background: '#2563eb', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 12, whiteSpace: 'nowrap' }}>{act.time || 'Morning'}</span>
                          <div>
                            <strong>{act.name}</strong>
                            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{act.type}</span>
                            {act.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{act.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Afternoon */}
                {builtPlan.afternoon_activities?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ color: '#f0c040', marginBottom: 8 }}>Afternoon</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {builtPlan.afternoon_activities.map((act, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{ background: '#7c3aed', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 12, whiteSpace: 'nowrap' }}>{act.time || 'Afternoon'}</span>
                          <div>
                            <strong>{act.name}</strong>
                            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{act.type}</span>
                            {act.notes && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{act.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Dining */}
                {builtPlan.dining?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ color: '#f0c040', marginBottom: 8 }}>Dining</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {builtPlan.dining.map((d, i) => (
                        <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', minWidth: 160 }}>
                          <div style={{ fontWeight: 600 }}>{d.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.time} {d.cuisine ? `• ${d.cuisine}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Tips */}
                {builtPlan.tips?.length > 0 && (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16 }}>
                    <h4 style={{ color: '#f0c040', margin: '0 0 8px' }}>Tips</h4>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {builtPlan.tips.map((tip, i) => <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>{tip}</li>)}
                    </ul>
                  </div>
                )}
                {builtPlan.estimated_wait_total_minutes !== undefined && (
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                    Estimated total wait time: {builtPlan.estimated_wait_total_minutes} minutes
                  </div>
                )}
              </div>
            )}
            {builtPlan?.raw && (
              <div style={{ marginTop: 16, background: 'var(--bg-card)', borderRadius: 8, padding: 16, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                {builtPlan.raw}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dining' && (
          <div className="ai-input-area" style={{ flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%' }}>
              <input value={diningCuisine} onChange={e => setDiningCuisine(e.target.value)} placeholder="Cuisine preference" style={inputStyle} />
              <select value={diningBudget} onChange={e => setDiningBudget(e.target.value)} style={inputStyle}>
                <option value="budget">Budget ($)</option>
                <option value="moderate">Moderate ($$)</option>
                <option value="premium">Premium ($$$)</option>
                <option value="luxury">Luxury ($$$$)</option>
              </select>
              <input value={diningDietary} onChange={e => setDiningDietary(e.target.value)} placeholder="Dietary needs (optional)" style={inputStyle} />
            </div>
            <button className="btn-send" onClick={handleDiningRecommend} disabled={loading} style={{ alignSelf: 'flex-end' }}>Get Dining Recommendations</button>
          </div>
        )}

        {activeTab === 'prefs' && (
          <div style={{ padding: '16px 0' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 16 }}>My Preferences</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Favorite Ride Types</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {RIDE_TYPE_OPTIONS.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleRideType(type)}
                    style={{
                      padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border-color)',
                      background: prefs.favorite_ride_types.includes(type) ? '#2563eb' : 'var(--bg-input)',
                      color: prefs.favorite_ride_types.includes(type) ? '#fff' : 'var(--text-primary)',
                      cursor: 'pointer', fontSize: 14, fontWeight: 500
                    }}
                  >
                    {type.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Dietary Restrictions</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  value={dietaryInput}
                  onChange={e => setDietaryInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDietary(); } }}
                  placeholder="e.g. vegetarian, gluten-free"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addDietary} className="btn-send" style={{ padding: '8px 16px' }}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {prefs.dietary_restrictions.map(item => (
                  <span key={item} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item}
                    <button onClick={() => removeDietary(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 700, padding: 0 }}>x</button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Group Size</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={prefs.group_size}
                  onChange={e => setPrefs(p => ({ ...p, group_size: e.target.value }))}
                  placeholder="Number of people"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Mobility Needs</label>
                <input
                  value={prefs.mobility_needs}
                  onChange={e => setPrefs(p => ({ ...p, mobility_needs: e.target.value }))}
                  placeholder="e.g. wheelchair accessible"
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              className="btn-send"
              onClick={handleSavePrefs}
              disabled={prefsLoading}
              style={{ padding: '10px 24px' }}
            >
              {prefsLoading ? 'Saving...' : prefsSaved ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAssistant;
