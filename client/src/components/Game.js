import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const Game = ({ user, onLogout }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [message, setMessage] = useState("Connecting to the chaos...");
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
  
  // Handle socket events
  useEffect(() => {
    if (!socket || !user) return;
    
    socket.on('connect', () => {
      // Include username if available from user prop
      if (user && user.username) {
        socket.emit('join_room', { 
          room_code: roomCode,
          username: user.username
        });
      } else {
        // Fall back to a default username if no user object
        socket.emit('join_room', { 
          room_code: roomCode,
          username: 'Guest' 
        });
      }
    });
    
    socket.on('error', (data) => {
      setError(data.message);
      setMessage("Error joined the room");
      
      // Auto navigate back after error
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    });
    
    socket.on('room_joined', (data) => {
      setGameState(data.game_state);
      setPlayerSymbol(data.player_symbol);
      
      // Update the message based on the game status
      if (data.game_state.status === 'waiting') {
        setMessage(`You joined as ${data.player_symbol}. Waiting for another player...`);
      } else {
        setMessage(`You joined as ${data.player_symbol}. ${data.game_state.current_turn}'s turn!`);
      }
    });
    
    socket.on('player_joined', (data) => {
      setGameState(data.game_state);
      
      // Use the status message if provided, otherwise create one
      if (data.status_message) {
        setMessage(`${data.username} joined as ${data.player_symbol}. ${data.status_message}`);
      } else {
        setMessage(`${data.username} joined as ${data.player_symbol}. ${data.game_state.current_turn}'s turn!`);
      }
    });
    
    socket.on('player_left', (data) => {
      setGameState(data.game_state);
      setMessage(data.message);
      
      // Add shake animation to indicate something happened
      const statusElement = document.querySelector('.game-status');
      if (statusElement) {
        statusElement.classList.add('shake');
        setTimeout(() => {
          statusElement.classList.remove('shake');
        }, 500);
      }
    });
    
    socket.on('move_made', (data) => {
      setGameState(data.game_state);
      
      const nextPlayer = data.next_turn === playerSymbol ? 'Your' : `${data.game_state.players[data.next_turn].username}'s`;
      setMessage(`${nextPlayer} turn, ${data.next_turn === playerSymbol ? 'asshole' : 'waitin\' on that dumb fuck'}!`);
      
      // Add shake animation to status message
      const statusElement = document.querySelector('.game-status');
      statusElement.classList.add('shake');
      setTimeout(() => {
        statusElement.classList.remove('shake');
      }, 500);
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
      setMessage(`Game reset! ${data.game_state.current_turn}'s turn!`);
    });
    
    return () => {
      socket.off('connect');
      socket.off('error');
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('move_made');
      socket.off('game_over');
      socket.off('game_reset');
    };
  }, [socket, user, playerSymbol, roomCode, navigate]);
  
  const handleCellClick = useCallback((index) => {
    if (!socket || !gameState || !playerSymbol) return;
    
    // Check if it's player's turn and cell is empty
    if (gameState.current_turn !== playerSymbol || gameState.board[index] !== null || gameState.status !== 'playing') {
      return;
    }
    
    socket.emit('make_move', {
      room_code: roomCode,
      cell_index: index,
      player_symbol: playerSymbol
    });
  }, [socket, gameState, playerSymbol, roomCode]);
  
  const handleResetGame = useCallback(() => {
    if (!socket) return;
    
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
      
      <h1 className="title">Tic Tac Toe Shitshow</h1>
      
      <div className="room-code">
        Room: {roomCode}
      </div>
      
      <div className={`game-status ${message.includes('turn') ? 'shake' : ''}`}>
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

export default React.memo(Game); 