import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const AIGame = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [message, setMessage] = useState("Starting AI game...");
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [error, setError] = useState('');
  
  // Setup socket connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Start AI game on connect
  useEffect(() => {
    if (!socket || !user) return;
    
    socket.on('connect', () => {
      // Include username if available from user prop
      if (user && user.username) {
        socket.emit('play_vs_ai', { 
          username: user.username
        });
      } else {
        // Fall back to a default username if no user object
        socket.emit('play_vs_ai', { 
          username: 'Guest' 
        });
      }
    });
    
    // Save room info for cleanup on unmount
    useEffect(() => {
      return () => {
        // Clean up when component unmounts
        if (socket && roomCode) {
          // Let the server know we're leaving the AI game
          socket.emit('leave_ai_game', { room_code: roomCode });
        }
      };
    }, [socket, roomCode]);
    
    socket.on('error', (data) => {
      setError(data.message);
      
      // Auto navigate back after error
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    });
    
    socket.on('ai_game_started', (data) => {
      setGameState(data.game_state);
      setRoomCode(data.room_code);
      setMessage(data.message);
    });
    
    socket.on('move_made', (data) => {
      setGameState(data.game_state);
      setMessage("AI is thinking...");
    });
    
    socket.on('ai_move_made', (data) => {
      setGameState(data.game_state);
      setMessage("Your move, asshole!");
      
      // Add shake animation to status message
      const statusElement = document.querySelector('.game-status');
      if (statusElement) {
        statusElement.classList.add('shake');
        setTimeout(() => {
          statusElement.classList.remove('shake');
        }, 500);
      }
    });
    
    socket.on('game_over', (data) => {
      setGameState(data.game_state);
      setMessage(data.message);
      setGameOverMessage('Game\'s over, you chaotic bastards! Thanks for the mess!');
      setShowGameOver(true);
      
      // Hide game over banner after 4 seconds
      setTimeout(() => {
        setShowGameOver(false);
      }, 4000);
    });
    
    socket.on('game_reset', (data) => {
      setGameState(data.game_state);
      setMessage("Game reset! Your move, asshole!");
    });
    
    return () => {
      socket.off('connect');
      socket.off('error');
      socket.off('ai_game_started');
      socket.off('move_made');
      socket.off('ai_move_made');
      socket.off('game_over');
      socket.off('game_reset');
    };
  }, [socket, user, navigate]);
  
  const handleCellClick = useCallback((index) => {
    if (!socket || !gameState || !roomCode) return;
    
    // Check if it's player's turn and cell is empty
    if (gameState.current_turn !== 'X' || gameState.board[index] !== null || gameState.status !== 'playing') {
      return;
    }
    
    socket.emit('make_move_vs_ai', {
      room_code: roomCode,
      cell_index: index
    });
  }, [socket, gameState, roomCode]);
  
  const handleResetGame = useCallback(() => {
    if (!socket || !roomCode) return;
    
    socket.emit('reset_game', { room_code: roomCode });
  }, [socket, roomCode]);
  
  const handleBackToHome = useCallback(() => {
    navigate('/home');
  }, [navigate]);
  
  // Memoize the board to prevent unnecessary re-renders
  const renderBoard = useMemo(() => {
    if (!gameState) return null;
    
    return (
      <div className="game-board">
        {gameState.board.map((cell, index) => (
          <div 
            key={index}
            className={`cell ${cell ? cell.toLowerCase() : ''}`}
            onClick={() => handleCellClick(index)}
          >
            {cell}
          </div>
        ))}
      </div>
    );
  }, [gameState, handleCellClick]);
  
  if (error) {
    return (
      <div className="container">
        <h1 className="title">Error</h1>
        <div className="error-message">{error}</div>
        <button className="button" onClick={handleBackToHome}>
          Back to Home
        </button>
      </div>
    );
  }
  
  return (
    <div className="container">
      {showGameOver && (
        <div className="game-over-banner">
          {gameOverMessage}
        </div>
      )}
      
      <h1 className="title">Playing vs. AI</h1>
      
      <div className="game-status">
        {message}
      </div>
      
      {renderBoard}
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          className="button" 
          onClick={handleResetGame}
          disabled={!gameState || (gameState.status !== 'winner' && gameState.status !== 'tie')}
        >
          Reset Game
        </button>
        
        <button className="button purple" onClick={handleBackToHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default React.memo(AIGame); 