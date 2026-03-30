# 🔗 Docker Connection Diagram

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR COMPUTER                                │
│                                                                      │
│  You run: docker-compose up -d                                      │
│                    ↓                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              docker-compose.yml reads:                        │  │
│  │                                                               │  │
│  │  1. .env file (configuration)                                │  │
│  │  2. backend/Dockerfile (how to build backend)                │  │
│  │  3. frontend/Dockerfile (how to build frontend)              │  │
│  │  4. nginx.conf (how to route traffic)                        │  │
│  │  5. init-db/01-init.sql (database setup)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                    ↓                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         Docker creates 3 containers + 1 network:              │  │
│  │                                                               │  │
│  │  Network: tce-network (172.18.0.0/16)                        │  │
│  │     ↓                ↓                ↓                       │  │
│  │  Container 1     Container 2      Container 3                │  │
│  │  Database        Backend          Frontend                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Container 1: Database (PostgreSQL)

```
┌─────────────────────────────────────────────────────────┐
│  Container: tce-database                                 │
│  Image: postgres:15-alpine (from Docker Hub)            │
│  IP: 172.18.0.2 (internal)                              │
│  Hostname: "database" (DNS name)                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Environment Variables (from .env):            │    │
│  │  - POSTGRES_DB=tce_project                     │    │
│  │  - POSTGRES_USER=postgres                      │    │
│  │  - POSTGRES_PASSWORD=root                      │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  On First Start:                               │    │
│  │  Runs: init-db/01-init.sql                     │    │
│  │  - Creates extensions                          │    │
│  │  - Sets up permissions                         │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  Data Storage:                                 │    │
│  │  Volume: postgres_data                         │    │
│  │  Location: /var/lib/postgresql/data            │    │
│  │  (Persists even if container deleted)          │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  Port: 5432 (internal) → 5432 (your computer)          │
│  Access: localhost:5432 or database:5432 (internal)    │
└─────────────────────────────────────────────────────────┘
```

---

## Container 2: Backend (FastAPI)

```
┌─────────────────────────────────────────────────────────┐
│  Container: tce-backend                                  │
│  Built from: docker/backend/Dockerfile                   │
│  IP: 172.18.0.3 (internal)                              │
│  Hostname: "backend" (DNS name)                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Build Process (from Dockerfile):              │    │
│  │  1. FROM python:3.11-slim                      │    │
│  │  2. Install: tesseract-ocr, poppler-utils      │    │
│  │  3. COPY backend/requirements.txt              │    │
│  │  4. RUN pip install -r requirements.txt        │    │
│  │  5. COPY backend/ → /app/                      │    │
│  │  6. CMD uvicorn app.main:app                   │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  Environment Variables (from .env):            │    │
│  │  - DATABASE_URL=postgresql://postgres:root@    │    │
│  │    database:5432/tce_project                   │    │
│  │  - GROQ_API_KEY=gsk_xxx...                     │    │
│  │  - JWT_SECRET=xxx...                           │    │
│  │  - TESSERACT_CMD=/usr/bin/tesseract            │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  Connects to Database:                         │    │
│  │  postgresql://database:5432                    │    │
│  │  (uses service name "database")                │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  Data Storage (Volumes):                       │    │
│  │  - backend_uploads → /app/uploads              │    │
│  │  - backend_processed → /app/processed          │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  Port: 8000 (internal) → 8000 (your computer)          │
│  Access: localhost:8000 or backend:8000 (internal)     │
└─────────────────────────────────────────────────────────┘
```

---

## Container 3: Frontend (React + Nginx)

```
┌─────────────────────────────────────────────────────────┐
│  Container: tce-frontend                                 │
│  Built from: docker/frontend/Dockerfile (multi-stage)   │
│  IP: 172.18.0.4 (internal)                              │
│  Hostname: "frontend" (DNS name)                        │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  STAGE 1: Build (from Dockerfile)              │    │
│  │  1. FROM node:18-alpine as build               │    │
│  │  2. COPY frontend/package*.json                │    │
│  │  3. RUN npm ci                                 │    │
│  │  4. COPY frontend/ → /app/                     │    │
│  │  5. RUN npm run build → /app/dist              │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  STAGE 2: Serve (from Dockerfile)              │    │
│  │  1. FROM nginx:alpine                          │    │
│  │  2. COPY nginx.conf → /etc/nginx/conf.d/       │    │
│  │  3. COPY --from=build /app/dist → /usr/share/  │    │
│  │     nginx/html                                 │    │
│  │  4. CMD nginx -g "daemon off;"                 │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  ┌────────────────────────────────────────────────┐    │
│  │  Nginx Configuration (nginx.conf):             │    │
│  │                                                │    │
│  │  location / {                                  │    │
│  │    # Serve React app                           │    │
│  │    try_files $uri /index.html;                 │    │
│  │  }                                             │    │
│  │                                                │    │
│  │  location /api/ {                              │    │
│  │    # Proxy to backend                          │    │
│  │    proxy_pass http://backend:8000;             │    │
│  │  }                                             │    │
│  │                                                │    │
│  │  location /uploads/ {                          │    │
│  │    proxy_pass http://backend:8000;             │    │
│  │  }                                             │    │
│  └────────────────────────────────────────────────┘    │
│                    ↓                                     │
│  Port: 80 (internal) → 3000 (your computer)            │
│  Access: localhost:3000 or frontend:80 (internal)      │
└─────────────────────────────────────────────────────────┘
```

