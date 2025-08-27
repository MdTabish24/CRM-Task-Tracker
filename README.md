# Internal CRM + Task Tracker

A role-based CRM system with task management built with Flask backend and React frontend.

## Features

- CSV/Excel import with automatic caller assignment
- Role-based access control (Admin, Caller)
- Real-time progress tracking
- Task management system
- Visit tracking and reporting

## Tech Stack

- **Backend**: Python Flask + SQLAlchemy + JWT
- **Database**: MySQL
- **Frontend**: React + Vibe UI
- **Deployment**: Railway (free tier)

## Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
export FLASK_APP=app.py
export SQLALCHEMY_DATABASE_URI="mysql://user:pass@host:port/dbname"
export SECRET_KEY="your-secret-key"
export JWT_SECRET_KEY="your-jwt-secret"
flask db upgrade
python seed.py
flask run
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Railway Deployment

### Step 1: Create MySQL Database
1. Go to [Railway.app](https://railway.app) and create a new project
2. Add a MySQL plugin to your project
3. Note down the connection details from the MySQL plugin

### Step 2: Deploy Backend
1. Connect your GitHub repository to Railway
2. Set the following environment variables in Railway dashboard:
   ```
   SECRET_KEY=your-random-secret-key-here
   JWT_SECRET_KEY=your-jwt-secret-key-here
   SQLALCHEMY_DATABASE_URI=mysql+pymysql://username:password@host:port/database
   PORT=5000
   ```
3. Railway will automatically deploy your backend

### Step 3: Initialize Database
1. Use Railway's terminal or connect to your database
2. Run the schema.sql file to create tables
3. Run the seed script to create default users:
   ```bash
   cd backend && python seed.py
   ```

### Step 4: Deploy Frontend (Optional)
- For production, build the React app and serve it through Flask
- Or deploy frontend separately on Vercel/Netlify and update API URLs

### Environment Variables Required:
- `SECRET_KEY`: Flask secret key for sessions
- `JWT_SECRET_KEY`: JWT token signing key  
- `SQLALCHEMY_DATABASE_URI`: MySQL connection string from Railway
- `PORT`: Port number (Railway sets this automatically)

## Default Users

- Admin: username `admin`, password `admin123`
- Callers: `caller1`, `caller2`, `caller3` (password: `caller123`)

## API Endpoints

- `POST /auth/login` - Authentication
- `POST /admin/upload` - CSV upload
- `GET /caller/records` - Caller's assigned records
- `PATCH /records/{id}` - Update record
- `GET /admin/progress` - Progress dashboard
- `POST /tasks` - Create task
- `GET /tasks` - List tasks