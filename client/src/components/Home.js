import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = ({ user, onLogout }) => {
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = useCallback(async () => {
    setError('');
    setLoading(true);
    
    try {
      // Add username to request if available
      const requestData = {
        username: user?.username || 'Guest'
      };
      
      // Use standard fetch API instead of axios for better debugging
      const response = await fetch('/api/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      navigate(`/game/${data.room_code}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.message || 'Failed to create room!');
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  const handleJoinRoom = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!roomCode || roomCode.length !== 6) {
        throw new Error('Enter a valid 6-digit room code, you blind fuck!');
      }
      
      // Room validity will be checked on the Game component
      navigate(`/game/${roomCode}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [roomCode, navigate]);

  const handlePlayAI = useCallback(() => {
    navigate('/ai-game');
  }, [navigate]);

  return (
    <div className="container">
      <h1 className="title">Welcome to the Shitshow{user ? `, ${user.username}` : ''}!</h1>
      
      <div className="menu">
        <button 
          className="button" 
          onClick={handleCreateRoom}
          disabled={loading}
        >
          Create Room
        </button>
        
        <button 
          className="button purple" 
          onClick={() => setShowJoinRoom(prev => !prev)}
          disabled={loading}
        >
          {showJoinRoom ? 'Hide Join Form' : 'Join Room'}
        </button>
        
        {showJoinRoom && (
          <form onSubmit={handleJoinRoom} style={{ width: '100%' }}>
            <div className="form-control">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.slice(0, 6))}
                placeholder="Enter 6-digit room code"
                maxLength={6}
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="button"
              disabled={loading}
            >
              Join This Room
            </button>
          </form>
        )}
        
        <button 
          className="button" 
          onClick={handlePlayAI}
          disabled={loading}
        >
          Play vs AI
        </button>
        
        <button 
          className="button purple" 
          onClick={onLogout}
          disabled={loading}
          style={{ marginTop: '20px' }}
        >
          Logout
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default React.memo(Home); 