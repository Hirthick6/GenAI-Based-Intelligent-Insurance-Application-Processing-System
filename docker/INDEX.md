# TCE Docker Documentation Index

Complete Docker implementation for TCE Insurance Document Processor.

## 📚 Documentation

### Getting Started
1. **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
2. **[WINDOWS_SETUP.md](WINDOWS_SETUP.md)** - Windows-specific instructions
3. **[README.md](README.md)** - Complete documentation

### Advanced
4. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture details
5. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
6. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions

## 📁 File Structure

```
docker/
├── README.md                    # Main documentation
├── QUICK_START.md              # Quick setup guide
├── WINDOWS_SETUP.md            # Windows-specific guide
├── ARCHITECTURE.md             # Architecture documentation
├── DEPLOYMENT.md               # Production deployment
├── TROUBLESHOOTING.md          # Troubleshooting guide
├── INDEX.md                    # This file
│
├── docker-compose.yml          # Main compose file
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── .env.example                # Environment template
├── .dockerignore               # Build exclusions
│
├── backend/
│   └── Dockerfile              # Backend container
│
├── frontend/
│   ├── Dockerfile              # Frontend production
│   ├── Dockerfile.dev          # Frontend development
│   └── nginx.conf              # Nginx configuration
│
├── init-db/
│   └── 01-init.sql            # Database initialization
│
└── scripts/
    ├── start.sh / start.bat    # Start services
    ├── stop.sh / stop.bat      # Stop services
    ├── logs.sh / logs.bat      # View logs
    ├── backup.sh / backup.bat  # Backup database
    ├── restore.sh              # Restore database
    └── clean.sh / clean.bat    # Cleanup resources
```

## 🚀 Quick Commands

### Windows
```cmd
cd docker
scripts\start.bat              # Start all services
scripts\logs.bat               # View logs
scripts\stop.bat               # Stop services
```

### Linux/Mac
```bash
cd docker
./scripts/start.sh             # Start all services
./scripts/logs.sh              # View logs
./scripts/stop.sh              # Stop services
```

### Docker Compose
```bash
docker-compose up -d           # Start services
docker-compose down            # Stop services
docker-compose logs -f         # View logs
docker-compose ps              # Check status
```

## 🎯 Use Cases

### Development
```bash
# Hot reload for both frontend and backend
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production
```bash
# Optimized with resource limits
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Testing
```bash
# Start services, run tests, cleanup
docker-compose up -d
docker-compose exec backend pytest
docker-compose down
```

## 🔧 Configuration

### Required Environment Variables
- `GROQ_API_KEY` - GenAI service key
- `JWT_SECRET` - Authentication secret

### Optional Environment Variables
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database config
- `BACKEND_PORT`, `FRONTEND_PORT` - Port mappings
- `DEBUG` - Debug mode (true/false)

## 📊 Services

| Service  | Port | Purpose                    |
|----------|------|----------------------------|
| Frontend | 3000 | React web application      |
| Backend  | 8000 | FastAPI REST API           |
| Database | 5432 | PostgreSQL database        |

## 🔗 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

## 📦 Volumes

- `postgres_data` - Database persistence
- `backend_uploads` - Uploaded files
- `backend_processed` - Processed images

## 🛠️ Maintenance

### Backup
```bash
./scripts/backup.sh            # Linux/Mac
scripts\backup.bat             # Windows
```

### Update
```bash
git pull
docker-compose up -d --build
```

### Clean
```bash
./scripts/clean.sh             # Linux/Mac
scripts\clean.bat              # Windows
```

## 📞 Support

For issues:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. View logs: `docker-compose logs -f`
3. Check service health: `docker-compose ps`

## 📝 Notes

- Default admin: admin@tce.com / admin123
- Minimum 4GB RAM recommended
- Docker Desktop required for Windows
- All scripts work on Windows, Linux, and Mac
