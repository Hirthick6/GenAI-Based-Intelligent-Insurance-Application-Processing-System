"""
Advanced OCR Evaluation and Document Scoring Engine.

Computes:
1. OCR Confidence Percentage (text recognition quality)
2. Application Extraction Percentage (data completeness)
3. Final Confidence Percentage (overall reliability including GenAI uncertainty)
"""

import logging
import statistics
from typing import Dict, List, Any

logger = logging.getLogger(__name__)


class ScoringService:
    """Compute confidence and extraction scores with penalties and uncertainty."""

    # Expected fields schema with weights
    EXPECTED_FIELDS = {
        "applicant": {
            "full_name": 1.5,
            "date_of_birth": 1.5,
            "age": 1.0,
            "gender": 1.0,
            "marital_status": 1.0,
            "nationality": 1.0,
            "occupation": 1.2,
            "annual_income": 1.2,
        },
        "contact": {
            "address": 1.5,
            "city": 1.0,
            "state": 1.0,
            "pincode": 1.0,
            "phone": 1.5,
            "email": 1.5,
        },
        "identity": {
            "id_type": 1.0,
            "id_number": 1.5,
            "pan_number": 1.2,
            "aadhaar_number": 1.2,
        },
        "insurance": {
            "plan_name": 1.5,
            "plan_type": 1.5,
            "sum_assured": 1.5,
            "premium_amount": 1.5,
            "premium_frequency": 1.0,
            "policy_term": 1.2,
            "payment_mode": 1.0,
        },
        "nominee": {
            "name": 1.5,
            "relationship": 1.2,
            "date_of_birth": 1.0,
            "share_percentage": 1.0,
        },
        "medical": {
            "height": 0.8,
            "weight": 0.8,
            "blood_group": 0.8,
            "pre_existing_conditions": 1.2,
            "current_medications": 1.0,
            "family_medical_history": 1.0,
            "smoking_status": 1.2,
            "alcohol_consumption": 1.0,
        },
    }

    # Critical fields that must be present
    CRITICAL_FIELDS = [
        ("applicant", "full_name"),
        ("applicant", "date_of_birth"),
        ("contact", "phone"),
        ("contact", "email"),
        ("identity", "id_number"),
        ("insurance", "plan_type"),
        ("insurance", "sum_assured"),
        ("nominee", "name"),
    ]

    def compute_scores(
        self,
        ocr_result: Dict,
        extracted_fields: Dict,
        validation_result: Dict = None
    ) -> Dict:
        """
        Compute confidence and extraction scores with penalties.

        Args:
            ocr_result: OCR data with word-level confidences
            extracted_fields: Structured JSON fields from GenAI
            validation_result: Optional validation data

        Returns:
            Dict with ocr_confidence, field_confidence, extraction_percentage,
            uncertainty_penalty, and final_confidence
        """
        try:
            # STEP 1: OCR Confidence with variance penalty
            ocr_confidence = self._compute_ocr_confidence(ocr_result)

            # STEP 2: Field Confidence
            field_confidence = self._compute_field_confidence(extracted_fields)

            # STEP 3: Base Extraction Percentage
            extraction_base = self._compute_base_extraction(extracted_fields)

            # STEP 4: Apply Extraction Penalties
            extraction_percentage = self._apply_extraction_penalties(
                extraction_base, extracted_fields
            )

            # STEP 5: GenAI Uncertainty Penalty
            uncertainty_penalty = self._compute_uncertainty_penalty(extracted_fields)

            # STEP 6: Final Confidence
            final_confidence = (
                0.5 * ocr_confidence +
                0.3 * extraction_percentage +
                0.2 * (100 - uncertainty_penalty)
            )
            # Cap at 98% to avoid unrealistic perfection
            final_confidence = min(final_confidence, 98.0)

            result = {
                "ocr_confidence": round(ocr_confidence, 2),
                "field_confidence": round(field_confidence, 2),
                "extraction_percentage": round(extraction_percentage, 2),
                "uncertainty_penalty": round(uncertainty_penalty, 2),
                "final_confidence": round(final_confidence, 2),
            }

            logger.info(
                f"Scoring complete - OCR: {result['ocr_confidence']}%, "
                f"Extraction: {result['extraction_percentage']}%, "
                f"Final: {result['final_confidence']}%"
            )

            return result

        except Exception as e:
            logger.error(f"Scoring failed: {e}")
            return {
                "ocr_confidence": 0.0,
                "field_confidence": 0.0,
                "extraction_percentage": 0.0,
                "uncertainty_penalty": 0.0,
                "final_confidence": 0.0,
            }

    def _compute_ocr_confidence(self, ocr_result: Dict) -> float:
        """
        STEP 1: Compute OCR confidence with variance penalty.

        Formula:
        - OCR_base = Σ(word_confidence × word_length) / Σ(word_length)
        - variance_penalty = min(variance × 0.1, 10)
        - OCR_Confidence = min(OCR_base - variance_penalty, 98)
        """
        total_weighted_conf = 0.0
        total_length = 0
        all_confidences = []

        for doc in ocr_result.get("documents", []):
            for page in doc.get("pages", []):
                text = page.get("text", "")
                words = text.split()
                page_conf = page.get("confidence", 0.0)

                for word in words:
                    word_length = len(word)
                    total_weighted_conf += page_conf * word_length
                    total_length += word_length
                    all_confidences.append(page_conf)

        if total_length == 0:
            return 0.0

        # Base OCR confidence
        ocr_base = total_weighted_conf / total_length

        # Compute variance penalty
        if len(all_confidences) > 1:
            try:
                variance = statistics.variance(all_confidences)
                variance_penalty = min(variance * 0.1, 10.0)
            except:
                variance_penalty = 0.0
        else:
            variance_penalty = 0.0

        # Apply penalty and cap at 98%
        ocr_confidence = min(ocr_base - variance_penalty, 98.0)
        return max(0.0, ocr_confidence)

    def _compute_field_confidence(self, extracted_fields: Dict) -> float:
        """
        STEP 2: Compute field confidence from GenAI labels.

        Convert: High=0.9, Medium=0.7, Low=0.5
        Formula: Σ(field_score × field_weight) / Σ(field_weight) × 100
        """
        confidence_map = {
            "high": 0.9,
            "medium": 0.7,
            "low": 0.5,
        }

        field_confidences = extracted_fields.get("field_confidence", {})
        total_weighted_score = 0.0
        total_weight = 0.0

        for category, fields in self.EXPECTED_FIELDS.items():
            for field_name, field_weight in fields.items():
                conf_label = field_confidences.get(field_name, "low")
                if isinstance(conf_label, str):
                    conf_label = conf_label.lower()
                    field_score = confidence_map.get(conf_label, 0.5)
                else:
                    field_score = float(conf_label) if conf_label else 0.5

                total_weighted_score += field_score * field_weight
                total_weight += field_weight

        if total_weight == 0:
            return 0.0

        return (total_weighted_score / total_weight) * 100

    def _compute_base_extraction(self, extracted_fields: Dict) -> float:
        """
        STEP 3: Compute base extraction percentage.

        Formula: Σ(field_weight × field_present) / Σ(field_weight) × 100
        """
        total_weighted_present = 0.0
        total_weight = 0.0

        for category, fields in self.EXPECTED_FIELDS.items():
            category_data = extracted_fields.get(category, {})

            for field_name, field_weight in fields.items():
                total_weight += field_weight

                field_value = category_data.get(field_name, "")
                if field_value:
                    str_value = str(field_value).strip().lower()
                    if str_value and str_value not in ["not available", "-", "null", ""]:
                        total_weighted_present += field_weight

        if total_weight == 0:
            return 0.0

        return (total_weighted_present / total_weight) * 100

    def _apply_extraction_penalties(
        self, extraction_base: float, extracted_fields: Dict
    ) -> float:
        """
        STEP 4: Apply extraction penalties.

        Penalties:
        - Critical field missing: 5% per field
        - Low confidence field: 2% per field
        """
        # Count missing critical fields
        missing_critical = 0
        for category, field_name in self.CRITICAL_FIELDS:
            category_data = extracted_fields.get(category, {})
            field_value = category_data.get(field_name, "")
            if not field_value or str(field_value).strip().lower() in ["not available", "-", "null", ""]:
                missing_critical += 1

        # Count low confidence fields
        field_confidences = extracted_fields.get("field_confidence", {})
        low_conf_count = 0
        for field_name, conf_label in field_confidences.items():
            if isinstance(conf_label, str) and conf_label.lower() == "low":
                low_conf_count += 1

        # Calculate penalties
        critical_penalty = missing_critical * 5
        low_conf_penalty = low_conf_count * 2
        total_penalty = critical_penalty + low_conf_penalty

        # Apply penalties and cap at 98%
        extraction_percentage = extraction_base - total_penalty
        extraction_percentage = max(0.0, min(extraction_percentage, 98.0))

        logger.debug(
            f"Extraction penalties - Critical: {critical_penalty}%, "
            f"Low confidence: {low_conf_penalty}%, Total: {total_penalty}%"
        )

        return extraction_percentage

    def _compute_uncertainty_penalty(self, extracted_fields: Dict) -> float:
        """
        STEP 5: Compute GenAI uncertainty penalty.

        Uncertain fields = Medium or Low confidence
        Formula: (uncertain_fields / total_fields) × 10
        """
        field_confidences = extracted_fields.get("field_confidence", {})
        
        total_fields = 0
        uncertain_fields = 0

        for category, fields in self.EXPECTED_FIELDS.items():
            category_data = extracted_fields.get(category, {})
            
            for field_name in fields.keys():
                # Only count filled fields
                field_value = category_data.get(field_name, "")
                if field_value and str(field_value).strip().lower() not in ["not available", "-", "null", ""]:
                    total_fields += 1
                    
                    # Check confidence
                    conf_label = field_confidences.get(field_name, "low")
                    if isinstance(conf_label, str):
                        conf_label = conf_label.lower()
                        if conf_label in ["medium", "low"]:
                            uncertain_fields += 1

        if total_fields == 0:
            return 0.0

        uncertain_ratio = uncertain_fields / total_fields
        uncertainty_penalty = uncertain_ratio * 10

        logger.debug(
            f"Uncertainty - {uncertain_fields}/{total_fields} uncertain fields, "
            f"penalty: {uncertainty_penalty:.2f}%"
        )

        return min(uncertainty_penalty, 10.0)  # Cap at 10%
