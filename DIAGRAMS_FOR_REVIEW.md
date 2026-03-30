# Diagrams for Project Review

## How to Create These Diagrams

You can use these tools:
- **Draw.io** (diagrams.net) - Free, web-based
- **Lucidchart** - Professional diagrams
- **Microsoft Visio** - If available
- **PowerPoint** - Simple diagrams
- **Excalidraw** - Hand-drawn style

---

## 1. System Architecture Diagram

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │              React Frontend                         │     │
│  │  • Login/Signup Pages                              │     │
│  │  • Document Library                                │     │
│  │  • Document Viewer                                 │     │
│  │  • AI Chat Interface                               │     │
│  │  • Analytics Dashboard                             │     │
│  │                                                     │     │
│  │  Port: 3000                                        │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API (HTTPS)
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │           FastAPI Backend                           │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  API Layer                                   │  │     │
│  │  │  • Authentication API                        │  │     │
│  │  │  • Document Processing API                   │  │     │
│  │  │  • Chat API                                  │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │  Service Layer                               │  │     │
│  │  │  • Pipeline Orchestrator                     │  │     │
│  │  │  • PDF Service                               │  │     │
│  │  │  • OCR Service (Tesseract)                   │  │     │
│  │  │  • Docling Service                           │  │     │
│  │  │  • GenAI Service (Groq)                      │  │     │
│  │  │  • Chat Service                              │  │     │
│  │  │  • Validation Service                        │  │     │
│  │  │  • Scoring Service                           │  │     │
│  │  └──────────────────────────────────────────────┘  │     │
│  │                                                     │     │
│  │  Port: 8000                                        │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL Queries
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ File Storage │  │ External APIs│      │
│  │   Database   │  │              │  │              │      │
│  │              │  │ • uploads/   │  │ • Groq API   │      │
│  │ • Users      │  │ • processed/ │  │ • Email IMAP │      │
│  │ • Apps       │  │              │  │              │      │
│  │ • Documents  │  │              │  │              │      │
│  │ • Pages      │  │              │  │              │      │
│  │ • Fields     │  │              │  │              │      │
│  │              │  │              │  │              │      │
│  │ Port: 5432   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

