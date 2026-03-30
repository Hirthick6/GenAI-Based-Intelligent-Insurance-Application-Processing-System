# Overall Design - Insurance Document Processing System

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Design Philosophy](#design-philosophy)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [UI/UX Design](#uiux-design)
7. [Processing Pipeline Design](#processing-pipeline-design)
8. [Security Design](#security-design)
9. [Scalability Design](#scalability-design)
10. [Design Patterns Used](#design-patterns-used)

---

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         React Frontend (Port 3000)                    │   │
│  │  - Authentication UI                                  │   │
│  │  - Document Upload                                    │   │
│  │  - Document Viewer                                    │   │
│  │  - AI Chat Interface                                  │   │
│  │  - Analytics Dashboard                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      FastAPI Backend (Port 8000)                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  API Routes Layer                               │  │   │
│  │  │  - Authentication (/auth)                       │  │   │
│  │  │  - Applications (/applications)                 │  │   │
│  │  │  - Upload (/upload)                             │  │   │
│  │  │  - Chat (/chat)                                 │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Business Logic Layer                           │  │   │
│  │  │  - Pipeline Orchestrator                        │  │   │
│  │  │  - PDF Service                                  │  │   │
│  │  │  - OCR Service                                  │  │   │
│  │  │  - Docling Service                              │  │   │
│  │  │  - GenAI Service                                │  │   │
│  │  │  - Chat Service                                 │  │   │
│  │  │  - Validation Service                           │  │   │
│  │  │  - Scoring Service                              │  │   │
│  │  │  - Email Service                                │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ File Storage │  │ External APIs│      │
│  │   Database   │  │  (uploads/   │  │ - Groq API   │      │
│  │              │  │  processed)  │  │ - Email IMAP │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Upload → Frontend → Backend API → Pipeline Orchestrator
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
              PDF Service              OCR Service              Docling Service
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              ▼
                                        GenAI Service
                                              │
                                              ▼
                                    Validation Service
                                              │
                                              ▼
                                     Scoring Service
                                              │
                                              ▼
                                    Save to Database
                                              │
                                              ▼
                                    Return Results to User
```

---

## 2. Design Philosophy

### Core Principles

1. **Modularity**
   - Each service is independent and reusable
   - Clear separation of concerns
   - Easy to test and maintain

2. **Scalability**
   - Stateless API design
   - Horizontal scaling capability
   - Efficient resource utilization

3. **User-Centric**
   - Intuitive interface
   - Fast response times
   - Clear feedback and error messages

4. **Reliability**
   - Error handling at every layer
   - Graceful degradation
   - Comprehensive logging

5. **Security First**
   - JWT-based authentication
   - Role-based access control
   - Input validation and sanitization

---

## 3. Technology Stack

### Frontend Stack

```
┌─────────────────────────────────────┐
│         React 18                    │
│  - Modern hooks-based architecture  │
│  - Component reusability            │
│  - Virtual DOM for performance      │
└─────────────────────────────────────┘
              │
              ├─── React Router (Navigation)
              ├─── Axios (API Communication)
              ├─── Context API (State Management)
              └─── Vite (Build Tool)
```

**Why React?**
- Component-based architecture
- Large ecosystem
- Excellent performance
- Easy to learn and maintain

### Backend Stack

```
┌─────────────────────────────────────┐
│         FastAPI                     │
│  - Async/await support              │
│  - Automatic API documentation      │
│  - Type hints and validation        │
│  - High performance                 │
└─────────────────────────────────────┘
              │
              ├─── SQLAlchemy (ORM)
              ├─── Pydantic (Data Validation)
              ├─── JWT (Authentication)
              └─── Uvicorn (ASGI Server)
```

**Why FastAPI?**
- Modern Python framework
- Automatic OpenAPI documentation
- Built-in validation
- Excellent performance (comparable to Node.js)

### AI/ML Stack

```
┌─────────────────────────────────────┐
│    Groq API (Llama 3.3 70B)         │
│  - Ultra-fast inference (<1s)       │
│  - High accuracy                    │
│  - Cost-effective                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    Tesseract OCR                    │
│  - Open-source                      │
│  - Multi-language support           │
│  - High accuracy with preprocessing │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    Docling                          │
│  - Document structure analysis      │
│  - Table extraction                 │
│  - Layout understanding             │
└─────────────────────────────────────┘
```

### Database

```
┌─────────────────────────────────────┐
│         PostgreSQL                  │
│  - ACID compliance                  │
│  - JSON support                     │
│  - Excellent performance            │
│  - Mature and reliable              │
└─────────────────────────────────────┘
```

**Why PostgreSQL?**
- Robust and reliable
- JSON/JSONB support for flexible data
- Excellent query performance
- Strong community support

---

## 4. Database Design

### Entity Relationship Diagram

```
┌─────────────────┐
│     Users       │
│─────────────────│
│ id (PK)         │
│ email           │
│ password_hash   │
│ full_name       │
│ role            │
│ created_at      │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│    Applications         │
│─────────────────────────│
│ id (PK)                 │
│ application_id (Unique) │
│ email_subject           │
│ email_sender            │
│ status                  │
│ total_documents         │
│ total_pages             │
│ extracted_data (JSON)   │
│ validation_summary      │
│ confidence_score        │
│ created_at              │
└─────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│      Documents          │
│─────────────────────────│
│ id (PK)                 │
│ application_id (FK)     │
│ filename                │
│ document_type           │
│ file_path               │
│ total_pages             │
│ ocr_text                │
│ structured_data (JSON)  │
│ confidence_score        │
│ created_at              │
└─────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│        Pages            │
│─────────────────────────│
│ id (PK)                 │
│ document_id (FK)        │
│ page_number             │
│ image_path              │
│ ocr_text                │
│ ocr_confidence          │
│ word_count              │
│ created_at              │
└─────────────────────────┘

┌─────────────────────────┐
│   ExtractedFields       │
│─────────────────────────│
│ id (PK)                 │
│ application_id (FK)     │
│ field_name              │
│ field_value             │
│ field_category          │
│ confidence              │
│ is_validated            │
└─────────────────────────┘

┌─────────────────────────┐
│  ValidationResults      │
│─────────────────────────│
│ id (PK)                 │
│ application_id (FK)     │
│ rule_name               │
│ is_passed               │
│ severity                │
│ message                 │
│ details (JSON)          │
└─────────────────────────┘
```

### Key Design Decisions

1. **JSON Fields**: Used for flexible, schema-less data (extracted_data, structured_data)
2. **Cascading Deletes**: Deleting an application removes all related data
3. **Indexes**: On application_id, email, status for fast queries
4. **Timestamps**: All tables have created_at/updated_at for auditing

---

## 5. API Design

### RESTful API Structure

```
/api
├── /auth
│   ├── POST   /login          # User login
│   ├── POST   /signup         # User registration
│   └── GET    /me             # Get current user
│
├── /applications
│   ├── GET    /               # List all applications
│   ├── GET    /{id}           # Get application details
│   ├── DELETE /{id}           # Delete application
│   ├── GET    /{id}/fields    # Get extracted fields
│   ├── GET    /{id}/validation # Get validation results
│   └── POST   /{id}/chat      # Chat with document
│
├── /upload
│   └── POST   /               # Upload and process PDFs
│
├── /documents
│   ├── GET    /{id}/pages     # Get document pages
│   └── GET    /{id}/pdf       # Get original PDF
│
├── /stats
│   └── GET    /               # Get system statistics
│
└── /process-emails
    └── POST   /               # Process emails from inbox
```

### API Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Success",
  "status": 200
}
```

**Error Response:**
```json
{
  "detail": "Error message",
  "status": 400
}
```

### Authentication Flow

```
1. User Login
   POST /api/auth/login
   { email, password }
   ↓
2. Server Validates
   ↓
3. Generate JWT Token
   ↓
4. Return Token
   { token, user }
   ↓
5. Client Stores Token
   localStorage.setItem('token', token)
   ↓
6. Subsequent Requests
   Headers: { Authorization: 'Bearer <token>' }
```

---

## 6. UI/UX Design

### Design System

#### Color Palette

```
Primary Colors:
- Blue: #2563eb (Primary actions, links)
- Green: #059669 (Success, completed)
- Red: #dc2626 (Errors, failed)
- Yellow: #d97706 (Warnings, processing)
- Gray: #6b7280 (Text, borders)

Background Colors:
- White: #ffffff (Cards, containers)
- Light Gray: #f9fafb (Page background)
- Light Blue: #eff6ff (Highlights)

Text Colors:
- Dark: #111827 (Primary text)
- Medium: #374151 (Secondary text)
- Light: #9ca3af (Tertiary text)
```

#### Typography

```
Font Family: System fonts (Arial, Helvetica, sans-serif)

Font Sizes:
- Headings: 1.5rem - 2rem
- Body: 0.875rem - 1rem
- Small: 0.75rem - 0.85rem

Font Weights:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
```

#### Spacing System

```
Base Unit: 0.25rem (4px)

Scale:
- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
```

### Page Layouts

#### 1. Authentication Pages (Login/Signup)

```
┌─────────────────────────────────────┐
│                                     │
│         [Logo/Title]                │
│                                     │
│    ┌─────────────────────┐         │
│    │   Email Input       │         │
│    └─────────────────────┘         │
│    ┌─────────────────────┐         │
│    │   Password Input    │         │
│    └─────────────────────┘         │
│    ┌─────────────────────┐         │
│    │   [Login Button]    │         │
│    └─────────────────────┘         │
│                                     │
│    Don't have account? Signup      │
│                                     │
└─────────────────────────────────────┘
```

#### 2. Main Application Layout

```
┌─────────────────────────────────────────────────────┐
│  [Logo] Insurance Document Processor    [User Menu] │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │         Main Content Area               │
│          │                                          │
│ - Dash   │  ┌────────────────────────────────┐    │
│ - Apps   │  │                                │    │
│ - Upload │  │      Page Content              │    │
│ - Docs   │  │                                │    │
│ - Analyt │  │                                │    │
│ - Settings│  │                                │    │
│ - Logout │  │                                │    │
│          │  └────────────────────────────────┘    │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

#### 3. Document Viewer Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Library    APP-20260326032040-ED53B6AA2  │
├──────────────────────────┬──────────────────────────┤
│                          │  [Chat] [Search] [Data]  │
│   Document Preview       │  [Entities]              │
│                          │                          │
│   ┌──────────────────┐  │  ┌────────────────────┐ │
│   │                  │  │  │                    │ │
│   │   PDF/Image      │  │  │  Chat Interface    │ │
│   │   Display        │  │  │  or                │ │
│   │                  │  │  │  Search Results    │ │
│   │                  │  │  │  or                │ │
│   └──────────────────┘  │  │  Extracted Data    │ │
│                          │  │                    │ │
│   Application Info       │  └────────────────────┘ │
│   Processing Summary     │                          │
│   Documents Breakdown    │                          │
│                          │                          │
└──────────────────────────┴──────────────────────────┘
```

### UI Components

#### Cards
```css
background: #ffffff
border-radius: 12px
padding: 1.5rem
box-shadow: 0 1px 3px rgba(0,0,0,0.1)
border: 1px solid #e5e7eb
```

#### Buttons
```css
Primary:
  background: #2563eb
  color: #ffffff
  padding: 0.75rem 1.5rem
  border-radius: 8px
  
Secondary:
  background: #f3f4f6
  color: #374151
  padding: 0.75rem 1.5rem
  border-radius: 8px
```

#### Status Badges
```css
Completed: background: #d1fae5, color: #059669
Processing: background: #dbeafe, color: #2563eb
Failed: background: #fee2e2, color: #dc2626
```

---

## 7. Processing Pipeline Design

### Pipeline Flow

```
Step 1: PDF Upload
   ↓
Step 2: PDF Parsing (pdf2image)
   - Convert PDF to images
   - Extract metadata
   ↓
Step 3: Image Preprocessing
   - Grayscale conversion
   - Noise reduction
   - Contrast enhancement
   ↓
Step 4: OCR Processing (Tesseract)
   - Text extraction
   - Confidence scoring
   - Word-level analysis
   ↓
Step 5: Document Structuring (Docling)
   - Layout analysis
   - Section identification
   - Table extraction
   ↓
Step 6: AI Extraction (Groq)
   - Field extraction
   - Data normalization
   - Cross-document resolution
   ↓
Step 7: Validation
   - Required field check
   - Format validation
   - Business rule validation
   ↓
Step 8: Scoring
   - Confidence calculation
   - Completeness scoring
   - Quality assessment
   ↓
Step 9: Save to Database
   - Store all results
   - Update status
   ↓
Step 10: Return Results
```

### Error Handling Strategy

```
Try:
  Execute Pipeline Step
Catch Error:
  Log Error
  Mark Step as Failed
  Continue with Partial Results
  Return Error Details to User
```

---

## 8. Security Design

### Authentication & Authorization

```
┌─────────────────────────────────────┐
│   JWT Token-Based Authentication    │
│                                     │
│  1. User Login                      │
│  2. Server validates credentials    │
│  3. Generate JWT token              │
│  4. Token contains: user_id, role   │
│  5. Token expires in 24 hours       │
│  6. Client sends token in headers   │
│  7. Server validates token          │
└─────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

```
Admin Role:
  ✓ Upload documents
  ✓ View all applications
  ✓ Delete applications
  ✓ Process emails
  ✓ View analytics
  ✓ Manage users

Employee Role:
  ✓ Upload documents
  ✓ View all applications
  ✗ Delete applications
  ✗ Process emails
  ✓ View analytics
  ✗ Manage users
```

### Data Security

1. **Password Hashing**: bcrypt with salt
2. **SQL Injection Prevention**: Parameterized queries (SQLAlchemy)
3. **XSS Prevention**: Input sanitization
4. **CORS**: Configured for specific origins
5. **HTTPS**: Recommended for production

---

## 9. Scalability Design

### Horizontal Scaling

```
┌─────────────────────────────────────┐
│         Load Balancer               │
└─────────────────────────────────────┘
         │         │         │
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │Backend │ │Backend │ │Backend │
    │Instance│ │Instance│ │Instance│
    │   1    │ │   2    │ │   3    │
    └────────┘ └────────┘ └────────┘
         │         │         │
         └─────────┼─────────┘
                   ▼
         ┌─────────────────┐
         │   PostgreSQL    │
         │   (Primary)     │
         └─────────────────┘
```

### Caching Strategy

```
Level 1: Browser Cache
  - Static assets
  - API responses (short TTL)

Level 2: Application Cache
  - Frequently accessed data
  - User sessions

Level 3: Database Query Cache
  - Common queries
  - Aggregated statistics
```

### Async Processing

```
Synchronous:
  - User authentication
  - Simple queries
  - Real-time chat

Asynchronous:
  - Document processing
  - Email polling
  - Batch operations
```

---

## 10. Design Patterns Used

### 1. **Service Layer Pattern**
```
Controller → Service → Repository → Database
```
- Separation of concerns
- Reusable business logic
- Easy to test

### 2. **Repository Pattern**
```
Service → Repository (abstraction) → Database
```
- Database abstraction
- Easy to switch databases
- Testable without database

### 3. **Factory Pattern**
```
PipelineOrchestrator creates service instances
```
- Centralized object creation
- Easy to configure
- Dependency injection

### 4. **Strategy Pattern**
```
Different OCR strategies based on document type
```
- Flexible algorithms
- Easy to add new strategies
- Runtime selection

### 5. **Observer Pattern**
```
Pipeline steps notify progress
```
- Loose coupling
- Event-driven
- Real-time updates

### 6. **Singleton Pattern**
```
Database connection pool
```
- Single instance
- Resource efficiency
- Global access

---

## Design Decisions Summary

### Why These Choices?

1. **React + FastAPI**
   - Modern, performant stack
   - Large community support
   - Easy to find developers

2. **PostgreSQL**
   - Reliable and mature
   - JSON support for flexibility
   - Excellent performance

3. **Groq API**
   - Ultra-fast inference
   - Cost-effective
   - High accuracy

4. **Modular Architecture**
   - Easy to maintain
   - Scalable
   - Testable

5. **RESTful API**
   - Standard approach
   - Easy to consume
   - Well-documented

---

## Conclusion

The overall design focuses on:
- **Modularity**: Easy to extend and maintain
- **Performance**: Fast processing and response times
- **Scalability**: Can handle growing workload
- **Security**: Protected user data and access
- **User Experience**: Intuitive and responsive interface

This design provides a solid foundation for an enterprise-grade insurance document processing system.
