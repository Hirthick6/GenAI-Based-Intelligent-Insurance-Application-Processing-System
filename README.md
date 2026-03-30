# TCE Document Processor - Multiple PDF Handling Pipeline

## Pipeline Flow

```
Email → Multiple PDFs → Batch Processing → Page-wise OCR → Docling → JSON → GenAI → Validation → PostgreSQL → React
```

## How to Run

### 1. Create the PostgreSQL Database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE tce_project;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your PostgreSQL password and other settings

# Run the backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

### Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs

---

## Architecture Overview

### How Multiple PDFs Are Handled

1. **Email with Multiple Attachments** - System detects all PDF attachments automatically
2. **Attachment Grouping** - All PDFs from one email assigned a unique Application ID
3. **Batch PDF Processing** - PDFs split into pages, converted to images
4. **Page-Level Preprocessing** - Grayscale, noise removal, thresholding, deskewing
5. **PyTesseract OCR** - Page-by-page text extraction with confidence scores
6. **Document Reconstruction** - Page OCR merged back per document, then per application
7. **Docling Structuring** - Section identification across documents
8. **JSON Generation** - Unified JSON per application
9. **GenAI Extraction** - AI-powered field extraction (Google Gemini / OpenAI)
10. **Validation** - Missing document/field detection, format validation
11. **API Integration** - Single API call per application
12. **PostgreSQL Storage** - Application, document, and page-level data
13. **React Frontend** - Multi-PDF display with page-wise preview

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Backend    | Python, FastAPI               |
| OCR        | PyTesseract                   |
| Document AI| Docling                       |
| GenAI      | Google Gemini / OpenAI GPT    |
| Database   | PostgreSQL + SQLAlchemy       |
| Frontend   | React + Vite                  |

## Project Structure

```
TCEPROJECT/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── config.py                # Environment configuration
│   │   ├── database.py              # PostgreSQL connection
│   │   ├── models/models.py         # SQLAlchemy models
│   │   ├── schemas/schemas.py       # Pydantic schemas
│   │   ├── services/
│   │   │   ├── email_service.py     # IMAP email processing
│   │   │   ├── pdf_service.py       # PDF batch processing
│   │   │   ├── ocr_service.py       # PyTesseract OCR
│   │   │   ├── docling_service.py   # Document structuring
│   │   │   ├── genai_service.py     # AI field extraction
│   │   │   ├── validation_service.py# Data validation
│   │   │   └── pipeline.py          # Pipeline orchestrator
│   │   └── api/routes.py            # REST API endpoints
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ApplicationList.jsx
│   │   │   ├── ApplicationDetail.jsx
│   │   │   └── Upload.jsx
│   │   └── services/api.js
│   └── package.json
└── README.md
```

## PostgreSQL Tables

| Table | Stores |
|---|---|
| `applications` | Application-level data (ID, status, email info, extracted data) |
| `documents` | Document-level metadata (filename, type, OCR text, confidence) |
| `pages` | Page-level OCR references (page number, text, confidence) |
| `extracted_fields` | Individual extracted fields with confidence scores |
| `validation_results` | Validation check results per application |
| `email_logs` | Email processing audit trail |

Tables are created automatically on first run.

## API Endpoints

| Method | Endpoint | Description |
|--------|---|---|
| POST | `/api/upload` | Upload multiple PDFs |
| POST | `/api/process-emails` | Process emails from inbox |
| GET | `/api/applications` | List all applications |
| GET | `/api/applications/{id}` | Get application with all documents/pages |
| DELETE | `/api/applications/{id}` | Delete application |
| GET | `/api/applications/{id}/validation` | Get validation results |
| GET | `/api/applications/{id}/fields` | Get extracted fields |
| GET | `/api/stats` | Pipeline statistics |
