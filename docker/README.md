# Docker Setup for TCE Insurance Document Processor

Complete Docker containerization for the TCE Insurance Document Processing application with PostgreSQL, FastAPI backend, and React frontend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network (tce-network)             │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Frontend   │─────▶│   Backend    │─────▶│ Database  │ │
│  │  (Nginx)     │      │  (FastAPI)   │      │(PostgreSQL)│ │
│  │  Port: 3000  │      │  Port: 8000  │      │ Port: 5432│ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2.0+
- At least 4GB RAM available for Docker
- Ports 3000, 8000, and 5432 available

## Quick Start

### 1. Setup Environment Variables

```bash
cd docker
cp .env.example .env
```

Edit `.env` and configure:
- Database credentials
- Email IMAP settings (if using email processing)
- Groq API key for GenAI
- JWT secret for authentication

### 2. Build and Start Services

```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432

### 4. Default Credentials

- **Admin User**: admin@tce.com
- **Password**: admin123

## Docker Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View service status
docker-compose ps

# View logs
docker-compose logs -f [service_name]
```

### Database Operations

```bash
# Access PostgreSQL shell
docker-compose exec database psql -U postgres -d tce_project

# Backup database
docker-compose exec database pg_dump -U postgres tce_project > backup.sql

# Restore database
docker-compose exec -T database psql -U postgres tce_project < backup.sql
```

### Development

```bash
# Rebuild after code changes
docker-compose up -d --build

# View backend logs
docker-compose logs -f backend

# Execute commands in backend container
docker-compose exec backend python -m pytest

# Access backend shell
docker-compose exec backend bash
```

### Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (WARNING: deletes data)
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## File Structure

```
docker/
├── backend/
│   └── Dockerfile              # Backend container definition
├── frontend/
│   ├── Dockerfile              # Frontend container definition
│   └── nginx.conf              # Nginx configuration
├── init-db/                    # Database initialization scripts
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment template
├── .dockerignore               # Build context exclusions
└── README.md                   # This file
```

## Volumes

Persistent data is stored in Docker volumes:

- `postgres_data`: Database files
- `backend_uploads`: Uploaded PDF files
- `backend_processed`: Processed document images

## Networking

All services communicate through the `tce-network` bridge network:

- Frontend → Backend: http://backend:8000
- Backend → Database: postgresql://database:5432

## Environment Variables

### Required Variables

- `GROQ_API_KEY`: Your Groq API key for GenAI processing
- `JWT_SECRET`: Secret key for JWT token generation

### Optional Variables

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database credentials
- `IMAP_EMAIL`, `IMAP_PASSWORD`: Email processing credentials
- `BACKEND_PORT`, `FRONTEND_PORT`: Custom port mappings
- `DEBUG`: Enable debug mode (true/false)

## Health Checks

All services include health checks:

- **Database**: PostgreSQL ready check
- **Backend**: HTTP health endpoint
- **Frontend**: Nginx availability check

View health status:
```bash
docker-compose ps
```

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Verify ports are available
netstat -an | grep -E "3000|8000|5432"

# Restart Docker Desktop
```

### Database connection errors

```bash
# Verify database is healthy
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### Backend errors

```bash
# Check environment variables
docker-compose exec backend env

# View detailed logs
docker-compose logs backend --tail=100

# Access container shell
docker-compose exec backend bash
```

### Frontend not loading

```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Verify backend connectivity
docker-compose exec frontend wget -O- http://backend:8000/health
```

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Update database credentials
- [ ] Set `DEBUG=false`
- [ ] Configure firewall rules
- [ ] Enable HTTPS with SSL certificates
- [ ] Review and restrict CORS settings
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging

### Performance Optimization

- [ ] Configure resource limits in docker-compose.yml
- [ ] Enable database connection pooling
- [ ] Set up Redis for caching (optional)
- [ ] Configure log rotation
- [ ] Implement backup strategy

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Ensure Docker Desktop is running
4. Check port availability

## License

TCE Insurance Document Processor - Internal Use
