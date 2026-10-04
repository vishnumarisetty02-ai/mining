"""document_ai — Document processing and fact extraction for GeoMine.

Handles PDF, DOCX, XLSX, CSV, and image ingestion with OCR support
for English and Hindi.
"""

from document_ai.ingest import compute_sha256, detect_mime_type

__all__ = [
    "compute_sha256",
    "detect_mime_type",
]
