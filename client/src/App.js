import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Lazy-loaded components for optimization
const Login = lazy(() => import('./components/Login'));
const Home = lazy(() => import('./components/Home'));
const Game = lazy(() => import('./components/Game'));
const AIGame = lazy(() => import('./components/AIGame'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkLoginStatus = async () => {
      try {
        const token = localStorage.getItem('user');
        if (token) {
          setUser(JSON.parse(token));
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/home');
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ justifyContent: 'center', minHeight: '100vh' }}>
        <h1 className="title">Loading the Chaos...</h1>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="container"><h1 className="title">Loading...</h1></div>}>
      <Routes>
        <Route 
          path="/" 
          element={user ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/home" 
          element={<Home user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/game/:roomCode" 
          element={<Game user={user} onLogout={handleLogout} />} 
        />
        <Route 
          path="/ai-game" 
          element={<AIGame user={user} onLogout={handleLogout} />} 
        />
      </Routes>
    </Suspense>
  );
}

export default App; 