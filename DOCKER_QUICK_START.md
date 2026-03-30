# 🚀 Docker Quick Start Commands

## Your Project Location
```
C:\All files\videos\TCEPROJECT
```

## ✅ Method 1: Navigate to Docker Folder First (Recommended)

Open Command Prompt and run:

```cmd
cd "C:\All files\videos\TCEPROJECT\docker"
scripts\start.bat
```

## ✅ Method 2: Run from Project Root

From `C:\All files\videos\TCEPROJECT`, run:

```cmd
docker\scripts\start.bat
```

## ✅ Method 3: Use Docker Compose Directly

From `C:\All files\videos\TCEPROJECT`, run:

```cmd
cd docker
docker-compose up -d
```

## 📊 Check Status

```cmd
cd docker
docker-compose ps
```

## 📋 View Logs

```cmd
cd docker
docker-compose logs -f
```

## 🛑 Stop Services

```cmd
cd docker
docker-compose down
```

## 🌐 Access After Starting

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Login: admin@tce.com / admin123

## ⏱️ Wait Time

First time: 5-10 minutes (downloads images)
After that: 30-60 seconds

---

**Quick Copy-Paste:**

```cmd
cd "C:\All files\videos\TCEPROJECT\docker"
docker-compose up -d
```

Then wait 60 seconds and open: http://localhost:3000
