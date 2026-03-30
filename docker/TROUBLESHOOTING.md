# Docker Troubleshooting Guide

## Common Issues

### 1. Port Already in Use
```bash
# Check what's using the port
netstat -ano | findstr :8000

# Change port in .env
BACKEND_PORT=8001
```

### 2. Database Connection Failed
```bash
# Check database health
docker-compose ps database

# View database logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### 3. Backend Won't Start
```bash
# Check environment variables
docker-compose exec backend env | grep DATABASE_URL

# View detailed logs
docker-compose logs backend --tail=100

# Rebuild container
docker-compose up -d --build backend
```

### 4. Frontend Shows 404
```bash
# Check nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Test backend connectivity
docker-compose exec frontend wget -O- http://backend:8000/health

# Rebuild frontend
docker-compose up -d --build frontend
```

### 5. Tesseract OCR Errors
```bash
# Verify Tesseract installation
docker-compose exec backend tesseract --version

# Check language data
docker-compose exec backend ls /usr/share/tesseract-ocr/*/tessdata/
```

## Reset Everything
```bash
# Stop and remove all containers, volumes, networks
docker-compose down -v
docker system prune -a

# Start fresh
docker-compose up -d --build
```

## Performance Issues
```bash
# Check resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Recommended: 4GB minimum
```

## Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```