**Colors to Use:**
- Presentation Tier: Light Blue (#E3F2FD)
- Application Tier: Light Green (#E8F5E9)
- Data Tier: Light Orange (#FFF3E0)

---

## 2. Document Processing Pipeline

```
┌─────────────┐
│   START     │
│ User Upload │
│     PDF     │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Step 1: Receive    │
│  PDF Files          │
│  Time: ~1-2 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 2: Parse PDF  │
│  Convert to Images  │
│  Time: ~3-5 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 3: Preprocess │
│  Image Enhancement  │
│  Time: ~2-3 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 4: OCR        │
│  Tesseract Extract  │
│  Time: ~5-8 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 5: Structure  │
│  Docling Analysis   │
│  Time: ~5-8 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 6: AI Extract │
│  Groq Field Extract │
│  Time: ~3-5 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 7: Validate   │
│  Business Rules     │
│  Time: ~1-2 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 8: Score      │
│  Confidence Calc    │
│  Time: ~1 sec       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Step 9: Save       │
│  Store in Database  │
│  Time: ~1-2 sec     │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│    END      │
│   Results   │
│   to User   │
└─────────────┘

Total Time: 20-35 seconds
```

**Colors:**
- Input/Output: Blue
- Processing Steps: Green
- AI Steps: Purple
- Database: Orange

---

## 3. Database Schema (ER Diagram)

```
┌─────────────────┐
│     Users       │
│─────────────────│
│ • id (PK)       │
│ • email         │
│ • password_hash │
│ • full_name     │
│ • role          │
│ • created_at    │
└─────────────────┘
         │
         │ 1:N (created_by)
         ▼
┌─────────────────────────┐
│    Applications         │
│─────────────────────────│
│ • id (PK)               │
│ • application_id        │◄────┐
│ • email_subject         │     │
│ • status                │     │
│ • total_documents       │     │
│ • extracted_data (JSON) │     │
│ • confidence_score      │     │
│ • created_at            │     │
└─────────────────────────┘     │
         │                       │
         │ 1:N                   │
         ▼                       │
┌─────────────────────────┐     │
│      Documents          │     │
│─────────────────────────│     │
│ • id (PK)               │     │
│ • application_id (FK)   │─────┘
│ • filename              │
│ • document_type         │
│ • file_path             │
│ • ocr_text              │
│ • confidence_score      │
└─────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│        Pages            │
│─────────────────────────│
│ • id (PK)               │
│ • document_id (FK)      │
│ • page_number           │
│ • image_path            │
│ • ocr_text              │
│ • ocr_confidence        │
└─────────────────────────┘

┌─────────────────────────┐
│   ExtractedFields       │
│─────────────────────────│
│ • id (PK)               │
│ • application_id (FK)   │─────┐
│ • field_name            │     │
│ • field_value           │     │
│ • confidence            │     │
└─────────────────────────┘     │
                                │
┌─────────────────────────┐     │
│  ValidationResults      │     │
│─────────────────────────│     │
│ • id (PK)               │     │
│ • application_id (FK)   │─────┘
│ • rule_name             │
│ • is_passed             │
│ • message               │
└─────────────────────────┘
```

**Relationships:**
- Solid line: Foreign Key
- Arrow: Direction of relationship
- 1:N: One-to-Many

---

## 4. User Flow Diagram

### Document Upload Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Login Page     │
│  Enter Creds    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Dashboard      │
│  View Options   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Upload Page    │
│  Select PDFs    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Processing     │
│  Show Progress  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Results Page   │
│  View Extracted │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Chat with Doc  │
│  Ask Questions  │
└─────────────────┘
```

### Chat Interaction Flow

```
User Types Question
       │
       ▼
Frontend Sends to API
       │
       ▼
Backend Receives
       │
       ▼
Get Document Context
       │
       ▼
Call Groq API
       │
       ▼
Clean Answer
       │
       ▼
Return to Frontend
       │
       ▼
Display to User
```

---

## 5. Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  React   │  │  React   │  │  Axios   │             │
│  │   18     │  │  Router  │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐                            │
│  │ Context  │  │   Vite   │                            │
│  │   API    │  │  (Build) │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    BACKEND STACK                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ FastAPI  │  │SQLAlchemy│  │ Pydantic │             │
│  │          │  │   ORM    │  │Validation│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   JWT    │  │ Uvicorn  │  │  Python  │             │
│  │   Auth   │  │  Server  │  │   3.11   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     AI/ML STACK                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Groq   │  │Tesseract │  │ Docling  │             │
│  │  Llama   │  │   OCR    │  │ Document │             │
│  │ 3.3 70B  │  │          │  │ Analysis │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    DATABASE STACK                        │
│  ┌──────────┐  ┌──────────┐                            │
│  │PostgreSQL│  │   File   │                            │
│  │ Database │  │  Storage │                            │
│  └──────────┘  └──────────┘                            │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
│                                                          │
│  Layer 1: Authentication                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  • JWT Token-based                             │    │
│  │  • Password Hashing (bcrypt)                   │    │
│  │  • Token Expiration (24 hours)                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 2: Authorization                                 │
│  ┌────────────────────────────────────────────────┐    │
│  │  • Role-Based Access Control (RBAC)            │    │
│  │  • Admin vs Employee permissions               │    │
│  │  • Route-level protection                      │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 3: Data Protection                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  • SQL Injection Prevention                    │    │
│  │  • XSS Protection                              │    │
│  │  • Input Validation                            │    │
│  │  • CORS Configuration                          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Layer 4: Transport Security                            │
│  ┌────────────────────────────────────────────────┐    │
│  │  • HTTPS (Production)                          │    │
│  │  • Secure Headers                              │    │
│  │  • API Rate Limiting                           │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │           Load Balancer / Nginx                │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│         ┌───────────┼───────────┐                       │
│         ▼           ▼           ▼                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Frontend │ │ Frontend │ │ Frontend │               │
│  │Instance 1│ │Instance 2│ │Instance 3│               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │           API Gateway / Load Balancer          │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│         ┌───────────┼───────────┐                       │
│         ▼           ▼           ▼                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Backend  │ │ Backend  │ │ Backend  │               │
│  │Instance 1│ │Instance 2│ │Instance 3│               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                     │                                    │
│                     ▼                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │         PostgreSQL (Primary + Replica)         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         File Storage (S3 / Cloud Storage)      │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Performance Metrics Visualization

### Processing Time Breakdown (Pie Chart)

```
PDF Parsing: 20%
OCR Processing: 30%
AI Extraction: 25%
Validation: 10%
Database Save: 10%
Other: 5%
```

### Accuracy Metrics (Bar Chart)

```
OCR Accuracy:        ████████████████████ 95%
Extraction Accuracy: ██████████████████   90%
Classification:      ████████████████████ 98%
Overall:             ███████████████████  92%
```

### Response Time (Line Chart)

```
Chat Response:     <1 second
API Response:      50-200ms
Page Load:         <2 seconds
Document Process:  20-30 seconds
```

---

## Tools to Create These Diagrams

### Recommended: Draw.io (diagrams.net)
1. Go to https://app.diagrams.net/
2. Choose "Create New Diagram"
3. Use shapes from left panel
4. Copy the ASCII art above as reference
5. Export as PNG/PDF

### Alternative: Lucidchart
1. Go to https://www.lucidchart.com/
2. Sign up for free account
3. Create new diagram
4. Use templates or start from scratch

### Quick Option: PowerPoint
1. Open PowerPoint
2. Insert → SmartArt
3. Choose appropriate layout
4. Customize colors and text

---

## Color Scheme for All Diagrams

**Primary Colors:**
- Blue: #2563EB (Primary elements)
- Green: #059669 (Success/Completed)
- Orange: #F59E0B (Processing/Warning)
- Red: #DC2626 (Error/Failed)
- Purple: #7C3AED (AI/ML components)

**Background Colors:**
- Light Blue: #EFF6FF
- Light Green: #ECFDF5
- Light Orange: #FEF3C7
- Light Gray: #F9FAFB

**Text Colors:**
- Dark: #111827
- Medium: #6B7280
- Light: #9CA3AF

---

## Diagram Checklist

- [ ] System Architecture (3-tier)
- [ ] Processing Pipeline Flow
- [ ] Database ER Diagram
- [ ] User Flow Diagram
- [ ] Technology Stack
- [ ] Security Architecture
- [ ] Deployment Architecture
- [ ] Performance Charts

**Estimated Time**: 2-3 hours to create all diagrams

Good luck! 🎨
