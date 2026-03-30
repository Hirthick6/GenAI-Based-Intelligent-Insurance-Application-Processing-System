# Docker Commands Cheatsheet

Quick reference for common Docker operations.

## 🚀 Service Management

```bash
# Start all services
docker-compose up -d

# Start with logs visible
docker-compose up

# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Stop specific service
docker-compose stop backend

# Start specific service
docker-compose start backend
```

## 📊 Monitoring

```bash
# View all logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# View last 100 lines
docker-compose logs --tail=100 backend

# Check service status
docker-compose ps

# Check resource usage
docker stats

# View container details
docker inspect tce-backend
```

## 🔨 Building

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend

# Build without cache
docker-compose build --no-cache

# Build and start
docker-compose up -d --build

# Pull latest base images
docker-compose pull
```

## 🗄️ Database Operations

```bash
# Access PostgreSQL shell
docker-compose exec database psql -U postgres -d tce_project

# Run SQL query
docker-compose exec database psql -U postgres -d tce_project -c "SELECT * FROM users;"

# Backup database
docker-compose exec database pg_dump -U postgres tce_project > backup.sql

# Restore database
docker-compose exec -T database psql -U postgres tce_project < backup.sql

# View database logs
docker-compose logs database

# Restart database
docker-compose restart database
```

## 🐚 Container Shell Access

```bash
# Access backend shell
docker-compose exec backend bash

# Access frontend shell
docker-compose exec frontend sh

# Access database shell
docker-compose exec database bash

# Run command in backend
docker-compose exec backend python --version

# Run command as root
docker-compose exec -u root backend apt-get update
```

## 📁 File Operations

```bash
# Copy file from container
docker cp tce-backend:/app/uploads/file.pdf ./local-file.pdf

# Copy file to container
docker cp ./local-file.pdf tce-backend:/app/uploads/

# View file in container
docker-compose exec backend cat /app/.env

# List files in container
docker-compose exec backend ls -la /app/uploads
```

## 🔍 Debugging

```bash
# View environment variables
docker-compose exec backend env

# Check network connectivity
docker-compose exec backend ping database
docker-compose exec frontend wget -O- http://backend:8000/health

# View container processes
docker-compose exec backend ps aux

# Check disk usage
docker-compose exec backend df -h

# View container logs since specific time
docker-compose logs --since 30m backend

# Follow logs with timestamps
docker-compose logs -f --timestamps backend
```

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes

# View disk usage
docker system df
```

## 🔄 Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend

# Force recreate containers
docker-compose up -d --force-recreate
```

## 📦 Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect docker_postgres_data

# Backup volume
docker run --rm -v docker_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v docker_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /

# Remove specific volume
docker volume rm docker_postgres_data
```

## 🌐 Network Management

```bash
# List networks
docker network ls

# Inspect network
docker network inspect docker_tce-network

# View connected containers
docker network inspect docker_tce-network | grep Name
```

## 🔐 Security

```bash
# Scan image for vulnerabilities
docker scan tce-backend

# View image layers
docker history tce-backend

# Check for secrets in image
docker run --rm -it tce-backend env
```

## 📈 Performance

```bash
# View real-time stats
docker stats

# View stats for specific container
docker stats tce-backend

# Export stats to file
docker stats --no-stream > stats.txt

# Check container resource limits
docker inspect tce-backend | grep -A 10 Resources
```

## 🎯 Development Mode

```bash
# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

## 🚀 Production Mode

```bash
# Start with production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View status
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

## 🔧 Troubleshooting

```bash
# Check Docker version
docker --version
docker-compose --version

# Check Docker info
docker info

# Test Docker installation
docker run hello-world

# View Docker events
docker events

# Check container health
docker inspect --format='{{.State.Health.Status}}' tce-backend

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' tce-backend
```

## 💡 Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Docker Compose shortcuts
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dcl='docker-compose logs -f'
alias dcp='docker-compose ps'
alias dcr='docker-compose restart'

# TCE specific
alias tce-start='cd docker && docker-compose up -d'
alias tce-stop='cd docker && docker-compose down'
alias tce-logs='cd docker && docker-compose logs -f'
alias tce-status='cd docker && docker-compose ps'
```

## 📱 Windows PowerShell

```powershell
# Create aliases in PowerShell profile
Set-Alias dc docker-compose
Set-Alias dcu 'docker-compose up -d'
Set-Alias dcd 'docker-compose down'

# View profile location
$PROFILE

# Edit profile
notepad $PROFILE
```
