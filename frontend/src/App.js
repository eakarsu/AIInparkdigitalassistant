import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeatureList from './pages/FeatureList';
import FeatureDetail from './pages/FeatureDetail';
import AIAssistant from './pages/AIAssistant';
import Navbar from './components/Navbar';

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
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
