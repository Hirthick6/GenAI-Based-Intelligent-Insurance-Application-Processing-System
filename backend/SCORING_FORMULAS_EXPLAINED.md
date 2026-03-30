# Insurance Document Scoring Formulas

## Overview
This document explains the mathematical formulas used to evaluate insurance application documents processed through OCR and AI extraction.

---

## 1. CONFIDENCE PERCENTAGE (Final Confidence)

**Purpose:** Measures the overall reliability and accuracy of the extracted data.

### Step-by-Step Calculation:

#### **STEP 1: OCR Confidence (Text Recognition Quality)**

**Formula:**
```
OCR_base = Σ(word_confidence × word_length) / Σ(word_length)

variance = variance(all_word_confidences)

variance_penalty = min(variance × 0.1, 10)

OCR_Confidence = min(OCR_base - variance_penalty, 98)
```

**Explanation:**
- Each word from OCR has a confidence score (0-100)
- Longer words get more weight (more characters = more reliable)
- If confidence varies a lot across words, we apply a penalty
- Maximum possible score is 98% (no perfect scores)

**Example:**
```
Words extracted:
- "John" (confidence: 95%, length: 4 chars)
- "Doe" (confidence: 90%, length: 3 chars)
- "Smith" (confidence: 92%, length: 5 chars)

Calculation:
Weighted sum = (95×4) + (90×3) + (92×5) = 380 + 270 + 460 = 1110
Total length = 4 + 3 + 5 = 12
OCR_base = 1110 / 12 = 92.5%

Variance = variance([95, 90, 92]) = 6.33
Variance_penalty = min(6.33 × 0.1, 10) = 0.63%

OCR_Confidence = 92.5 - 0.63 = 91.87%
```

---

#### **STEP 2: Field Confidence (AI Extraction Quality)**

**Formula:**
```
field_score = {
    "High": 0.9,
    "Medium": 0.7,
    "Low": 0.5
}

Field_Confidence = Σ(field_score × field_weight) / Σ(field_weight) × 100
```

**Field Weights:**
- Critical fields (1.5): name, DOB, phone, email, sum_assured
- Important fields (1.2): occupation, income, policy_term
- Standard fields (1.0): age, gender, city, state
- Optional fields (0.8): height, weight, blood_group

**Example:**
```
Fields extracted:
- full_name: "High" (0.9) × weight 1.5 = 1.35
- email: "Medium" (0.7) × weight 1.5 = 1.05
- age: "High" (0.9) × weight 1.0 = 0.90
- height: "Low" (0.5) × weight 0.8 = 0.40

Total weighted score = 1.35 + 1.05 + 0.90 + 0.40 = 3.70
Total weight = 1.5 + 1.5 + 1.0 + 0.8 = 4.8

Field_Confidence = (3.70 / 4.8) × 100 = 77.08%
```

---

#### **STEP 3: Uncertainty Penalty**

**Formula:**
```
uncertain_fields = count of fields with "Medium" or "Low" confidence
total_fields = count of all filled fields

uncertain_ratio = uncertain_fields / total_fields

uncertainty_penalty = min(uncertain_ratio × 10, 10)
```

**Example:**
```
Total filled fields: 20
Fields with Medium/Low confidence: 8

uncertain_ratio = 8 / 20 = 0.4
uncertainty_penalty = 0.4 × 10 = 4.0%
```

---

#### **STEP 4: Final Confidence (Combined Score)**

**Formula:**
```
Final_Confidence = 
    0.5 × OCR_Confidence + 
    0.3 × Extraction_Percentage + 
    0.2 × (100 - uncertainty_penalty)

Final_Confidence = min(Final_Confidence, 98)
```

**Weight Distribution:**
- 50% from OCR quality (most important - base text recognition)
- 30% from data completeness (how much data we extracted)
- 20% from uncertainty (AI confidence in extraction)

**Complete Example:**
```
OCR_Confidence = 91.87%
Extraction_Percentage = 85.50% (from next section)
uncertainty_penalty = 4.0%

Final_Confidence = 
    0.5 × 91.87 + 
    0.3 × 85.50 + 
    0.2 × (100 - 4.0)

= 45.94 + 25.65 + 19.20
= 90.79%

Capped at 98%: Final_Confidence = 90.79%
```

---

## 2. APPLICATION EXTRACTION PERCENTAGE

**Purpose:** Measures how complete the extracted data is (what percentage of required fields were successfully extracted).

### Step-by-Step Calculation:

#### **STEP 1: Base Extraction**

**Formula:**
```
field_present = {
    1 if field has value AND value ≠ "Not Available"
    0 otherwise
}

Extraction_base = Σ(field_weight × field_present) / Σ(field_weight) × 100
```

