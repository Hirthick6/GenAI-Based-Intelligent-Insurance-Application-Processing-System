# Quick Start Guide

## 5-Minute Setup

### Step 1: Prerequisites
Ensure Docker Desktop is installed and running.

### Step 2: Configure
```bash
cd docker
cp .env.example .env
```

Edit `.env` and set:
- `GROQ_API_KEY` (required for GenAI)
- `JWT_SECRET` (use a strong random string)

### Step 3: Start
```bash
docker-compose up -d
```

### Step 4: Access
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/docs
- Login: admin@tce.com / admin123

## Development Mode

For hot reload during development:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build
```

## Next Steps
- Upload a PDF insurance form
- View processing results
- Check analytics dashboard
- Test chat functionality
