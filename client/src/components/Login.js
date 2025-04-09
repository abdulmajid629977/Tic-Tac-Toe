import React, { useState, useCallback } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        throw new Error('Both username and password are required, asshole!');
      }

      const endpoint = isLogin ? '/api/login' : '/api/register';
      const response = await axios.post(endpoint, { username, password });
      
      onLogin({
        id: response.data.user_id,
        username
      });
      
    } catch (error) {
      let errorMessage = error.response?.data?.error || error.message || 'Failed to authenticate!';
      setError(errorMessage);
      
      // Shake effect on error
      const container = document.querySelector('.container');
      container.classList.add('shake');
      setTimeout(() => {
        container.classList.remove('shake');
      }, 500);
      
    } finally {
      setLoading(false);
    }
  }, [isLogin, username, password, onLogin]);

  return (
    <div className="container">
      <h1 className="title">Tic Tac Toe Shitshow v1</h1>
      
      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px' }}>
        <div className="form-control">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username, prick"
            disabled={loading}
          />
        </div>
        
        <div className="form-control">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password, asshole"
            disabled={loading}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="button"
          disabled={loading}
        >
          {isLogin ? 'Login, Asshole' : 'Sign Up, You Prick'}
        </button>
        
        <button 
          type="button" 
          className="button purple"
          onClick={() => setIsLogin(!isLogin)}
          disabled={loading}
        >
          {isLogin ? 'Need an account? Sign up!' : 'Have an account? Login!'}
        </button>
      </form>
    </div>
  );
};

export default React.memo(Login); 