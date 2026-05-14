import React from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <span className="icon">🏰</span>
        Adventure Kingdom
      </div>
      <div className="navbar-right">
        <button
          type="button"
          onClick={() => navigate('/advanced-ai')}
          style={{ background: '#a855f7', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, marginRight: 12, cursor: 'pointer', fontWeight: 600 }}
        >
          🤖 Advanced AI
        </button>
        <span className="navbar-user">Welcome, {user?.name || 'Guest'}</span>
        <button className="btn-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </nav>
  );
}

export default Navbar;
