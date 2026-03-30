# 🚀 Start Your Docker Application

## ✅ Configuration Complete!

Your `.env` file has been created with your existing credentials.

## 📋 Quick Start Steps

### Option 1: Using the Start Script (Easiest)

Open Command Prompt or PowerShell in the `docker` folder and run:

```cmd
scripts\start.bat
```

### Option 2: Using Docker Compose Directly

```cmd
docker-compose up -d
```

### Option 3: Using Docker Desktop UI

1. Open Docker Desktop (already running ✅)
2. Click on "Images" in the left sidebar
3. Click "Build" or use the terminal commands above

## ⏱️ Wait Time

After starting, wait 30-60 seconds for all services to initialize.

## 🌐 Access Your Application

Once started, open your browser:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

**Default Login:**
- Email: `admin@tce.com`
- Password: `admin123`

## 📊 Check Status

View running containers:
```cmd
docker-compose ps
```

View logs:
```cmd
docker-compose logs -f
```

## 🛑 Stop Services

```cmd
docker-compose down
```

Or use:
```cmd
scripts\stop.bat
```

## 🔍 Troubleshooting

If services don't start:

1. **Check Docker Desktop is running** ✅ (You're good!)
2. **Check ports are available**:
   ```cmd
   netstat -ano | findstr "3000 8000 5432"
   ```
3. **View logs**:
   ```cmd
   docker-compose logs
   ```
4. **Restart Docker Desktop** if needed

## 📚 More Help

- Full documentation: `README.md`
- Step-by-step checklist: `GETTING_STARTED_CHECKLIST.md`
- Troubleshooting: `TROUBLESHOOTING.md`

---

**Ready? Run `scripts\start.bat` now!** 🎉
