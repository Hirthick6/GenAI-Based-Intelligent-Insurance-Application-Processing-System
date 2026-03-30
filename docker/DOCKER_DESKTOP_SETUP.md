# 🐳 Docker Desktop Setup Guide

## Step-by-Step Instructions for Docker Desktop

### ✅ Prerequisites (Already Done!)
- Docker Desktop is installed and running ✅
- Configuration file (.env) is created ✅

---

## 🚀 Method 1: Using Terminal (Recommended)

### Step 1: Open Terminal in Docker Desktop

1. In Docker Desktop, click the **terminal icon** (bottom left)
2. Or open **Command Prompt** / **PowerShell** separately

### Step 2: Navigate to Docker Folder

```cmd
cd path\to\your\project\docker
```

For example:
```cmd
cd C:\Users\YourName\Documents\tce-project\docker
```

### Step 3: Start Services

```cmd
docker-compose up -d
```

The `-d` flag runs containers in the background (detached mode).

### Step 4: Monitor Progress

Watch the build and startup process:
```cmd
docker-compose logs -f
```

Press `Ctrl+C` to stop viewing logs (containers keep running).

---

## 🖱️ Method 2: Using Docker Desktop UI

### Step 1: Open Terminal

Click the terminal icon at the bottom of Docker Desktop.

### Step 2: Navigate and Build

```cmd
cd path\to\your\project\docker
docker-compose up -d
```

### Step 3: View in Containers Tab

1. Click **"Containers"** in the left sidebar
2. You should see 3 containers:
   - `tce-frontend`
   - `tce-backend`
   - `tce-database`

### Step 4: Check Container Status

Each container should show:
- 🟢 Green dot = Running
- Status: "Running"
- Health: "Healthy" (after ~30 seconds)

---

## 📊 What You'll See in Docker Desktop

### Containers Tab
```
Name              Status    Ports
tce-frontend      Running   0.0.0.0:3000->80/tcp
tce-backend       Running   0.0.0.0:8000->8000/tcp
tce-database      Running   0.0.0.0:5432->5432/tcp
```

### Images Tab
After building, you'll see:
- `docker-frontend`
- `docker-backend`
- `postgres:15-alpine`
- `node:18-alpine`
- `python:3.11-slim`

### Volumes Tab
You'll see 3 volumes:
- `docker_postgres_data` (database files)
- `docker_backend_uploads` (uploaded PDFs)
- `docker_backend_processed` (processed images)

---

## 🎯 Quick Actions in Docker Desktop

### View Logs
1. Click on a container name
2. Click **"Logs"** tab
3. See real-time output

### Open Terminal in Container
1. Click on a container
2. Click **"Terminal"** or **"Exec"** tab
3. Run commands inside the container

### Restart a Container
1. Click on a container
2. Click the **restart icon** (circular arrow)

### Stop All Containers
1. Go to **Containers** tab
2. Click the **stop icon** for each container
3. Or use terminal: `docker-compose down`

---

## 🌐 Access Your Application

After containers are running (30-60 seconds):

1. **Open Browser**
2. **Go to**: http://localhost:3000
3. **Login with**:
   - Email: `admin@tce.com`
   - Password: `admin123`

### Test Backend API
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

## 🔍 Troubleshooting in Docker Desktop

### Container Won't Start

1. **Click on the container**
2. **View Logs tab**
3. Look for error messages
4. Common issues:
   - Port already in use
   - Missing environment variables
   - Build errors

### Port Conflicts

If you see "port already in use":

**Option A: Stop conflicting service**
```cmd
# Find what's using the port
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

**Option B: Change ports in .env**
```env
BACKEND_PORT=8001
FRONTEND_PORT=3001
```

### Rebuild After Changes

If you modify code:
```cmd
docker-compose up -d --build
```

Or in Docker Desktop:
1. Stop containers
2. Delete containers
3. Run `docker-compose up -d` again

---

## 📈 Resource Settings

### Allocate More Resources (If Slow)

1. Click **Settings** (gear icon)
2. Go to **Resources**
3. Adjust:
   - **Memory**: 4GB minimum (8GB recommended)
   - **CPUs**: 2 minimum (4 recommended)
   - **Disk**: 20GB minimum
4. Click **Apply & Restart**

---

## 🛑 Stop Everything

### Using Terminal
```cmd
docker-compose down
```

### Using Docker Desktop
1. Go to **Containers** tab
2. Click **stop** on each container
3. Or click the **trash icon** to remove them

### Clean Up Everything (Including Data)
```cmd
docker-compose down -v
```
⚠️ This deletes all data including database!

---

## ✅ Success Checklist

- [ ] Docker Desktop is running
- [ ] Navigated to `docker/` folder
- [ ] Ran `docker-compose up -d`
- [ ] All 3 containers show "Running" status
- [ ] Can access http://localhost:3000
- [ ] Can login with admin credentials

---

## 🎉 You're Done!

Your TCE Insurance Document Processor is now running in Docker!

**Next Steps:**
1. Upload a test PDF insurance form
2. View processing results
3. Check the Analytics dashboard
4. Test the chat functionality

**Need Help?**
- View logs: `docker-compose logs -f`
- Check status: `docker-compose ps`
- Read: `TROUBLESHOOTING.md`
