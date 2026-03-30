# Authentication Fix for PDF and Image Loading

## Problem
PDFs and page images were not loading due to authentication errors. The static file serving was bypassing the authentication system, causing "Not authenticated" errors when trying to access files.

## Root Cause
The application was using FastAPI's `StaticFiles` middleware to serve files directly:
```python
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/processed", StaticFiles(directory=settings.PROCESSED_DIR), name="processed")
```

This approach serves files without authentication, but the frontend's axios interceptor was adding authentication headers to all requests, causing a mismatch.

## Solution

### 1. Backend Changes

#### A. Created Authenticated File Serving Endpoint (`backend/app/api/routes.py`)

Added a new endpoint that serves files with authentication:

```python
@router.get("/files/serve", tags=["Files"])
async def serve_file(
    path: str = Query(..., description="File path to serve"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Serve static files (images, PDFs) with authentication.
    This endpoint replaces direct static file access for authenticated resources.
    """
```

**Features:**
- Requires authentication via `get_current_user` dependency
- Prevents path traversal attacks (blocks ".." and absolute paths)
- Supports both `processed/` and `uploads/` directories
- Auto-detects MIME type for proper content serving
- Returns 404 if file doesn't exist
- Returns 401 if user not authenticated

**Security:**
- Path validation to prevent directory traversal
- Authentication required for all file access
- Proper error handling for missing files

#### B. Updated Helper Function (`backend/app/utils/helpers.py`)

Modified `fs_path_to_url()` to generate authenticated API URLs:

```python
def fs_path_to_url(path: str, upload_dir: str = "", processed_dir: str = "") -> str:
    """
    Convert a filesystem path to an authenticated API URL for frontend use.
    Uses the /api/files/serve endpoint which requires authentication.
    """
    # Returns: '/api/files/serve?path=processed/APP-xxx/Doc/page.png'
```

**Changes:**
- Converts file paths to authenticated API endpoints
- URL encodes paths for safety
- Extracts relative paths from full filesystem paths
- Returns `/api/files/serve?path=...` format

### 2. Frontend Changes

#### A. Enhanced Error Handling (`frontend/src/pages/DocumentViewer.jsx`)

**Added State Management:**
```javascript
const [pdfErrorMessage, setPdfErrorMessage] = useState('');
const [imageError, setImageError] = useState({});
```

**Improved PDF Error Detection:**
```javascript
const handlePdfError = async () => {
  // Check if it's an authentication error
  const token = localStorage.getItem('token');
  if (!token) {
    setPdfErrorMessage('Session expired. Please login again.');
    return;
  }
  
  // Try to fetch the PDF to get the actual error
  const response = await fetch(pdfUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 401) {
    setPdfErrorMessage('Session expired. Please login again.');
    localStorage.removeItem('token');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }
}
```

**Image Error Handling:**
```javascript
const handleImageError = (pageId, error) => {
  setImageError(prev => ({ ...prev, [pageId]: true }));
  
  // Check if it's an authentication error
  const token = localStorage.getItem('token');
  if (!token) {
    setPdfErrorMessage('Session expired. Please login again.');
  }
};
```

**UI Improvements:**
- Session expired warning banner (red background)
- Specific error messages instead of generic "Image not available"
- Auto-redirect to login after 2 seconds on auth failure
- Retry button hidden for auth errors
- Proper error state management per image

### 3. Authentication Flow

#### How It Works Now:

1. **User Logs In:**
   - Token stored in localStorage
   - Axios interceptor adds token to all API requests

2. **Application Loads:**
   - API returns file URLs like `/api/files/serve?path=processed/...`
   - These URLs point to authenticated endpoints

3. **File Request:**
   - Browser/iframe requests file
   - Axios interceptor adds `Authorization: Bearer <token>` header
   - Backend validates token via `get_current_user`
   - File served if authenticated, 401 if not

4. **Token Expiration:**
   - Backend returns 401 Unauthorized
   - Frontend detects 401 status
   - Shows "Session expired" message
   - Clears token from localStorage
   - Redirects to login page after 2 seconds

5. **Image Loading:**
   - Images use authenticated URLs
   - Token automatically added by axios interceptor
   - Error handler checks for auth failures
   - Shows appropriate error message

