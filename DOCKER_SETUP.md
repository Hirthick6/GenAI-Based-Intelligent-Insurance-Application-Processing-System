# Docker Setup - TCE Insurance Document Processor

Complete Docker containerization with PostgreSQL, FastAPI backend, and React frontend.

## 🎯 What's Included

- **3 Docker containers**: Frontend (Nginx), Backend (FastAPI), Database (PostgreSQL)
- **Production-ready**: Multi-stage builds, health checks, resource limits
- **Development mode**: Hot reload for both frontend and backend
- **Cross-platform**: Works on Windows, Linux, and macOS
- **Complete documentation**: Setup, deployment, troubleshooting guides
- **Utility scripts**: Start, stop, backup, restore, logs, cleanup

## 📋 Prerequisites

1. **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
   - Download: https://www.docker.com/products/docker-desktop
   - Minimum: 4GB RAM, 2 CPU cores

2. **Docker Compose** v2.0+
   - Included with Docker Desktop
   - Linux: `sudo apt-get install docker-compose-plugin`

## 🚀 Quick Start (5 Minutes)

### Step 1: Navigate to Docker folder
```bash
cd docker
```

### Step 2: Configure environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
notepad .env        # Windows
nano .env           # Linux/Mac
```

**Required settings:**
- `GROQ_API_KEY` - Your Groq API key for GenAI
- `JWT_SECRET` - Strong random string for authentication

### Step 3: Start services

**Windows:**
```cmd
scripts\start.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/*.sh
./scripts/start.sh
```

**Or use Docker Compose directly:**
```bash
docker-compose up -d
```

### Step 4: Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

**Default login:**
- Email: `admin@tce.com`
- Password: `admin123`

## 📚 Documentation

All documentation is in the `docker/` folder:

| Document | Description |
|----------|-------------|
| [INDEX.md](docker/INDEX.md) | Documentation index |
| [QUICK_START.md](docker/QUICK_START.md) | 5-minute setup guide |
| [README.md](docker/README.md) | Complete documentation |
| [WINDOWS_SETUP.md](docker/WINDOWS_SETUP.md) | Windows-specific guide |
| [ARCHITECTURE.md](docker/ARCHITECTURE.md) | System architecture |
| [DEPLOYMENT.md](docker/DEPLOYMENT.md) | Production deployment |
| [TROUBLESHOOTING.md](docker/TROUBLESHOOTING.md) | Common issues |

## 🛠️ Common Commands

### Service Management
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend

# View service status
docker-compose ps

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### Development Mode (Hot Reload)
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production Mode
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Database Operations
```bash
# Backup database
docker-compose exec database pg_dump -U postgres tce_project > backup.sql

# Restore database
docker-compose exec -T database psql -U postgres tce_project < backup.sql

# Access PostgreSQL shell
docker-compose exec database psql -U postgres -d tce_project
```

### Cleanup
```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (deletes data!)
docker-compose down -v

# Clean up unused Docker resources
docker system prune -a
```

## 🔧 Configuration

### Environment Variables (.env)

**Database:**
```env
DB_NAME=tce_project
DB_USER=postgres
DB_PASSWORD=postgres
DB_PORT=5432
```

**Email (Optional):**
```env
IMAP_SERVER=imap.gmail.com
IMAP_PORT=993
IMAP_EMAIL=your-email@gmail.com
IMAP_PASSWORD=your-app-password
```

**GenAI (Required):**
```env
GROQ_API_KEY=your-groq-api-key-here
GENAI_PROVIDER=groq
```

**Server Ports:**
```env
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

**Security (Important!):**
```env
JWT_SECRET=change-this-to-a-long-random-string-in-production
DEBUG=false
```

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Docker Network (tce-network)            │
│                                                          │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐     │
│  │ Frontend │─────▶│ Backend  │─────▶│ Database │     │
│  │  Nginx   │      │ FastAPI  │      │PostgreSQL│     │
│  │ :3000    │      │  :8000   │      │  :5432   │     │
│  └──────────┘      └──────────┘      └──────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Features

### Production Ready
- Multi-stage Docker builds for optimized images
- Health checks for all services
- Automatic restart on failure
- Resource limits and reservations
- Security headers and best practices

### Development Friendly
- Hot reload for frontend and backend
- Volume mounts for live code updates
- Detailed logging
- Easy debugging

### Data Persistence
- PostgreSQL data in Docker volume
- Uploaded files in persistent volume
- Processed images in persistent volume
- Easy backup and restore

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# Check logs
docker-compose logs

# Verify ports are available
netstat -an | grep -E "3000|8000|5432"
```

### Database connection errors
```bash
# Check database health
docker-compose ps database

# Restart database
docker-compose restart database
```

### Port conflicts
Edit `docker/.env` and change ports:
```env
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

For more issues, see [TROUBLESHOOTING.md](docker/TROUBLESHOOTING.md)

## 📊 Resource Requirements

### Minimum
- 4GB RAM
- 2 CPU cores
- 10GB disk space

### Recommended
- 8GB RAM
- 4 CPU cores
- 20GB disk space

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Update database credentials
- [ ] Set `DEBUG=false`
- [ ] Configure firewall rules
- [ ] Enable HTTPS with SSL certificates
- [ ] Review CORS settings
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure automated backups

## 📈 Next Steps

1. **Test the application**
   - Login with default credentials
   - Upload a test PDF insurance form
   - View processing results
   - Check analytics dashboard

2. **Customize configuration**
   - Update environment variables
   - Configure email processing
   - Set up monitoring

3. **Deploy to production**
   - Follow [DEPLOYMENT.md](docker/DEPLOYMENT.md)
   - Set up SSL certificates
   - Configure backups
   - Set up monitoring

## 💡 Tips

- Use `docker-compose logs -f` to monitor all services
- Check `docker-compose ps` to verify service health
- Use development mode for coding with hot reload
- Regular backups with `scripts/backup.sh` or `scripts\backup.bat`
- Monitor resource usage with `docker stats`

## 📞 Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](docker/TROUBLESHOOTING.md)
2. View logs: `docker-compose logs -f`
3. Verify configuration in `.env`
4. Check Docker Desktop is running

## 📝 License

TCE Insurance Document Processor - Internal Use

---

**Ready to start?** Navigate to the `docker/` folder and run the start script!
