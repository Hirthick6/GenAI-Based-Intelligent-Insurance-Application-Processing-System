# Getting Started Checklist

Complete this checklist to get your TCE application running with Docker.

## ☑️ Pre-Flight Checklist

### 1. Prerequisites
- [ ] Docker Desktop installed and running
- [ ] At least 4GB RAM available for Docker
- [ ] Ports 3000, 8000, and 5432 are available
- [ ] You have a Groq API key (get one at https://console.groq.com)

### 2. Initial Setup
- [ ] Navigate to the `docker/` folder
- [ ] Copy `.env.example` to `.env`
- [ ] Open `.env` in a text editor

### 3. Configure Environment Variables

**Required (Must Configure):**
- [ ] Set `GROQ_API_KEY` to your actual Groq API key
- [ ] Change `JWT_SECRET` to a strong random string (at least 32 characters)

**Optional (Can Leave Default):**
- [ ] Database credentials (DB_NAME, DB_USER, DB_PASSWORD)
- [ ] Port mappings (BACKEND_PORT, FRONTEND_PORT)
- [ ] Email settings (if using email processing)
- [ ] Debug mode (DEBUG=false for production)

### 4. Start Services

**Windows:**
- [ ] Open Command Prompt or PowerShell
- [ ] Run: `cd docker`
- [ ] Run: `scripts\start.bat`

**Linux/Mac:**
- [ ] Open Terminal
- [ ] Run: `cd docker`
- [ ] Run: `chmod +x scripts/*.sh`
- [ ] Run: `./scripts/start.sh`

**Or use Docker Compose directly:**
- [ ] Run: `docker-compose up -d`

### 5. Verify Services

- [ ] Wait 30-60 seconds for services to start
- [ ] Check status: `docker-compose ps`
- [ ] All services should show "healthy" or "running"

### 6. Access Application

- [ ] Open browser to http://localhost:3000
- [ ] You should see the TCE login page
- [ ] Try logging in with default credentials:
  - Email: `admin@tce.com`
  - Password: `admin123`

### 7. Test Backend API

- [ ] Open http://localhost:8000/docs
- [ ] You should see the FastAPI documentation
- [ ] Try the `/health` endpoint

### 8. Test Basic Functionality

- [ ] Login to the application
- [ ] Navigate to Upload page
- [ ] Try uploading a test PDF (optional)
- [ ] Check the Dashboard
- [ ] View Analytics page

## 🔍 Troubleshooting

If something doesn't work, check:

### Services Won't Start
- [ ] Docker Desktop is running
- [ ] Check logs: `docker-compose logs -f`
- [ ] Verify ports are available: `netstat -an | findstr "3000 8000 5432"`
- [ ] Check `.env` file exists and is configured

### Can't Access Frontend
- [ ] Check if frontend container is running: `docker-compose ps frontend`
- [ ] Check frontend logs: `docker-compose logs frontend`
- [ ] Try accessing backend directly: http://localhost:8000/health
- [ ] Clear browser cache and try again

### Database Connection Errors
- [ ] Check database is healthy: `docker-compose ps database`
- [ ] Check database logs: `docker-compose logs database`
- [ ] Verify DATABASE_URL in backend logs
- [ ] Restart database: `docker-compose restart database`

### Backend Errors
- [ ] Check GROQ_API_KEY is set correctly
- [ ] Check backend logs: `docker-compose logs backend`
- [ ] Verify all environment variables: `docker-compose exec backend env`
- [ ] Rebuild backend: `docker-compose up -d --build backend`

## 📚 Next Steps

Once everything is running:

### Immediate
- [ ] Change default admin password
- [ ] Create additional user accounts if needed
- [ ] Test uploading a sample insurance form
- [ ] Explore all features (Dashboard, Analytics, Chat)

### Configuration
- [ ] Set up email processing (if needed)
- [ ] Configure backup schedule
- [ ] Review security settings
- [ ] Customize application settings

### Production
- [ ] Follow DEPLOYMENT.md for production setup
- [ ] Set up SSL certificates
- [ ] Configure monitoring
- [ ] Set up automated backups
- [ ] Review security checklist

## 🎯 Success Criteria

You're ready to go when:
- ✅ All three containers are running and healthy
- ✅ Frontend loads at http://localhost:3000
- ✅ Backend API docs load at http://localhost:8000/docs
- ✅ You can login with default credentials
- ✅ Dashboard displays without errors

## 📞 Getting Help

If you're stuck:

1. **Check Documentation**
   - README.md - Complete documentation
   - TROUBLESHOOTING.md - Common issues
   - WINDOWS_SETUP.md - Windows-specific help

2. **View Logs**
   ```bash
   docker-compose logs -f
   ```

3. **Check Service Health**
   ```bash
   docker-compose ps
   ```

4. **Verify Configuration**
   - Check `.env` file
   - Verify Docker Desktop is running
   - Ensure ports are available

## 🎉 Congratulations!

Once you've completed this checklist, your TCE Insurance Document Processor is running in Docker!

**Quick Commands:**
- View logs: `docker-compose logs -f`
- Stop services: `docker-compose down`
- Restart: `docker-compose restart`
- Rebuild: `docker-compose up -d --build`

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

Enjoy your containerized application! 🚀
