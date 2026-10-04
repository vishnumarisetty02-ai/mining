# GeoMine API Dockerfile
FROM python:3.12-slim AS base

# Install system dependencies for document processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-hin \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first (layer caching)
COPY pyproject.toml ./

# Install dependencies
RUN uv sync --no-dev

# Copy application code
COPY packages/ packages/
COPY services/ services/

# Non-root user
RUN useradd -m geomine
USER geomine

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/healthz').raise_for_status()"

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
