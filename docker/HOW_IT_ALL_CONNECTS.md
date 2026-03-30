# 🔗 How Docker Files Connect Together

## Overview: The Connection Flow

```
docker-compose.yml (Orchestrator)
        ↓
    Reads .env file
        ↓
    Creates 3 Services:
        ↓
    ┌───────────┬────────────┬──────────────┐
    ↓           ↓            ↓              ↓
Database    Backend      Frontend      Network
Container   Container    Container     (tce-network)
    ↓           ↓            ↓
Uses        Uses         Uses
postgres    backend/     frontend/
image       Dockerfile   Dockerfile
```

---

## 1️⃣ The Orchestrator: docker-compose.yml

**Role**: Master configuration that connects everything

**What it does:**
1. Reads environment variables from `.env`
2. Defines 3 services (database, backend, frontend)
3. Creates a network for them to communicate
4. Creates volumes for data persistence
5. Sets up dependencies (backend waits for database, frontend waits for backend)

**Key Connections:**

```yaml
services:
  database:
    image: postgres:15-alpine          # Uses official PostgreSQL image
    environment:
      POSTGRES_DB: ${DB_NAME}          # From .env file
    networks:
      - tce-network                    # Connects to network
    volumes:
      - postgres_data:/var/lib/...     # Persistent storage
      - ./init-db:/docker-entrypoint-initdb.d  # Runs 01-init.sql

  backend:
    build:
      context: ..                      # Project root
      dockerfile: docker/backend/Dockerfile  # ← Uses this Dockerfile
    environment:
      DATABASE_URL: postgresql://...@database:5432/...  # ← Connects to database
    depends_on:
      database:
        condition: service_healthy     # Waits for database
    networks:
      - tce-network                    # Same network as database

  frontend:
    build:
      context: ..
      dockerfile: docker/frontend/Dockerfile  # ← Uses this Dockerfile
    depends_on:
      - backend                        # Waits for backend
    networks:
      - tce-network                    # Same network
```

---

## 2️⃣ Backend Connection: docker/backend/Dockerfile

**Role**: Builds the Python/FastAPI backend container

**Connection Flow:**

```
docker-compose.yml
    ↓ (says: build backend using this Dockerfile)
backend/Dockerfile
    ↓ (starts with base image)
FROM python:3.11-slim
    ↓ (installs system dependencies)
RUN apt-get install tesseract-ocr poppler-utils...
    ↓ (copies requirements)
COPY backend/requirements.txt .
    ↓ (installs Python packages)
RUN pip install -r requirements.txt
    ↓ (copies application code)
COPY backend/ .
    ↓ (exposes port)
EXPOSE 8000
    ↓ (starts application)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**How it connects to database:**
- Environment variable `DATABASE_URL` from docker-compose.yml
- Format: `postgresql://postgres:root@database:5432/tce_project`
- `database` is the service name (Docker DNS resolves it)

**How it connects to frontend:**
- Frontend sends requests to `http://backend:8000`
- Nginx proxies `/api/` requests to backend

---

## 3️⃣ Frontend Connection: docker/frontend/Dockerfile

**Role**: Builds the React frontend container (multi-stage)

**Connection Flow:**

```
docker-compose.yml
    ↓ (says: build frontend using this Dockerfile)
frontend/Dockerfile
    ↓ STAGE 1: Build
FROM node:18-alpine as build
    ↓ (copies package files)
COPY frontend/package*.json ./
    ↓ (installs dependencies)
RUN npm ci
    ↓ (copies source code)
COPY frontend/ .
    ↓ (builds React app)
RUN npm run build
    ↓ (creates /app/dist folder)
    
    ↓ STAGE 2: Serve
FROM nginx:alpine
    ↓ (copies nginx config)
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
    ↓ (copies built files from stage 1)
COPY --from=build /app/dist /usr/share/nginx/html
    ↓ (starts nginx)
CMD ["nginx", "-g", "daemon off;"]
```

**How it connects to backend:**
- Nginx configuration (`nginx.conf`) proxies API requests
- When browser requests `/api/*`, Nginx forwards to `http://backend:8000`

---

## 4️⃣ Nginx Configuration: docker/frontend/nginx.conf

**Role**: Routes traffic between frontend and backend

**Connection Logic:**

```nginx
server {
    listen 80;
    
    # Serve React app
    location / {
        try_files $uri $uri/ /index.html;  # React Router support
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000;    # ← Connects to backend service
        proxy_set_header Host $host;
        # ... other headers
    }
    
    # Proxy file uploads/processed to backend
    location /uploads/ {
        proxy_pass http://backend:8000;
    }
    
    location /processed/ {
        proxy_pass http://backend:8000;
    }
}
```

**Why `http://backend:8000` works:**
- Docker creates internal DNS
- Service name `backend` resolves to backend container IP
- All containers on `tce-network` can communicate

---

## 5️⃣ Environment Variables: .env

**Role**: Configuration values for all services

**Connection:**

```
.env file
    ↓ (read by docker-compose.yml)
docker-compose.yml
    ↓ (passes to containers as environment variables)
Containers use them:
    ↓
Backend: DATABASE_URL, GROQ_API_KEY, JWT_SECRET
Database: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
Ports: BACKEND_PORT, FRONTEND_PORT
```

