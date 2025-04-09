# Tic-Tac-Toe

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

### Render.com (Free)

1. Create an account on [Render.com](https://render.com/)
2. Connect your GitHub repository
3. Click "New Web Service"
4. Select your repository
5. Render will automatically detect the Python app
6. Use these settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn --worker-class eventlet -w 1 app:app`
   - Select the free plan
7. Click "Create Web Service"

### Heroku (Free Tier)

1. Create an account on [Heroku](https://www.heroku.com/)
2. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Login to Heroku CLI:
   ```bash
   heroku login
   ```
4. Initialize a Git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
5. Create a Heroku app:
   ```bash
   heroku create your-app-name
   ```
6. Push to Heroku:
   ```bash
   git push heroku main
   ```
7. Open your deployed app:
   ```bash
   heroku open
   ```

### PythonAnywhere (Free)

1. Create an account on [PythonAnywhere](https://www.pythonanywhere.com/)
2. Go to the Dashboard and open a Bash console
3. Clone your repository:
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   ```
4. Set up a virtual environment:
   ```bash
   cd your-repo
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
5. Go to the Web tab and add a new web app
6. Choose Manual Configuration and Python 3.9
7. Set the path to your Flask app
8. Modify the WSGI file to point to your app
9. Add your domain name in the "Web" tab

## License

MIT License - Feel free to use, modify, and distribute as you like.

## Acknowledgements

Built with ❤️ and 🤬 for chaotic gaming moments.
