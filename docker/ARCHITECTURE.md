# Docker Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Host (Your Machine)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Docker Network: tce-network                    │ │
│  │                                                             │ │
│  │  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │ │
│  │  │   Frontend   │      │   Backend    │      │ Database │ │ │
│  │  │   Container  │─────▶│  Container   │─────▶│Container │ │ │
│  │  │              │      │              │      │          │ │ │
│  │  │ Nginx:Alpine │      │ Python:3.11  │      │Postgres  │ │ │
│  │  │              │      │              │      │  :15     │ │ │
│  │  │ Port: 3000   │      │ Port: 8000   │      │Port: 5432│ │ │
│  │  └──────────────┘      └──────────────┘      └──────────┘ │ │
│  │         │                      │                    │      │ │
│  └─────────┼──────────────────────┼────────────────────┼──────┘ │
│            │                      │                    │        │
│            ▼                      ▼                    ▼        │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Volume:    │      │   Volume:    │      │   Volume:    │ │
│  │   (none)     │      │   uploads    │      │postgres_data │ │
│  │              │      │   processed  │      │              │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Container Details

### Frontend Container
- **Base Image**: node:18-alpine (build), nginx:alpine (runtime)
- **Purpose**: Serve React application
- **Build**: Multi-stage (build → production)
- **Port**: 80 (internal) → 3000 (host)
- **Dependencies**: Backend container
- **Health Check**: HTTP GET on /

### Backend Container
- **Base Image**: python:3.11-slim
- **Purpose**: FastAPI application server
- **System Packages**: Tesseract OCR, Poppler, PostgreSQL client
- **Port**: 8000 (internal) → 8000 (host)
- **Dependencies**: Database container
- **Health Check**: HTTP GET on /health
- **Volumes**: uploads, processed

### Database Container
- **Base Image**: postgres:15-alpine
- **Purpose**: PostgreSQL database
- **Port**: 5432 (internal) → 5432 (host)
- **Health Check**: pg_isready
- **Volume**: postgres_data (persistent)
- **Init Scripts**: /docker-entrypoint-initdb.d

## Network Architecture

### Internal Communication
- Frontend → Backend: http://backend:8000
- Backend → Database: postgresql://database:5432
- All containers on bridge network: tce-network

### External Access
- Host → Frontend: http://localhost:3000
- Host → Backend: http://localhost:8000
- Host → Database: localhost:5432

## Volume Management

### Persistent Volumes
1. **postgres_data**
   - Purpose: Database files
   - Location: Docker managed
   - Backup: Use pg_dump

2. **backend_uploads**
   - Purpose: Uploaded PDF files
   - Location: Docker managed
   - Backup: Copy from container

3. **backend_processed**
   - Purpose: Processed images
   - Location: Docker managed
   - Backup: Copy from container

## Build Process

### Frontend Build
```
1. Stage 1: Build
   - Install Node dependencies
   - Run Vite build
   - Output: /app/dist

2. Stage 2: Production
   - Copy built files to Nginx
   - Configure Nginx
   - Serve static files
```

### Backend Build
```
1. Install system dependencies
   - Tesseract OCR
   - Poppler utilities
   - PostgreSQL client

2. Install Python dependencies
   - FastAPI, SQLAlchemy
   - OCR libraries
   - GenAI clients

3. Copy application code
4. Create directories
```

## Startup Sequence

```
1. Database Container
   ├─ Initialize PostgreSQL
   ├─ Run init scripts
   └─ Health check: pg_isready

2. Backend Container (waits for database)
   ├─ Connect to database
   ├─ Run migrations
   ├─ Seed admin user
   └─ Start FastAPI server

3. Frontend Container (waits for backend)
   ├─ Start Nginx
   ├─ Serve React app
   └─ Proxy API requests to backend
```

## Environment Configuration

### Database
- DATABASE_URL: Connection string
- DB_NAME, DB_USER, DB_PASSWORD: Credentials

### Backend
- GROQ_API_KEY: GenAI service
- JWT_SECRET: Authentication
- TESSERACT_CMD: OCR binary path
- UPLOAD_DIR, PROCESSED_DIR: File storage

### Frontend
- VITE_API_URL: Backend endpoint (build time)

## Security Considerations

1. **Network Isolation**
   - Containers communicate via internal network
   - Only necessary ports exposed to host

2. **Secrets Management**
   - Environment variables in .env
   - Not committed to version control
   - Use Docker secrets in production

3. **Resource Limits**
   - CPU and memory limits in production
   - Prevents resource exhaustion

4. **Health Checks**
   - Automatic restart on failure
   - Ensures service availability

## Scaling Strategy

### Horizontal Scaling
```yaml
backend:
  deploy:
    replicas: 3
  # Add load balancer
```

### Vertical Scaling
```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 4G
```

## Monitoring

### Container Logs
```bash
docker-compose logs -f [service]
```

### Resource Usage
```bash
docker stats
```

### Health Status
```bash
docker-compose ps
```

## Backup Strategy

1. **Database**: pg_dump to SQL file
2. **Volumes**: Docker volume backup
3. **Configuration**: .env file backup
4. **Code**: Git repository

## Disaster Recovery

1. Stop services
2. Restore database from backup
3. Restore volumes if needed
4. Restart services
5. Verify functionality
