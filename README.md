<<<<<<< HEAD
# Tic-Tac-Toe
=======
# Tic Tac Toe Shitshow v1

A chaotic multiplayer Tic Tac Toe game with user accounts, real-time gameplay, and a savage AI opponent.

## Features

- User registration and login system
- Multiplayer rooms with 6-digit codes
- Real-time game updates via WebSockets
- AI opponent with dual personality (random moves & minimax algorithm)
- Dark neon theme with smooth animations
- Optimized performance

## Tech Stack

- **Frontend**: React.js, Socket.io client, CSS3 animations
- **Backend**: Flask, Flask-SocketIO, Flask-SQLAlchemy
- **Database**: SQLite
- **Authentication**: Flask-Login, Werkzeug security

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm

### Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/ticktac.git
cd ticktac
```

2. Set up the Python virtual environment

**For Windows:**
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**For Linux/Mac:**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Install React dependencies

```bash
cd client
npm install
```

4. Build the React frontend (Production)

```bash
npm run build
cd ..
```

## Running the Application

### Development Mode

**Terminal 1 (Backend):**
```bash
# Activate virtual environment first
python app.py
```

**Terminal 2 (Frontend - Optional for development):**
```bash
cd client
npm start
```

### Production Mode

```bash
# Activate virtual environment first
python app.py
```

Then visit http://localhost:5000 in your browser.

## Gameplay Instructions

1. Register or login to your account
2. From the home page, you can:
   - Create a new multiplayer room
   - Join an existing room with a 6-digit code
   - Play against the AI
3. In multiplayer mode, share your room code with a friend
4. In AI mode, you'll face an opponent that switches between random and strategic moves

## Deployment

For production deployment, it's recommended to:

1. Use Gunicorn as a WSGI server
2. Set up Nginx as a reverse proxy
3. Configure a proper database (e.g., PostgreSQL)
4. Set up proper environment variables

## License

MIT License - Feel free to use, modify, and distribute as you like.

## Acknowledgements

Built with ❤️ and 🤬 for chaotic gaming moments. 
>>>>>>> ae969c6 (Initial commit: Tic Tac Toe Shitshow v1 game with Flask backend and React frontend)
