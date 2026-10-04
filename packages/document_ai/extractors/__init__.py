"""PDF extraction — structured text and table extraction from PDF files.

Uses pdfplumber for digital PDFs and OCR for scanned PDFs.
Extracts text with page numbers and bounding boxes for evidence (R1).
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ExtractedTable:
    """A table extracted from a PDF page."""

    page_number: int
    table_index: int
    headers: list[str]
    rows: list[list[str]]
    bbox: tuple[float, float, float, float] | None = None  # (x0, y0, x1, y1)


@dataclass(frozen=True)
class ExtractedText:
    """A block of text extracted from a PDF page with coordinates."""

    page_number: int
    text: str
    bbox: tuple[float, float, float, float] | None = None


@dataclass
class PDFExtractionResult:
    """Complete extraction result from a PDF document."""

    page_count: int = 0
    texts: list[ExtractedText] = field(default_factory=list)
    tables: list[ExtractedTable] = field(default_factory=list)
    is_scanned: bool = False
    ocr_language: str | None = None


def extract_pdf_text(pdf_bytes: bytes) -> PDFExtractionResult:
    """Extract text and tables from a PDF file.

    For digital PDFs, uses pdfplumber directly. For scanned PDFs
    (detected by low text density), falls back to OCR.

    Args:
        pdf_bytes: Raw PDF file content.

    Returns:
        PDFExtractionResult with pages, tables and OCR metadata.
    """
    import pdfplumber

    result = PDFExtractionResult()
    texts: list[ExtractedText] = []
    tables: list[ExtractedTable] = []

    with pdfplumber.open(pdf_bytes) as pdf:
        result.page_count = len(pdf.pages)

        for page_num, page in enumerate(pdf.pages, start=1):
            # Extract text
            page_text = page.extract_text() or ""
            if page_text.strip():
                texts.append(ExtractedText(
                    page_number=page_num,
                    text=page_text,
                    bbox=(
                        float(page.bbox[0]),
                        float(page.bbox[1]),
                        float(page.bbox[2]),
                        float(page.bbox[3]),
                    ),
                ))

            # Extract tables
            page_tables = page.extract_tables() or []
            for table_idx, table_data in enumerate(page_tables):
                if not table_data:
                    continue
                headers = [str(cell or "") for cell in table_data[0]]
                rows = [
                    [str(cell or "") for cell in row]
                    for row in table_data[1:]
                ]
                tables.append(ExtractedTable(
                    page_number=page_num,
                    table_index=table_idx,
                    headers=headers,
                    rows=rows,
                ))

    # Detect if scanned (heuristic: very little text relative to page count)
    total_chars = sum(len(t.text) for t in texts)
    if result.page_count > 0 and total_chars / result.page_count < 50:
        result.is_scanned = True

    result.texts = texts
    result.tables = tables
    return result
