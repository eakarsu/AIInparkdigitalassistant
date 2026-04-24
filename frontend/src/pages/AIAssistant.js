import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI } from '../services/api';

function AIAssistant() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to Adventure Kingdom! I\'m your AI Park Assistant. Ask me about rides, shows, restaurants, or let me help you plan your perfect day!', meta: null }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Recommendation form states
  const [ridePrefs, setRidePrefs] = useState('');
  const [itineraryDuration, setItineraryDuration] = useState('full day');
  const [itineraryInterests, setItineraryInterests] = useState('');
  const [itineraryGroup, setItineraryGroup] = useState('family');
  const [diningCuisine, setDiningCuisine] = useState('');
  const [diningBudget, setDiningBudget] = useState('moderate');
  const [diningDietary, setDiningDietary] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatAIContent = (text) => {
    if (!text) return '';
    // Convert markdown-like formatting to styled HTML
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/#{3}\s(.+)/g, '<h4 style="color:#f0c040;margin:12px 0 6px;">$1</h4>')
      .replace(/#{2}\s(.+)/g, '<h3 style="color:#f0c040;margin:14px 0 8px;">$1</h3>')
      .replace(/#{1}\s(.+)/g, '<h3 style="color:#f0c040;margin:16px 0 8px;">$1</h3>')
      .replace(/^[-•]\s(.+)/gm, '<div style="padding-left:16px;margin:4px 0;">• $1</div>')
      .replace(/^\d+\.\s(.+)/gm, '<div style="padding-left:16px;margin:4px 0;">$&</div>')
      .replace(/⏰|🎢|🍽️|🎭|⭐|🌟|💡|🎉|🎪|🗺️|🎟️|🛍️|🏥|🤖/g, '<span style="font-size:1.1em;">$&</span>');
    return formatted;
  };

  const addMessage = (role, content, meta = null) => {
    setMessages(prev => [...prev, { role, content, meta }]);
  };

  const handleChat = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    addMessage('user', userMsg);
    setLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));
      const res = await aiAPI.chat({ message: userMsg, history });
      addMessage('assistant', res.data.message, {
        model: res.data.model,
        usage: res.data.usage
      });
    } catch (err) {
      addMessage('assistant', 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const handleRideRecommend = async () => {
    if (loading) return;
    setLoading(true);
    addMessage('user', `Recommend rides for me: ${ridePrefs || 'best experience with shortest waits'}`);

    try {
      const res = await aiAPI.recommendRides({ preferences: ridePrefs });
      addMessage('assistant', res.data.recommendations, {
        model: res.data.model,
        usage: res.data.usage
      });
    } catch (err) {
      addMessage('assistant', 'Sorry, I couldn\'t generate ride recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleItinerary = async () => {
    if (loading) return;
    setLoading(true);
    addMessage('user', `Plan my day: ${itineraryDuration}, interests: ${itineraryInterests || 'everything'}, group: ${itineraryGroup}`);

    try {
      const res = await aiAPI.planItinerary({
        duration: itineraryDuration,
        interests: itineraryInterests,
        group_type: itineraryGroup
      });
      addMessage('assistant', res.data.itinerary, {
        model: res.data.model,
        usage: res.data.usage
      });
    } catch (err) {
      addMessage('assistant', 'Sorry, I couldn\'t generate your itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiningRecommend = async () => {
    if (loading) return;
    setLoading(true);
    addMessage('user', `Find dining: cuisine: ${diningCuisine || 'any'}, budget: ${diningBudget}, dietary: ${diningDietary || 'none'}`);

    try {
      const res = await aiAPI.recommendDining({
        cuisine_preference: diningCuisine,
        budget: diningBudget,
        dietary: diningDietary
      });
      addMessage('assistant', res.data.dining, {
        model: res.data.model,
        usage: res.data.usage
      });
    } catch (err) {
      addMessage('assistant', 'Sorry, I couldn\'t generate dining recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat();
    }
  };

  return (
    <div className="ai-page">
      <button className="btn-back" onClick={() => navigate('/')} style={{ marginBottom: 20 }}>
        ← Back to Dashboard
      </button>

      <div className="ai-container">
        <div className="ai-header">
          <h2>🤖 AI Park Assistant</h2>
          <div className="ai-tabs">
            <button className={`ai-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
            <button className={`ai-tab ${activeTab === 'rides' ? 'active' : ''}`} onClick={() => setActiveTab('rides')}>Ride Picks</button>
            <button className={`ai-tab ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}>Day Planner</button>
            <button className={`ai-tab ${activeTab === 'dining' ? 'active' : ''}`} onClick={() => setActiveTab('dining')}>Dining</button>
          </div>
        </div>

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
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              Thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {activeTab === 'chat' && (
          <div className="ai-input-area">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about rides, shows, dining, or anything else..."
              disabled={loading}
            />
            <button className="btn-send" onClick={handleChat} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        )}

        {activeTab === 'rides' && (
          <div className="ai-input-area" style={{ flexDirection: 'column', gap: 12 }}>
            <input
              value={ridePrefs}
              onChange={e => setRidePrefs(e.target.value)}
              placeholder="Describe your preferences (e.g., 'thrill seeker, no water rides')"
              disabled={loading}
            />
            <button className="btn-send" onClick={handleRideRecommend} disabled={loading} style={{ alignSelf: 'flex-end' }}>
              Get Ride Recommendations
            </button>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="ai-input-area" style={{ flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%' }}>
              <select
                value={itineraryDuration}
                onChange={e => setItineraryDuration(e.target.value)}
                style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              >
                <option value="half day morning">Half Day (AM)</option>
                <option value="half day afternoon">Half Day (PM)</option>
                <option value="full day">Full Day</option>
                <option value="two days">Two Days</option>
              </select>
              <input
                value={itineraryInterests}
                onChange={e => setItineraryInterests(e.target.value)}
                placeholder="Interests (e.g., thrills, shows)"
                style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
              <select
                value={itineraryGroup}
                onChange={e => setItineraryGroup(e.target.value)}
                style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              >
                <option value="solo">Solo</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="group of friends">Friends</option>
              </select>
            </div>
            <button className="btn-send" onClick={handleItinerary} disabled={loading} style={{ alignSelf: 'flex-end' }}>
              Plan My Day
            </button>
          </div>
        )}

        {activeTab === 'dining' && (
          <div className="ai-input-area" style={{ flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%' }}>
              <input
                value={diningCuisine}
                onChange={e => setDiningCuisine(e.target.value)}
                placeholder="Cuisine preference"
                style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
              <select
                value={diningBudget}
                onChange={e => setDiningBudget(e.target.value)}
                style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              >
                <option value="budget">Budget ($)</option>
                <option value="moderate">Moderate ($$)</option>
                <option value="premium">Premium ($$$)</option>
                <option value="luxury">Luxury ($$$$)</option>
              </select>
              <input
                value={diningDietary}
                onChange={e => setDiningDietary(e.target.value)}
                placeholder="Dietary needs (optional)"
                style={{ padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
            </div>
            <button className="btn-send" onClick={handleDiningRecommend} disabled={loading} style={{ alignSelf: 'flex-end' }}>
              Get Dining Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIAssistant;