### 4. API Endpoints

#### File Serving Endpoint
```
GET /api/files/serve?path={relative_path}
```

**Parameters:**
- `path`: Relative file path (e.g., "processed/APP-xxx/doc/page.png")

**Headers:**
- `Authorization: Bearer <token>` (required)

**Responses:**
- 200: File content with proper MIME type
- 401: Not authenticated
- 404: File not found
- 400: Invalid path (security violation)

**Example:**
```
GET /api/files/serve?path=processed/APP-20260211131201-46D93821/Life-Insurance-Application-Form/page_1_preprocessed.png
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### PDF Endpoint
```
GET /api/documents/{document_id}/pdf
```

**Headers:**
- `Authorization: Bearer <token>` (required)

**Responses:**
- 200: PDF file
- 401: Not authenticated
- 404: Document or file not found

### 5. Error Messages

#### User-Friendly Messages:

| Scenario | Message | Action |
|----------|---------|--------|
| Token missing | "Session expired. Please login again." | Auto-redirect to login |
| 401 response | "Session expired. Please login again." | Clear token, redirect |
| 404 response | "PDF file not found on server." | Show retry button |
| Network error | "Failed to load PDF. Please try again." | Show retry button |
| Image 401 | "Session expired. Please login again." | Show in error state |
| Image other | "Image not available" | Show error icon |

### 6. Security Improvements

#### Path Traversal Prevention:
```python
# Security: Prevent path traversal attacks
if ".." in path or path.startswith("/"):
    raise HTTPException(status_code=400, detail="Invalid file path")
```

#### Authentication Required:
```python
_: User = Depends(get_current_user)
```
- All file requests require valid JWT token
- Token validated on every request
- Expired tokens rejected with 401

#### URL Encoding:
```python
from urllib.parse import quote
encoded_path = quote(relative_path, safe='/')
```
- Prevents injection attacks
- Handles special characters safely

### 7. Testing Checklist

- [x] Authenticated users can view PDFs
- [x] Authenticated users can view page images
- [x] Expired tokens show "Session expired" message
- [x] Auto-redirect to login on auth failure
- [x] Retry button works for non-auth errors
- [x] Path traversal attacks blocked
- [x] 404 errors handled gracefully
- [x] Multiple documents can be viewed
- [x] Image errors show proper messages
- [x] Token automatically added to requests

### 8. Migration Notes

#### Old Approach (Removed):
```python
# Direct static file serving (no auth)
app.mount("/uploads", StaticFiles(...))
app.mount("/processed", StaticFiles(...))
```

#### New Approach:
```python
# Authenticated file serving
@router.get("/files/serve")
async def serve_file(..., _: User = Depends(get_current_user))
```

**Benefits:**
- Secure file access
- Consistent authentication
- Better error handling
- Audit trail possible
- Fine-grained access control

### 9. Future Enhancements

1. **File Access Logging:**
   - Log which user accessed which file
   - Track download statistics
   - Audit trail for compliance

2. **Role-Based Access:**
   - Restrict certain files to admins only
   - Document-level permissions
   - Sharing capabilities

3. **Caching:**
   - Cache frequently accessed files
   - Reduce server load
   - Faster response times

4. **Compression:**
   - Compress images on-the-fly
   - Reduce bandwidth usage
   - Faster loading

5. **Thumbnails:**
   - Generate thumbnails for images
   - Lazy loading for better performance
   - Preview before full load

### 10. Troubleshooting

#### Issue: "Session expired" immediately after login
**Solution:** Check token expiration time in backend config

#### Issue: Images still not loading
**Solution:** 
1. Check browser console for actual error
2. Verify token in localStorage
3. Check backend logs for authentication errors
4. Ensure file paths are correct

#### Issue: PDF loads but images don't
**Solution:**
1. Check if image URLs are using authenticated endpoint
2. Verify axios interceptor is working
3. Check CORS settings

#### Issue: 404 errors for existing files
**Solution:**
1. Verify file paths in database match actual files
2. Check UPLOAD_DIR and PROCESSED_DIR settings
3. Ensure files weren't deleted

## Conclusion

The authentication system now properly secures all file access while providing clear error messages to users. The implementation follows security best practices and provides a seamless user experience with automatic token handling and graceful error recovery.
