"""Document ingestion: SHA-256 hashing, MIME detection, and MinIO upload.

R3: Originals are immutable and addressed by SHA-256.
"""

from __future__ import annotations

import hashlib
import mimetypes
from pathlib import Path

# Supported MIME types for ingestion.
SUPPORTED_MIME_TYPES: frozenset[str] = frozenset({
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/vnd.ms-excel",  # Windows mimetypes returns this for .csv
    "image/png",
    "image/jpeg",
    "image/tiff",
})


def compute_sha256(data: bytes) -> str:
    """Compute SHA-256 hex digest for document content (R3).

    Args:
        data: Raw document bytes.

    Returns:
        64-character lowercase hex digest.
    """
    return hashlib.sha256(data).hexdigest()


def compute_sha256_file(path: Path, chunk_size: int = 65536) -> str:
    """Compute SHA-256 hex digest for a file on disk, streaming.

    Args:
        path: Path to the file.
        chunk_size: Read buffer size in bytes.

    Returns:
        64-character lowercase hex digest.
    """
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def detect_mime_type(filename: str, data: bytes | None = None) -> str:
    """Detect MIME type from filename extension.

    Args:
        filename: Original filename with extension.
        data: Optional file content (reserved for magic-byte detection).

    Returns:
        MIME type string.

    Raises:
        ValueError: If MIME type cannot be detected or is unsupported.
    """
    mime_type, _ = mimetypes.guess_type(filename)
    if mime_type is None:
        msg = f"Cannot detect MIME type for: {filename}"
        raise ValueError(msg)
    if mime_type not in SUPPORTED_MIME_TYPES:
        msg = f"Unsupported MIME type '{mime_type}' for: {filename}"
        raise ValueError(msg)
    return mime_type
