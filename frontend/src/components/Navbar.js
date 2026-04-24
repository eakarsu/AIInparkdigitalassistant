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
        <span className="navbar-user">Welcome, {user?.name || 'Guest'}</span>
        <button className="btn-logout" onClick={onLogout}>Sign Out</button>
      </div>
    </nav>
  );
}

export default Navbar;
