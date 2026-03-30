# Experimental Results - Images to Capture

## Overview
This guide tells you exactly which screenshots to take for the "Experimental Results" section of your project review presentation.

---

## Images Needed for Experimental Results

### 1. **Test Case 1: Single Page Processing Result**
**What to capture:**
- Dashboard showing a completed single-page application
- Must show: Application ID, Status (Completed), Confidence Score (~91%)
- Processing time visible if possible

**How to capture:**
1. Go to: `http://localhost:3000/dashboard`
2. Find an application with 1 document
3. Take screenshot showing the application card with confidence score

**File name:** `test_case_1_single_page.png`

---

### 2. **Test Case 2: Multi-Page Processing Result**
**What to capture:**
- Application detail page showing 3-4 page document
- Must show: Multiple pages listed, Confidence Score (~83-86%)
- Document thumbnails visible

**How to capture:**
1. Go to: `http://localhost:3000/dashboard`
2. Click on an application with 3-4 pages
3. Take screenshot of the detail view

**File name:** `test_case_2_multi_page.png`

---

### 3. **Test Case 3: Multiple Documents Processing**
**What to capture:**
- Application with multiple documents (3+ documents)
- Must show: Document list, Overall confidence score
- All documents visible in the view

**How to capture:**
1. Go to: `http://localhost:3000/dashboard`
2. Find application with multiple documents
3. Take screenshot showing all documents

**File name:** `test_case_3_multiple_docs.png`

---

### 4. **Test Case 4: AI Chat Q&A Accuracy**
**What to capture:**
- Chat interface with conversation
- Must show: Multiple questions and accurate answers
- Include examples like "What is the client name?" → "Rahul Sharma"

**How to capture:**
1. Go to: `http://localhost:3000/document-viewer` (any application)
2. Open chat panel
3. Ask 4-5 questions and get answers
4. Take screenshot showing the conversation

**Sample questions to ask:**
- "What is the client name?"
- "What is the sum assured?"
- "Who is the nominee?"
- "What is the premium amount?"

**File name:** `test_case_4_chat_qa.png`

---

### 5. **Test Case 5: Validation Results**
**What to capture:**
- Validation section showing checks, errors, warnings
- Must show: List of validation rules with status (Pass/Fail/Warning)
- Ideally 20 checks visible

**How to capture:**
1. Go to: Application detail page
2. Scroll to "Validation Results" section
3. Take screenshot showing validation checks

**File name:** `test_case_5_validation.png`

---

### 6. **Analytics Dashboard - Overall Performance**
**What to capture:**
- Analytics page showing overall statistics
- Must show: Average confidence, total applications, success rate
- Charts/graphs visible

**How to capture:**
1. Go to: `http://localhost:3000/analytics`
2. Take screenshot of the main analytics view
3. Ensure charts and metrics are visible

**File name:** `test_case_6_analytics.png`

---

## Additional Performance Images

### 7. **Processing Time Breakdown**
**What to capture:**
- Any view showing processing stages/timeline
- Or create a chart showing: PDF Parsing (20%), OCR (30%), AI Extraction (25%), etc.

**File name:** `performance_processing_time.png`

---

### 8. **Accuracy Metrics Chart**
**What to capture:**
- Analytics page showing accuracy metrics
- Bar chart or similar showing OCR accuracy, extraction accuracy, etc.

**File name:** `performance_accuracy_metrics.png`

---

### 9. **Document Library - Multiple Applications**
**What to capture:**
- Document library showing multiple processed applications
- Must show: Different confidence scores, dates, statuses

**How to capture:**
1. Go to: `http://localhost:3000/document-library`
2. Take screenshot showing list of applications

**File name:** `results_document_library.png`

---

### 10. **Comparison Table (Create in PowerPoint/Excel)**
**What to create:**
- Table comparing Manual vs Generic AI vs Our System
- Columns: Feature, Manual Processing, Generic AI, Our System
- Rows: Processing Time, Accuracy, Cost, etc.

**File name:** `comparison_table.png`

---

## Quick Capture Checklist

```
□ Test Case 1: Single page result (Dashboard)
□ Test Case 2: Multi-page result (Application detail)
□ Test Case 3: Multiple documents (Application detail)
□ Test Case 4: Chat Q&A conversation (Document viewer)
□ Test Case 5: Validation results (Application detail)
□ Test Case 6: Analytics overview (Analytics page)
□ Performance: Processing time breakdown (Chart)
□ Performance: Accuracy metrics (Analytics)
□ Results: Document library view (Document library)
□ Comparison: Manual vs AI table (Create manually)
```

---

## Image Requirements

**Technical Specs:**
- Format: PNG or JPG
- Resolution: 1920x1080 or higher
- Quality: High (no blur)
- Crop: Remove unnecessary browser chrome if needed

**Content Requirements:**
- Clear and readable text
- Important metrics highlighted or visible
- No sensitive/personal data (use test data)
- Professional appearance

---

## Where to Use These Images

### In Presentation Slides:

**Slide 1: Test Case Results**
- Images: test_case_1, test_case_2, test_case_3
- Layout: 3 images in a row or 2x2 grid

**Slide 2: AI Chat Accuracy**
- Image: test_case_4_chat_qa
- Layout: Full slide with conversation visible

**Slide 3: Validation & Quality**
- Image: test_case_5_validation
- Layout: Full slide or split with metrics

**Slide 4: Performance Metrics**
- Images: performance_processing_time, performance_accuracy_metrics
- Layout: Side by side comparison

**Slide 5: Overall Results**
- Image: test_case_6_analytics
- Layout: Full slide with key metrics highlighted

**Slide 6: Comparison**
- Image: comparison_table
- Layout: Full slide table

---

## Tips for Better Screenshots

1. **Use test data** - Don't show real personal information
2. **Clean UI** - Close unnecessary tabs/windows
3. **Highlight important** - Use arrows or boxes to point out key metrics
4. **Consistent zoom** - Use same browser zoom level (100%)
5. **Good lighting** - If showing on screen, ensure no glare
6. **Crop smartly** - Remove browser address bar if not needed

---

## Sample Data to Use

For best results, process these test documents before taking screenshots:

1. **Single page**: Any 1-page insurance form
2. **Multi-page**: 3-4 page comprehensive application
3. **Multiple docs**: Upload 3 separate PDFs for one application
4. **Chat test**: Use the processed application with good data
5. **Validation**: Application with some errors/warnings is better to show

---

## After Capturing Images

1. Save all images in a folder: `project_review_images/`
2. Name them according to the guide above
3. Review each image for clarity and content
4. Create PowerPoint slides with these images
5. Add annotations/arrows to highlight key points

---

**Total Images Needed: 10**

**Estimated Time: 15-20 minutes**

---

## Need Help?

If you need help capturing specific screenshots:
1. Start your backend: `cd backend && uvicorn app.main:app --reload`
2. Start your frontend: `cd frontend && npm start`
3. Navigate to the URLs mentioned above
4. Use Windows Snipping Tool (Win + Shift + S) to capture

---

**End of Guide**