---

## Request Flow: User Uploads PDF

```
Step 1: User Action
┌──────────────────────────────────────┐
│  Browser (Your Computer)             │
│  http://localhost:3000               │
│  User clicks "Upload PDF"            │
└──────────────────────────────────────┘
            ↓ POST /api/upload

Step 2: Frontend Container
┌──────────────────────────────────────┐
│  Frontend Container (Nginx)          │
│  Receives: POST /api/upload          │
│  nginx.conf rule matches /api/*      │
│  Proxies to: http://backend:8000     │
└──────────────────────────────────────┘
            ↓ proxy_pass

Step 3: Backend Container
┌──────────────────────────────────────┐
│  Backend Container (FastAPI)         │
│  Receives: POST /api/upload          │
│  1. Saves file to /app/uploads       │
│     (volume: backend_uploads)        │
│  2. Runs Tesseract OCR               │
│  3. Saves images to /app/processed   │
│     (volume: backend_processed)      │
│  4. Needs to save to database...     │
└──────────────────────────────────────┘
            ↓ postgresql://database:5432

Step 4: Database Container
┌──────────────────────────────────────┐
│  Database Container (PostgreSQL)     │
│  Receives: INSERT INTO applications  │
│  Saves data to postgres_data volume  │
│  Returns: Success                    │
└──────────────────────────────────────┘
            ↓ Response

Step 5: Response Back
┌──────────────────────────────────────┐
│  Backend → Frontend → Browser        │
│  JSON response with application ID   │
│  Browser updates UI                  │
└──────────────────────────────────────┘
```

---

## Network Communication

```
┌─────────────────────────────────────────────────────────┐
│              Docker Network: tce-network                 │
│              Subnet: 172.18.0.0/16                      │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │  Frontend    │    │  Backend     │    │ Database │ │
│  │  172.18.0.4  │    │  172.18.0.3  │    │172.18.0.2│ │
│  │  :80         │    │  :8000       │    │  :5432   │ │
│  └──────────────┘    └──────────────┘    └──────────┘ │
│         │                   │                   │      │
│         │                   │                   │      │
│  DNS Resolution by Docker:                             │
│  - "frontend" → 172.18.0.4                             │
│  - "backend" → 172.18.0.3                              │
│  - "database" → 172.18.0.2                             │
│                                                          │
│  Communication:                                         │
│  - Frontend can call: http://backend:8000              │
│  - Backend can call: postgresql://database:5432        │
│  - All on same network, isolated from outside          │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure Connection

```
Your Project
├── docker/
│   ├── docker-compose.yml ────────┐ (Orchestrates everything)
│   │                               │
│   ├── .env ──────────────────────┤ (Configuration values)
│   │                               │
│   ├── backend/                    │
│   │   └── Dockerfile ─────────────┤ (Builds backend container)
│   │                               │
│   ├── frontend/                   │
│   │   ├── Dockerfile ─────────────┤ (Builds frontend container)
│   │   ├── Dockerfile.dev          │
│   │   └── nginx.conf ─────────────┤ (Routes traffic)
│   │                               │
│   └── init-db/                    │
│       └── 01-init.sql ────────────┤ (Initializes database)
│                                   │
├── backend/ ──────────────────────┤ (Copied into backend container)
│   ├── app/                        │
│   ├── requirements.txt            │
│   └── ...                         │
│                                   │
└── frontend/ ─────────────────────┘ (Built and served by frontend container)
    ├── src/
    ├── package.json
    └── ...
```

---

## Summary: The Connection Chain

1. **You run**: `docker-compose up -d`
2. **docker-compose.yml** reads `.env` for configuration
3. **Builds backend** using `docker/backend/Dockerfile`
4. **Builds frontend** using `docker/frontend/Dockerfile`
5. **Creates network** `tce-network` for communication
6. **Starts database** with `init-db/01-init.sql`
7. **Starts backend** (waits for database to be healthy)
8. **Starts frontend** (waits for backend)
9. **Nginx** uses `nginx.conf` to route traffic
10. **All containers** communicate via service names
11. **Data persists** in Docker volumes
12. **You access** via `localhost:3000`

Everything is connected through Docker's orchestration! 🎉