**Example:**
```
Expected fields:
- full_name (weight 1.5): "John Doe" ✓ → 1.5 × 1 = 1.5
- email (weight 1.5): "john@email.com" ✓ → 1.5 × 1 = 1.5
- occupation (weight 1.2): "Not Available" ✗ → 1.2 × 0 = 0
- age (weight 1.0): "35" ✓ → 1.0 × 1 = 1.0
- height (weight 0.8): "" ✗ → 0.8 × 0 = 0

Total weighted present = 1.5 + 1.5 + 0 + 1.0 + 0 = 4.0
Total weight = 1.5 + 1.5 + 1.2 + 1.0 + 0.8 = 6.0

Extraction_base = (4.0 / 6.0) × 100 = 66.67%
```

---

#### **STEP 2: Critical Field Penalty**

**Critical Fields (must be present):**
1. applicant.full_name
2. applicant.date_of_birth
3. contact.phone
4. contact.email
5. identity.id_number
6. insurance.plan_type
7. insurance.sum_assured
8. nominee.name

**Formula:**
```
missing_critical = count of missing critical fields

critical_penalty = missing_critical × 5
```

**Example:**
```
Critical fields status:
- full_name: Present ✓
- date_of_birth: Present ✓
- phone: Present ✓
- email: Missing ✗
- id_number: Missing ✗
- plan_type: Present ✓
- sum_assured: Present ✓
- nominee.name: Present ✓

missing_critical = 2 (email and id_number)
critical_penalty = 2 × 5 = 10%
```

---

#### **STEP 3: Low Confidence Penalty**

**Formula:**
```
low_conf_count = count of fields with "Low" confidence

low_conf_penalty = low_conf_count × 2
```

**Example:**
```
Fields with Low confidence:
- occupation: Low
- height: Low
- weight: Low

low_conf_count = 3
low_conf_penalty = 3 × 2 = 6%
```

---

#### **STEP 4: Final Extraction Percentage**

**Formula:**
```
total_penalty = critical_penalty + low_conf_penalty

Extraction_Percentage = Extraction_base - total_penalty

Extraction_Percentage = max(0, min(Extraction_Percentage, 98))
```

**Complete Example:**
```
Extraction_base = 66.67%
critical_penalty = 10%
low_conf_penalty = 6%

total_penalty = 10 + 6 = 16%

Extraction_Percentage = 66.67 - 16 = 50.67%

Capped at 98%: Extraction_Percentage = 50.67%
```

---

## Summary Table

| Metric | Formula | Range | Purpose |
|--------|---------|-------|---------|
| **OCR Confidence** | Weighted avg - variance penalty | 0-98% | Text recognition quality |
| **Field Confidence** | Weighted avg of AI labels | 0-100% | AI extraction confidence |
| **Extraction Base** | Weighted field presence | 0-100% | Raw data completeness |
| **Extraction Penalty** | Critical (5%) + Low conf (2%) | 0-100% | Quality reduction |
| **Extraction %** | Base - Penalties | 0-98% | Final data completeness |
| **Uncertainty Penalty** | (uncertain/total) × 10 | 0-10% | AI uncertainty measure |
| **Final Confidence** | 50% OCR + 30% Extract + 20% Certain | 0-98% | Overall reliability |

---

## Key Principles

1. **Weighted Averages:** Important fields (name, email, sum_assured) have more impact than optional fields (height, weight)

2. **Penalties:** Missing critical fields or low confidence reduces scores to reflect real quality

3. **No Perfect Scores:** Maximum 98% to avoid unrealistic perfection claims

4. **Multi-Factor:** Combines OCR quality, data completeness, and AI confidence for holistic assessment

5. **Transparency:** Each component is calculated separately and can be audited

---

## Real-World Example

**Document:** Life insurance application form (scanned PDF)

**OCR Results:**
- 150 words extracted
- Average confidence: 92%
- Variance: 8.5

**Extracted Fields:**
- 25 out of 35 expected fields filled
- 3 critical fields missing (email, id_number, nominee)
- 5 fields with "Low" confidence
- 12 fields with "Medium" confidence
- 8 fields with "High" confidence

**Calculations:**

```
1. OCR Confidence:
   Base = 92%
   Variance penalty = 8.5 × 0.1 = 0.85%
   OCR_Confidence = 92 - 0.85 = 91.15%

2. Extraction Base:
   (25 filled / 35 total) × 100 = 71.43%

3. Penalties:
   Critical missing = 3 × 5 = 15%
   Low confidence = 5 × 2 = 10%
   Total penalty = 25%

4. Extraction Percentage:
   71.43 - 25 = 46.43%

5. Uncertainty:
   Uncertain = (12 + 5) / 25 = 17/25 = 0.68
   Penalty = 0.68 × 10 = 6.8%

6. Final Confidence:
   = 0.5 × 91.15 + 0.3 × 46.43 + 0.2 × (100 - 6.8)
   = 45.58 + 13.93 + 18.64
   = 78.15%
```

**Result:**
- **Confidence:** 78.15% (Good OCR quality but incomplete data)
- **Extraction:** 46.43% (Many fields missing, especially critical ones)

**Interpretation:** The document was scanned clearly (good OCR), but many required fields are missing or have low confidence, indicating the form may be incomplete or poorly filled out.
