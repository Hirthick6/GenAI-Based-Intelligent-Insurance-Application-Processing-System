"""
PDF Batch Processing Service
============================
Handles splitting PDFs into pages, converting pages to images,
and applying page-level preprocessing for OCR accuracy.
"""

import os
import logging
import time
from typing import List, Dict, Optional
from io import BytesIO

from PIL import Image, ImageFilter, ImageOps
import PyPDF2

from app.config import settings

logger = logging.getLogger(__name__)


class PDFBatchProcessor:
    """Processes multiple PDFs: split pages, convert to images, preprocess."""

    def __init__(self):
        self.processed_dir = settings.PROCESSED_DIR
        self.dpi = 300  # DPI for page-to-image conversion

    def process_batch(self, application_id: str, attachments: List[Dict]) -> Dict:
        """
        Process all PDFs for an application in batch mode.

        Args:
            application_id: Unique application identifier
            attachments: List of attachment dicts with file_path and filename

        Returns:
            Dict with processing results per document
        """
        start_time = time.time()
        results = {
            "application_id": application_id,
            "documents": [],
            "total_pages": 0,
            "processing_time_ms": 0,
        }

        # Create output directory for this application
        app_output_dir = os.path.join(self.processed_dir, application_id)
        os.makedirs(app_output_dir, exist_ok=True)

        for attachment in attachments:
            doc_result = self._process_single_pdf(
                attachment["file_path"],
                attachment["filename"],
                app_output_dir,
            )
            results["documents"].append(doc_result)
            results["total_pages"] += doc_result["total_pages"]

        results["processing_time_ms"] = int((time.time() - start_time) * 1000)
        logger.info(
            f"Batch processed {len(attachments)} PDFs, "
            f"{results['total_pages']} total pages in {results['processing_time_ms']}ms"
        )

        return results

    def _process_single_pdf(
        self, file_path: str, filename: str, output_dir: str
    ) -> Dict:
        """
        Process a single PDF: split into pages and convert to images.

        Steps:
            1. Split PDF into individual pages
            2. Convert each page to an image
            3. Apply preprocessing to each image
        """
        doc_name = os.path.splitext(filename)[0]
        doc_dir = os.path.join(output_dir, doc_name)
        os.makedirs(doc_dir, exist_ok=True)

        result = {
            "filename": filename,
            "file_path": file_path,
            "total_pages": 0,
            "pages": [],
            "errors": [],
        }

        try:
            # Step 1: Get page count and split
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                total_pages = len(reader.pages)
                result["total_pages"] = total_pages

                logger.info(f"Processing {filename}: {total_pages} pages")

                # Step 2: Convert each page to image
                for page_idx in range(total_pages):
                    page_result = self._process_page(
                        reader, page_idx, doc_dir, file_path
                    )
                    result["pages"].append(page_result)

        except Exception as e:
            error_msg = f"Error processing PDF {filename}: {e}"
            logger.error(error_msg)
            result["errors"].append(error_msg)

        return result

    def _process_page(
        self, reader: PyPDF2.PdfReader, page_idx: int, doc_dir: str, file_path: str
    ) -> Dict:
        """
        Process a single page: convert to image and apply preprocessing.
        """
        page_result = {
            "page_number": page_idx + 1,
            "image_path": None,
            "preprocessed_image_path": None,
            "preprocessing_applied": [],
        }

        try:
            # Convert page to image using pdf2image
            page_images = self._pdf_page_to_image(file_path, page_idx)

            if page_images:
                # Save original page image
                original_path = os.path.join(doc_dir, f"page_{page_idx + 1}_original.png")
                page_images[0].save(original_path, "PNG")
                page_result["image_path"] = original_path

                # Apply preprocessing
                preprocessed_img, steps = self._preprocess_page(page_images[0])

                # Save preprocessed image
                preprocessed_path = os.path.join(doc_dir, f"page_{page_idx + 1}_preprocessed.png")
                preprocessed_img.save(preprocessed_path, "PNG")
                page_result["preprocessed_image_path"] = preprocessed_path
                page_result["preprocessing_applied"] = steps

        except Exception as e:
            logger.error(f"Error processing page {page_idx + 1}: {e}")
            page_result["error"] = str(e)

        return page_result

    def _pdf_page_to_image(self, file_path: str, page_idx: int) -> Optional[List[Image.Image]]:
        """
        Convert a specific PDF page to an image.
        Uses pdf2image library (requires poppler).
        Falls back to PyPDF2 extraction if pdf2image is unavailable.
        """
        try:
            from pdf2image import convert_from_path

            images = convert_from_path(
                file_path,
                first_page=page_idx + 1,
                last_page=page_idx + 1,
                dpi=self.dpi,
                fmt="png",
            )
            return images

        except ImportError:
            logger.warning("pdf2image not available, using fallback method")
            return self._fallback_page_extraction(file_path, page_idx)

        except Exception as e:
            logger.error(f"pdf2image conversion failed: {e}")
            return self._fallback_page_extraction(file_path, page_idx)

    def _fallback_page_extraction(
        self, file_path: str, page_idx: int
    ) -> Optional[List[Image.Image]]:
        """Fallback: extract embedded images from PDF page."""
        try:
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                page = reader.pages[page_idx]

                # Try to extract images from the page
                if "/XObject" in page["/Resources"]:
                    x_objects = page["/Resources"]["/XObject"].get_object()
                    for obj_name in x_objects:
                        obj = x_objects[obj_name].get_object()
                        if obj["/Subtype"] == "/Image":
                            data = obj.get_data()
                            img = Image.open(BytesIO(data))
                            return [img]

            # If no images found, create a blank placeholder
            logger.warning(f"No images extractable from page {page_idx + 1}")
            blank = Image.new("RGB", (2480, 3508), "white")  # A4 at 300 DPI
            return [blank]

        except Exception as e:
            logger.error(f"Fallback extraction failed: {e}")
            return None

    def _preprocess_page(self, image: Image.Image) -> tuple:
        """
        Apply page-level preprocessing for OCR accuracy.

        Steps:
            1. Grayscale conversion
            2. Noise removal (median filter)
            3. Thresholding (binarization)
            4. Deskewing (rotation correction)

        Returns:
            Tuple of (preprocessed_image, list_of_steps_applied)
        """
        steps_applied = []

        # Step 1: Grayscale conversion
        img = ImageOps.grayscale(image)
        steps_applied.append("grayscale_conversion")

        # Step 2: Noise removal using median filter
        img = img.filter(ImageFilter.MedianFilter(size=3))
        steps_applied.append("noise_removal_median_filter")

        # Step 3: Thresholding (Otsu-like binarization)
        img = self._apply_threshold(img)
        steps_applied.append("thresholding_binarization")

        # Step 4: Deskewing
        img = self._deskew(img)
        steps_applied.append("deskewing")

        return img, steps_applied

    def _apply_threshold(self, image: Image.Image, threshold: int = 128) -> Image.Image:
        """Apply binary thresholding to image."""
        return image.point(lambda p: 255 if p > threshold else 0, "L")

    def _deskew(self, image: Image.Image) -> Image.Image:
        """
        Deskew image by detecting and correcting rotation.
        Uses a simple approach based on image projection.
        """
        try:
            import numpy as np

            img_array = np.array(image)

            # Find non-white rows to detect text baseline angle
            coords = np.column_stack(np.where(img_array < 128))

            if len(coords) < 100:
                return image

            # Calculate angle using minimum area rectangle concept
            # Simple PCA-based approach
            mean = np.mean(coords, axis=0)
            coords_centered = coords - mean
            cov = np.cov(coords_centered.T)

            if cov.shape == (2, 2):
                eigenvalues, eigenvectors = np.linalg.eig(cov)
                angle = np.degrees(np.arctan2(eigenvectors[0, 1], eigenvectors[0, 0]))

                # Only correct small angles (< 10 degrees)
                if abs(angle) < 10 and abs(angle) > 0.5:
                    image = image.rotate(angle, fillcolor=255, expand=False)

        except ImportError:
            logger.warning("NumPy not available for deskewing, skipping")
        except Exception as e:
            logger.warning(f"Deskewing failed: {e}")

        return image