**Example Flow:**

```env
# In .env
DB_NAME=tce_project
DB_USER=postgres
DB_PASSWORD=root
GROQ_API_KEY=gsk_xxx...
```

```yaml
# In docker-compose.yml
backend:
  environment:
    DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/${DB_NAME}
    GROQ_API_KEY: ${GROQ_API_KEY}
```

```python
# In backend/app/config.py
DATABASE_URL = os.getenv("DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
```

---

## 6️⃣ Database Initialization: init-db/01-init.sql

**Connection:**

```
docker-compose.yml
    ↓ (mounts init-db folder)
volumes:
  - ./init-db:/docker-entrypoint-initdb.d
    ↓ (PostgreSQL automatically runs .sql files on first start)
01-init.sql executes
    ↓ (creates extensions, sets permissions)
Database ready for backend
```

---

## 7️⃣ Docker Network: tce-network

**Role**: Allows containers to communicate

**How it works:**

```
docker-compose.yml creates network:
    ↓
networks:
  tce-network:
    driver: bridge
    ↓
All services join this network:
    ↓
services:
  database:
    networks: [tce-network]
  backend:
    networks: [tce-network]
  frontend:
    networks: [tce-network]
    ↓
Docker provides internal DNS:
    ↓
- "database" → 172.18.0.2
- "backend" → 172.18.0.3
- "frontend" → 172.18.0.4
    ↓
Containers can reach each other by name:
- backend connects to: postgresql://database:5432
- frontend connects to: http://backend:8000
```

---

## 8️⃣ Volumes: Data Persistence

**Connection:**

```
docker-compose.yml defines volumes:
    ↓
volumes:
  postgres_data:        # Database files
  backend_uploads:      # Uploaded PDFs
  backend_processed:    # Processed images
    ↓
Services mount these volumes:
    ↓
database:
  volumes:
    - postgres_data:/var/lib/postgresql/data
backend:
  volumes:
    - backend_uploads:/app/uploads
    - backend_processed:/app/processed
    ↓
Data persists even if containers are deleted
```

---

## 9️⃣ Complete Request Flow

**Example: User uploads a PDF**

```
1. Browser (localhost:3000)
   ↓ POST /api/upload
   
2. Frontend Container (Nginx)
   ↓ (nginx.conf proxies /api/* to backend)
   ↓ proxy_pass http://backend:8000
   
3. Backend Container (FastAPI)
   ↓ Receives file
   ↓ Saves to /app/uploads (volume: backend_uploads)
   ↓ Processes with Tesseract OCR
   ↓ Saves images to /app/processed (volume: backend_processed)
   ↓ Connects to database
   ↓ postgresql://database:5432
   
4. Database Container (PostgreSQL)
   ↓ Stores application data
   ↓ Data saved to volume: postgres_data
   
5. Backend returns response
   ↓ JSON response
   
6. Frontend receives response
   ↓ Updates UI
   
7. Browser shows result
```

---

## 🔟 Port Mapping

**How external access works:**

```
Your Computer (Host)
    ↓
localhost:3000 → Frontend Container:80
localhost:8000 → Backend Container:8000
localhost:5432 → Database Container:5432
    ↓
Defined in docker-compose.yml:
    ↓
frontend:
  ports:
    - "3000:80"      # Host:Container
backend:
  ports:
    - "8000:8000"
database:
  ports:
    - "5432:5432"
```

---

## 📊 Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Computer (Host)                      │
│                                                              │
│  Browser → localhost:3000                                    │
│                    ↓                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Docker Network (tce-network)                  │  │
│  │                                                       │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌────────┐ │  │
│  │  │  Frontend    │───▶│  Backend     │───▶│Database│ │  │
│  │  │  (Nginx)     │    │  (FastAPI)   │    │(Postgres)│ │
│  │  │              │    │              │    │        │ │  │
│  │  │ Built from:  │    │ Built from:  │    │ Uses:  │ │  │
│  │  │ frontend/    │    │ backend/     │    │ postgres│ │
│  │  │ Dockerfile   │    │ Dockerfile   │    │ image  │ │  │
│  │  │              │    │              │    │        │ │  │
│  │  │ Uses:        │    │ Connects via:│    │ Init:  │ │  │
│  │  │ nginx.conf   │    │ DATABASE_URL │    │ 01-init│ │
│  │  │              │    │ from .env    │    │ .sql   │ │  │
│  │  └──────────────┘    └──────────────┘    └────────┘ │  │
│  │         ↓                    ↓                  ↓    │  │
│  │    (ephemeral)        (uploads vol)      (data vol) │  │
│  │                       (processed vol)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  All orchestrated by: docker-compose.yml                    │
│  Configuration from: .env                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

1. **docker-compose.yml** is the master orchestrator
2. **Dockerfiles** define how to build each container
3. **.env** provides configuration values
4. **Docker network** enables container-to-container communication
5. **Volumes** persist data across container restarts
6. **nginx.conf** routes frontend requests to backend
7. **Service names** act as hostnames (database, backend, frontend)
8. **Port mapping** exposes services to your computer

Everything is connected through Docker's networking and orchestration!
