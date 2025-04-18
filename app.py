from flask import Flask, request, jsonify, session, render_template, send_from_directory
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
import random
import uuid
import eventlet
import gc
import time
from functools import lru_cache

eventlet.monkey_patch()

app = Flask(__name__, static_folder='client/build', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'fuckingneonticktactoe')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///tictactoe.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_recycle': 280,
    'pool_pre_ping': True,
    'pool_size': 10,
    'max_overflow': 5
}
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet', ping_timeout=10, ping_interval=5)
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Memory cleanup interval (5 minutes)
CLEANUP_INTERVAL = 300
last_cleanup_time = time.time()

# User model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

# Game rooms in memory
active_rooms = {}

# Track client-to-room mapping for disconnect handling
client_rooms = {}

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# AI logic
def get_available_moves(board):
    return [i for i in range(9) if board[i] is None]

def check_winner(board):
    # Win patterns: rows, columns, diagonals
    patterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # columns
        [0, 4, 8], [2, 4, 6]              # diagonals
    ]
    
    for pattern in patterns:
        if board[pattern[0]] is not None and board[pattern[0]] == board[pattern[1]] == board[pattern[2]]:
            return board[pattern[0]]
    
    # Check for tie
    if None not in board:
        return "tie"
    
    return None

# Convert board to a tuple for caching (lists are not hashable)
def board_to_tuple(board):
    return tuple(0 if cell is None else (1 if cell == 'X' else 2) for cell in board)

# Cache minimax results to avoid recalculating the same positions
@lru_cache(maxsize=10000)
def cached_minimax(board_tuple, depth, is_maximizing, alpha, beta):
    # Convert tuple back to board format
    board = [None if cell == 0 else ('X' if cell == 1 else 'O') for cell in board_tuple]
    
    winner = check_winner(board)
    
    if winner == 'O':
        return 10 - depth
    elif winner == 'X':
        return depth - 10
    elif winner == 'tie':
        return 0
    
    if is_maximizing:
        best_score = -float('inf')
        for i in get_available_moves(board):
            board[i] = 'O'
            # Convert board to tuple for recursive call
            board_tuple_next = board_to_tuple(board)
            score = cached_minimax(board_tuple_next, depth + 1, False, alpha, beta)
            board[i] = None
            best_score = max(score, best_score)
            alpha = max(alpha, best_score)
            if beta <= alpha:
                break
        return best_score
    else:
        best_score = float('inf')
        for i in get_available_moves(board):
            board[i] = 'X'
            # Convert board to tuple for recursive call
            board_tuple_next = board_to_tuple(board)
            score = cached_minimax(board_tuple_next, depth + 1, True, alpha, beta)
            board[i] = None
            best_score = min(score, best_score)
            beta = min(beta, best_score)
            if beta <= alpha:
                break
        return best_score

# Wrapper function to call cached minimax
def minimax(board, depth, is_maximizing, alpha=-float('inf'), beta=float('inf')):
    board_tuple = board_to_tuple(board)
    return cached_minimax(board_tuple, depth, is_maximizing, alpha, beta)

def get_ai_move(board):
    # 50% chance for random move (less resource intensive)
    if random.random() < 0.5:
        available_moves = get_available_moves(board)
        if available_moves:
            return random.choice(available_moves)
        return -1
    
    # 50% chance for minimax (optimal) move
    best_score = -float('inf')
    best_move = -1
    
    # Optimize: first check if we can win in one move
    for i in get_available_moves(board):
        board[i] = 'O'
        if check_winner(board) == 'O':
            board[i] = None
            return i
        board[i] = None
        
    # Then check if we need to block opponent's win
    for i in get_available_moves(board):
        board[i] = 'X'
        if check_winner(board) == 'X':
            board[i] = None
            return i
        board[i] = None
    
    # If no immediate win/block, use minimax with depth limit for harder boards
    available_moves = get_available_moves(board)
    if len(available_moves) > 7:  # If most of the board is empty, just use center or corners
        preferred_moves = [4, 0, 2, 6, 8]  # Center and corners
        for move in preferred_moves:
            if move in available_moves:
                return move
    
    # For mid to late game, use minimax with limited depth
    depth_limit = 2 if len(available_moves) > 5 else 9  # Smaller depth for early game
    
    for i in get_available_moves(board):
        board[i] = 'O'
        if len(get_available_moves(board)) > 0:
            score = minimax(board, 0, False)
        else:
            score = 0
        board[i] = None
        
        if score > best_score:
            best_score = score
            best_move = i
    
    return best_move

