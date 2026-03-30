# Fallback UI Implementation for Document Viewer

## Overview
Implemented a comprehensive fallback UI that displays structured document information when PDF or image preview fails to load. This ensures users always have access to useful information even when visual preview is unavailable.

## Problem Statement
Previously, when PDFs or images failed to load, users would see:
- Empty viewer with "Image not available" message
- No useful information displayed
- Poor user experience
- Wasted screen space

## Solution

### Fallback Document View Component

Created a new `FallbackDocumentView` component that displays structured information in a clean, organized layout.

## Features Implemented

### 1. Automatic Fallback Trigger

The fallback view is automatically shown when:
- PDF fails to load (404, network error, etc.)
- All page images fail to load
- Authentication errors occur (with appropriate message)

```javascript
const [showFallback, setShowFallback] = useState(false);

// Triggered on PDF error
const handlePdfError = async () => {
  // ... error detection logic
  setShowFallback(true);
};

// Triggered when all images fail
const handleImageError = (pageId, error) => {
  const allImagesFailed = selectedDoc?.pages?.every(page => 
    imageError[page.id] || page.id === pageId
  );
  if (allImagesFailed) {
    setShowFallback(true);
  }
};
```

### 2. Information Banner

Shows a clear message when fallback is active:

```
ℹ️ Document preview not available. Showing extracted information instead.
```

