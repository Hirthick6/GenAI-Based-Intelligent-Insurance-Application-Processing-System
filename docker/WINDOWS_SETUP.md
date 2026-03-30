# Windows Setup Guide

## Prerequisites

1. **Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Minimum requirements: Windows 10/11 Pro, 4GB RAM
   - Enable WSL 2 backend (recommended)

2. **Git for Windows** (optional)
   - Download from: https://git-scm.com/download/win

## Quick Start (Windows)

### Step 1: Open PowerShell or Command Prompt
```cmd
cd path\to\tce-project\docker
```

### Step 2: Configure Environment
```cmd
copy .env.example .env
notepad .env
```

Update these values:
- `GROQ_API_KEY` - Your Groq API key
- `JWT_SECRET` - Strong random string
- Other settings as needed

### Step 3: Start Services
```cmd
scripts\start.bat
```

Or using docker-compose directly:
```cmd
docker-compose up -d
```

### Step 4: Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Windows-Specific Scripts

All scripts are in `docker/scripts/` folder:

- `start.bat` - Start all services
- `stop.bat` - Stop all services
- `logs.bat` - View logs
- `backup.bat` - Backup database
- `clean.bat` - Clean up resources

### Usage Examples
```cmd
REM Start services
scripts\start.bat

REM View all logs
scripts\logs.bat

REM View specific service logs
scripts\logs.bat backend

REM Stop services
scripts\stop.bat

REM Backup database
scripts\backup.bat

REM Clean up
scripts\clean.bat
```

## Troubleshooting Windows Issues

### Docker Desktop Not Starting
1. Enable Hyper-V in Windows Features
2. Enable WSL 2
3. Restart computer

### Port Already in Use
```cmd
REM Find process using port
netstat -ano | findstr :8000

REM Kill process (replace PID)
taskkill /PID <process_id> /F
```

### File Sharing Issues
1. Open Docker Desktop Settings
2. Go to Resources → File Sharing
3. Add your project directory
4. Apply & Restart

### WSL 2 Integration
1. Open Docker Desktop Settings
2. Go to Resources → WSL Integration
3. Enable integration with your WSL distro
4. Apply & Restart

## Performance Tips

1. **Allocate More Resources**
   - Docker Desktop → Settings → Resources
   - Increase CPU: 2-4 cores
   - Increase Memory: 4-8 GB

2. **Use WSL 2 Backend**
   - Better performance than Hyper-V
   - Docker Desktop → Settings → General
   - Enable "Use WSL 2 based engine"

3. **Exclude from Antivirus**
   - Add Docker directories to exclusions
   - Add project directory to exclusions

## Common Commands

```cmd
REM Check Docker version
docker --version
docker-compose --version

REM View running containers
docker ps

REM View all containers
docker ps -a

REM View logs
docker-compose logs -f

REM Restart a service
docker-compose restart backend

REM Rebuild after code changes
docker-compose up -d --build

REM Stop and remove everything
docker-compose down -v

REM Check resource usage
docker stats
```

## Next Steps

1. Login with default credentials:
   - Email: admin@tce.com
   - Password: admin123

2. Upload a test PDF insurance form

3. View processing results in the dashboard

4. Check the Analytics page for insights