# Routes
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists, you prick!'}), 400
    
    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    
    login_user(user)
    return jsonify({'message': 'Registered, you chaotic bastard!', 'user_id': user.id}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid username or password, you dumbass!'}), 401
    
    login_user(user)
    return jsonify({'message': 'Logged in, let\'s rock!', 'user_id': user.id}), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    if hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
        logout_user()
    return jsonify({'message': 'Logged out, come back soon you psycho!'}), 200

@app.route('/api/create-room', methods=['POST'])
def create_room():
    try:
        # Try to get JSON data, but handle form data as well
        if request.is_json:
            data = request.get_json() or {}
        else:
            data = request.form.to_dict() or {}
            
        # If still no data, try to get raw data
        if not data and request.data:
            try:
                import json
                data = json.loads(request.data.decode('utf-8'))
            except:
                data = {}
        
        username = data.get('username', 'Guest')
        
        # Check if user is authenticated, use their info if so
        is_authenticated = hasattr(current_user, 'id') and current_user.is_authenticated
        user_id = current_user.id if is_authenticated else 'anonymous-' + str(uuid.uuid4())
        user_name = current_user.username if is_authenticated else username
        
        # Generate a 6-digit room code
        room_code = ''.join(random.choices('0123456789', k=6))
        
        while room_code in active_rooms:
            room_code = ''.join(random.choices('0123456789', k=6))
        
        current_time = time.time()
        active_rooms[room_code] = {
            'board': [None] * 9,
            'players': {
                'X': {
                    'id': user_id,
                    'username': user_name
                },
                'O': None
            },
            'current_turn': 'X',
            'status': 'waiting',
            'created_at': current_time,
            'last_activity': current_time
        }
        
        return jsonify({
            'room_code': room_code,
            'player_symbol': 'X',
            'message': 'Room created, waiting for another prick to join!'
        })
    except Exception as e:
        print(f"Error in create_room: {str(e)}")
        return jsonify({'error': 'Server error, try again!'}), 500

# Socket events
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    print(f"Client disconnected: {sid}")
    
    # Check if this client was in a room
    if sid in client_rooms:
        room_code = client_rooms[sid]['room_code']
        player_symbol = client_rooms[sid]['player_symbol']
        username = client_rooms[sid]['username']
        
        # Update room status if it exists
        if room_code in active_rooms:
            room = active_rooms[room_code]
            # Only handle non-AI games
            if not room.get('is_ai_game'):
                # Mark the player as left
                room['players'][player_symbol] = None
                if room['status'] != 'waiting':
                    room['status'] = 'waiting'  # Set back to waiting for another player
                
                # Notify room about player leaving
                emit('player_left', {
                    'player_symbol': player_symbol,
                    'username': username,
                    'message': f"{username} exited from room. Waiting for another player to join to start.",
                    'game_state': room
                }, to=room_code)
                
        # Remove client from tracking
        del client_rooms[sid]

@socketio.on('join_room')
def handle_join_room(data):
    room_code = data.get('room_code')
    username = data.get('username', 'Guest')
    
    # Check if current_user is authenticated
    is_authenticated = hasattr(current_user, 'id') and current_user.is_authenticated
    
    if room_code not in active_rooms:
        emit('error', {'message': 'Room not found, you dumbass!'})
        return
    
    room = active_rooms[room_code]
    
    # Update room activity timestamp
    room['last_activity'] = time.time()
    
    # If room is full
    if room['players']['X'] and room['players']['O']:
        emit('error', {'message': 'Room is full, fuck off!'})
        return
    
    # Determine player symbol
    player_symbol = 'O' if room['players']['X'] else 'X'
    
    # Get user info
    user_id = current_user.id if is_authenticated else 'anonymous-' + str(uuid.uuid4())
    user_name = current_user.username if is_authenticated else username
    
    # Update room data
    room['players'][player_symbol] = {
        'id': user_id,
        'username': user_name
    }
    
    # Join the room
    join_room(room_code)
    
    # Track this client for disconnect handling
    client_rooms[request.sid] = {
        'room_code': room_code,
        'player_symbol': player_symbol,
        'username': user_name
    }
    
    # Notify all users in the room
    emit('player_joined', {
        'player_symbol': player_symbol,
        'username': user_name,
        'game_state': room
    }, to=room_code)
    
    # If both players are now present, start the game
    if room['players']['X'] and room['players']['O']:
        room['status'] = 'playing'
        emit('game_started', {
            'room_code': room_code,
            'game_state': room,
            'message': 'Game started, don\'t fuck it up!'
        }, to=room_code)

@socketio.on('make_move')
def handle_make_move(data):
    room_code = data.get('room_code')
    cell_index = data.get('cell_index')
    
    if room_code not in active_rooms:
        emit('error', {'message': 'Room not found, you dumbass!'})
        return
    
    room = active_rooms[room_code]
    
    # Update room activity timestamp
    room['last_activity'] = time.time()
    
    if room['status'] != 'playing':
        emit('error', {'message': 'Game not started or already ended!'})
        return
    
    # Get player symbol based on sid
    if request.sid in client_rooms and client_rooms[request.sid]['room_code'] == room_code:
        player_symbol = client_rooms[request.sid]['player_symbol']
    else:
        emit('error', {'message': 'Not in this room, dipshit!'})
        return
    
    if room['current_turn'] != player_symbol:
        emit('error', {'message': 'Not your turn, asshole!'})
        return
    
    if room['board'][cell_index] is not None:
        emit('error', {'message': 'Cell already taken, blind fuck!'})
        return
    
    # Make the move
    room['board'][cell_index] = player_symbol
    
    # Check for winner
    winner = check_winner(room['board'])
    
    if winner:
        if winner == 'tie':
            room['status'] = 'tie'
            result_message = 'It\'s a tie, you useless pricks!'
        else:
            room['status'] = 'winner'
            winner_name = room['players'][winner]['username']
            result_message = f'{winner_name} won, other guy sucks balls!'
        
        emit('game_over', {
            'result': winner,
            'message': result_message,
            'game_state': room
        }, to=room_code)
        return
    
    # Switch turns
    room['current_turn'] = 'O' if player_symbol == 'X' else 'X'
    
    emit('move_made', {
        'cell_index': cell_index,
        'player_symbol': player_symbol,
        'next_turn': room['current_turn'],
        'game_state': room
    }, to=room_code)

@socketio.on('play_vs_ai')
def handle_play_vs_ai(data=None):
    # Check if current_user is authenticated
    is_authenticated = hasattr(current_user, 'id') and current_user.is_authenticated
    
    # Get username from data if provided, otherwise use 'Guest'
    username = None
    if data and 'username' in data:
        username = data.get('username')
    
    # Use current_user if authenticated, otherwise use data or default
    user_id = current_user.id if is_authenticated else 'anonymous'
    user_name = current_user.username if is_authenticated else (username or 'Guest')
    
    # Create a special room for AI games
    room_code = f'ai-{uuid.uuid4().hex[:6]}'
    
    current_time = time.time()
    active_rooms[room_code] = {
        'board': [None] * 9,
        'players': {
            'X': {
                'id': user_id,
                'username': user_name
            },
            'O': {
                'id': 'ai',
                'username': 'Merciless AI'
            }
        },
        'current_turn': 'X',
        'status': 'playing',
        'is_ai_game': True,
        'created_at': current_time,
        'last_activity': current_time
    }
    
    join_room(room_code)
    
    # Track this client for disconnect handling
    client_rooms[request.sid] = {
        'room_code': room_code,
        'player_symbol': 'X',
        'username': user_name
    }
    
    emit('ai_game_started', {
        'room_code': room_code,
        'player_symbol': 'X',
        'game_state': active_rooms[room_code],
        'message': 'AI\'s gonna eat your soul, prick!'
    })

@socketio.on('make_move_vs_ai')
def handle_make_move_vs_ai(data):
    room_code = data.get('room_code')
    cell_index = data.get('cell_index')
    
    if room_code not in active_rooms:
        emit('error', {'message': 'Room not found, you dumbass!'})
        return
    
    room = active_rooms[room_code]
    
    # Update activity timestamp
    room['last_activity'] = time.time()
    
    if not room.get('is_ai_game'):
        emit('error', {'message': 'Not an AI game, fuckface!'})
        return
    
    if room['status'] != 'playing':
        emit('error', {'message': 'Game not started or already ended!'})
        return
    
    if room['current_turn'] != 'X':
        emit('error', {'message': 'Not your turn, asshole!'})
        return
    
    if room['board'][cell_index] is not None:
        emit('error', {'message': 'Cell already taken, blind fuck!'})
        return
    
    # Make player move
    room['board'][cell_index] = 'X'
    
    # Check for winner after player move
    winner = check_winner(room['board'])
    
    if winner:
        if winner == 'tie':
            room['status'] = 'tie'
            result_message = 'It\'s a tie, you useless prick!'
        else:
            room['status'] = 'winner'
            result_message = 'You got lucky, you cunt!'
        
        emit('game_over', {
            'result': winner,
            'message': result_message,
            'game_state': room
        })
        return
    
    # Switch to AI turn
    room['current_turn'] = 'O'
    
    emit('move_made', {
        'cell_index': cell_index,
        'player_symbol': 'X',
        'next_turn': 'O',
        'game_state': room
    })
    
    # Add a small delay to make it feel more natural
    eventlet.sleep(0.5)
    
    # Let AI make a move
    ai_move = get_ai_move(room['board'])
    
    if ai_move != -1:
        room['board'][ai_move] = 'O'
        
        # Check for winner after AI move
        winner = check_winner(room['board'])
        
        if winner:
            if winner == 'tie':
                room['status'] = 'tie'
                result_message = 'It\'s a tie, you useless prick!'
            else:
                room['status'] = 'winner'
                result_message = 'AI fucked you raw!'
            
            emit('game_over', {
                'result': winner,
                'message': result_message,
                'game_state': room
            })
        else:
            # Switch back to player
            room['current_turn'] = 'X'
            
            emit('ai_move_made', {
                'cell_index': ai_move,
                'next_turn': 'X',
                'game_state': room
            })

@socketio.on('reset_game')
def handle_reset_game(data):
    room_code = data.get('room_code')
    
    if room_code not in active_rooms:
        emit('error', {'message': 'Room not found, you dumbass!'})
        return
    
    room = active_rooms[room_code]
    
    # Update activity timestamp
    room['last_activity'] = time.time()
    
    # Reset the game
    room['board'] = [None] * 9
    room['current_turn'] = 'X'
    room['status'] = 'playing'
    
    emit('game_reset', {'game_state': room}, to=room_code)

@socketio.on('leave_ai_game')
def handle_leave_ai_game(data):
    room_code = data.get('room_code')
    
    # Clean up AI game from memory if it exists
    if room_code in active_rooms and active_rooms[room_code].get('is_ai_game'):
        del active_rooms[room_code]
        
        # Also remove from client_rooms if present
        for sid, info in list(client_rooms.items()):
            if info.get('room_code') == room_code:
                del client_rooms[sid]
                
    # Force garbage collection if we've deleted many rooms
    if len(active_rooms) % 10 == 0:
        gc.collect()

def cleanup_memory():
    global active_rooms
    current_time = time.time()
    if current_time - last_cleanup_time > CLEANUP_INTERVAL:
        print("Performing memory cleanup...")
        active_rooms = {room_code: room for room_code, room in active_rooms.items() if room['status'] != 'playing'}
        print(f"Memory cleanup completed. {len(active_rooms)} rooms remaining.")
        last_cleanup_time = current_time

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=False)
else:
    # For production on Render
    # Set up periodic cleanup for inactive rooms
    @app.before_request
    def before_request():
        global last_cleanup_time
        current_time = time.time()
        if current_time - last_cleanup_time > CLEANUP_INTERVAL:
            old_rooms = []
            for room_code, room in active_rooms.items():
                # Clean up rooms that are over 4 hours old
                if room.get('last_activity', 0) < current_time - 14400:  # 4 hours
                    old_rooms.append(room_code)
            
            # Remove old rooms
            for room_code in old_rooms:
                if room_code in active_rooms:
                    del active_rooms[room_code]
            
            # Force garbage collection
            gc.collect()
            last_cleanup_time = current_time
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