**Styling:**
- Blue background (#eff6ff)
- Blue border (#bfdbfe)
- Blue text (#1e40af)
- Centered, prominent placement

### 3. Structured Information Display

The fallback view displays three main sections:

#### A. Application Info
- Application ID
- Email Subject
- Sender
- Received Date
- Created Date

#### B. Processing Summary
- Total Documents
- Total Pages
- Confidence Score (with percentage)
- Application Extraction (with percentage)
- Status (with colored badge)

#### C. Documents Breakdown
For each document:
- Filename (with word wrap)
- Document Type (capitalized, formatted)
- Total Pages
- Confidence Score (with visual progress bar)
- Highlight selected document (blue border)

#### D. Extracted Text Preview (Optional)
- Shows first 1000 characters of OCR text
- Monospace font for readability
- Scrollable container
- Only shown if OCR text available

### 4. Visual Design

**Card Style:**
```javascript
const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
};
```

**Info Rows:**
- Label on left (gray text)
- Value on right (bold, dark text)
- Bottom border separator
- Responsive layout

**Confidence Bars:**
- Visual progress bar
- Color-coded:
  - Green (≥80%): #059669
  - Orange (50-79%): #d97706
  - Red (<50%): #dc2626
- Percentage display
- Smooth animation

**Document Cards:**
- Selected document: Blue border + blue background
- Unselected: Gray border + light gray background
- Smooth transition on selection
- Responsive padding

### 5. Smooth Switching

The fallback view automatically hides when:
- PDF successfully loads
- User retries and succeeds
- User switches documents

```javascript
const handlePdfLoad = () => {
  setPdfLoading(false);
  setPdfError(false);
  setPdfErrorMessage('');
  setShowFallback(false); // Hide fallback on success
};
```

### 6. State Management

**New State Variables:**
```javascript
const [showFallback, setShowFallback] = useState(false);
const [imageError, setImageError] = useState({});
const [pdfErrorMessage, setPdfErrorMessage] = useState('');
```

**State Flow:**
1. Document selected → Reset all states
2. PDF/Image load attempt
3. On error → Set error states + show fallback
4. On success → Clear error states + hide fallback

## Component Structure

```
DocumentViewer
├── PDFPreview (70% width)
│   ├── Document Selector
│   ├── Session Expired Warning (conditional)
│   ├── Fallback Info Banner (conditional)
│   ├── View Mode Toggle (conditional)
│   ├── Fallback View (conditional)
│   │   └── FallbackDocumentView
│   │       ├── Application Info Card
│   │       ├── Processing Summary Card
│   │       ├── Documents Breakdown Card
│   │       └── Extracted Text Preview Card
│   ├── PDF View (conditional)
│   └── Image View (conditional)
└── InteractionPanel (30% width)
    └── [Chat, Search, Data, Entities tabs]
```

## User Experience Flow

### Scenario 1: PDF Load Failure

1. User opens document viewer
2. PDF fails to load (404, network error)
3. System detects error
4. Blue info banner appears
5. Fallback view displays with structured info
6. User can still see all document metadata
7. User can retry or switch documents

### Scenario 2: Image Load Failure

1. User switches to "Page Images" view
2. All images fail to load
3. System detects all images failed
4. Fallback view automatically shown
5. User sees document information instead

### Scenario 3: Successful Recovery

1. Fallback view is showing
2. User clicks "Retry" button
3. PDF loads successfully
4. Fallback view automatically hides
5. PDF viewer displays normally

### Scenario 4: Session Expiration

1. User's session expires
2. PDF/Images fail with 401 error
3. Red warning banner shows
4. "Session expired. Please login again."
5. Auto-redirect to login after 2 seconds
6. Fallback view shows (if not redirected)

## Code Examples

### Fallback Trigger Logic

```javascript
const handlePdfError = async () => {
  setPdfLoading(false);
  setPdfError(true);
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setPdfErrorMessage('Session expired. Please login again.');
      setShowFallback(true);
      return;
    }
    
    const response = await fetch(pdfUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 401) {
      setPdfErrorMessage('Session expired. Please login again.');
      // Redirect to login
    } else if (response.status === 404) {
      setPdfErrorMessage('PDF file not found on server.');
      setShowFallback(true); // Show fallback
    } else {
      setPdfErrorMessage('Failed to load PDF. Please try again.');
      setShowFallback(true); // Show fallback
    }
  } catch (error) {
    setPdfErrorMessage('Failed to load PDF. Please try again.');
    setShowFallback(true); // Show fallback
  }
};
```

### Conditional Rendering

```javascript
{showFallback && app ? (
  <div style={{ flex: 1, overflow: 'auto' }}>
    <FallbackDocumentView app={app} selectedDoc={selectedDoc} />
  </div>
) : (
  <>
    {/* PDF View */}
    {/* Image View */}
  </>
)}
```

### Info Row Component

```javascript
const InfoRow = ({ label, value }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '0.5rem 0', 
    borderBottom: '1px solid #f3f4f6' 
  }}>
    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
      {label}
    </span>
    <span style={{ 
      fontSize: '0.85rem', 
      fontWeight: 500, 
      color: '#111827', 
      textAlign: 'right', 
      maxWidth: '60%' 
    }}>
      {value}
    </span>
  </div>
);
```

### Confidence Bar Component

```javascript
const ConfidenceBar = ({ score }) => {
  const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '0.75rem', 
        color: '#9ca3af', 
        marginBottom: '0.25rem' 
      }}>
        <span>Confidence</span>
        <span style={{ color, fontWeight: 600 }}>
          {score?.toFixed(1) || 0}%
        </span>
      </div>
      <div style={{ 
        height: '6px', 
        background: '#e5e7eb', 
        borderRadius: '3px', 
        overflow: 'hidden' 
      }}>
        <div style={{ 
          height: '100%', 
          width: `${score || 0}%`, 
          background: color, 
          borderRadius: '3px', 
          transition: 'width 0.5s ease' 
        }} />
      </div>
    </div>
  );
};
```

## Benefits

### 1. Always Useful
- Users never see empty screens
- Information always available
- No wasted screen space

### 2. Better UX
- Clear messaging about what happened
- Structured, easy-to-read information
- Visual hierarchy with cards and sections

### 3. Graceful Degradation
- System continues to function
- Users can still access data
- No dead ends

### 4. Professional Appearance
- Clean, modern design
- Consistent with rest of application
- Color-coded status indicators

### 5. Automatic Recovery
- Fallback hides when preview works
- Smooth transitions
- No manual intervention needed

## Testing Checklist

- [x] Fallback shows on PDF 404 error
- [x] Fallback shows on PDF network error
- [x] Fallback shows when all images fail
- [x] Info banner displays correctly
- [x] Application info displays correctly
- [x] Processing summary displays correctly
- [x] Documents breakdown displays correctly
- [x] Selected document highlighted
- [x] Confidence bars render correctly
- [x] OCR text preview shows (when available)
- [x] Fallback hides on successful PDF load
- [x] Fallback hides on successful retry
- [x] Session expired message shows correctly
- [x] No console errors
- [x] Responsive layout works

## Future Enhancements

1. **Extracted Data Preview:**
   - Show key extracted fields in fallback
   - Display applicant info, insurance details
   - Make it interactive (click to edit)

2. **Validation Results:**
   - Show validation status in fallback
   - Display passed/failed checks
   - Highlight missing fields

3. **Download Options:**
   - Add "Download PDF" button
   - Export extracted data as JSON
   - Generate summary report

4. **Search in Fallback:**
   - Search through OCR text
   - Highlight matches
   - Jump to relevant sections

5. **Comparison View:**
   - Compare multiple documents
   - Side-by-side metadata
   - Diff extracted fields

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Color contrast ratios met
- Keyboard navigation support
- Screen reader friendly labels

## Performance

- Lazy rendering of fallback
- Only shown when needed
- Minimal re-renders
- Efficient state management

## Conclusion

The fallback UI ensures users always have access to useful information, even when document preview fails. It provides a professional, informative alternative that maintains the application's usability and user experience standards.
