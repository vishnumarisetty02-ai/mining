# GeoMine — Architecture

> Version: 0.1.0 | Status: Foundation | Last updated: 2026-10-03

## 1. System Overview

GeoMine is a governed AI platform that processes geological, mining and production
documents for CMPDI and Coal India subsidiaries. It extracts **facts with evidence**,
validates generated reports through a **deterministic Consistency Firewall**, tracks
changes between report versions, answers high-priority questions (e.g. parliamentary
questions) with evidence packages, and exports approved Word/PDF reports.

```text
               CMPDI / CIL DOCUMENTS
                         ↓
           ┌─────────────────────────┐
           │     DOCUMENT AI         │
           │ OCR | Tables | NLP      │
           └────────────┬────────────┘
                        ↓
              DOMAIN DATA LAYER
                        ↓
           ┌─────────────────────────┐
           │  NORMALIZATION ENGINE   │
           │ Units | Dates | Entities│
           └────────────┬────────────┘
                        ↓
            ┌──────────────────────┐
            │ VALIDATION ENGINE    │
            │ Conflicts | Rules    │
            └──────────┬───────────┘
                       ↓
              TRUSTED FACT STORE
                       ↓
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
    RAG SEARCH      REPORT AI      TOPIC AI
        ↓              ↓              ↓
        └──────────────┼──────────────┘
                       ↓
             CONSISTENCY FIREWALL
                       ↓
                HUMAN REVIEW
                       ↓
            FINAL VERIFIED OUTPUT
```

### 1.1 Ten-Stage Pipeline

| # | Stage       | Responsibility                                              | Key Rule |
|---|-------------|-------------------------------------------------------------|----------|
| 1 | **Document**    | Ingest file, compute SHA-256, store immutable original in MinIO | R3       |
| 2 | **Understand**  | Detect layout, pages, tables, figures; classify document type   | R5       |
| 3 | **Extract**     | OCR + structured extraction → candidate facts with coordinates  | R1, R6   |
| 4 | **Normalise**   | Standardise units (pint), dates, entity names (rapidfuzz)       | R1       |
| 5 | **Validate**    | Consistency Firewall: cross-check facts, flag contradictions    | R2       |
| 6 | **Retrieve**    | Vector search (pgvector) for related facts and prior reports    | R7       |
| 7 | **Calculate**   | Derived metrics (production totals, ratios, trends)             | R1       |
| 8 | **Generate**    | LLM composes report/answer from validated facts only            | R1, R7   |
| 9 | **Audit**       | Append-only audit record for every state change                 | R12      |
|10 | **Approve**     | Human approval workflow with digital signature                  | R2       |

## 2. Component Architecture

### 2.1 Packages (Shared Libraries)

```
packages/
├── core_models/             # Pydantic v2 domain models, enums, shared types
│   ├── __init__.py
│   ├── document.py          # Document, DocumentMetadata, SHA256Hash
│   ├── fact.py              # Fact, Evidence, FactStatus
│   ├── report.py            # Report, ReportVersion, ReportSection
│   ├── audit.py             # AuditRecord, AuditAction
│   ├── pipeline.py          # PipelineJob, PipelineStage, StageResult
│   └── subsidiary.py        # SubsidiaryId enum (ECL, BCCL, CCL, ...)
│
├── consistency_firewall/    # Deterministic validation engine
│   ├── __init__.py
│   ├── engine.py            # FirewallEngine — runs all rules, returns FirewallVerdict
│   ├── rules/               # Individual rule implementations
│   │   ├── __init__.py
│   │   ├── cross_total.py   # Sums must match declared totals
│   │   ├── temporal.py      # Values must respect time ordering
│   │   ├── range_check.py   # Physical plausibility bounds
│   │   └── unit_compat.py   # Unit compatibility checks
│   └── verdict.py           # FirewallVerdict, Finding, Severity
│
├── document_ai/             # Document processing and extraction
│   ├── __init__.py
│   ├── ingest.py            # SHA-256 hashing, MIME detection, MinIO upload
│   ├── layout.py            # Page layout analysis, table detection
│   ├── ocr.py               # PaddleOCR / Tesseract wrapper (EN + HI)
│   ├── extractors/          # Format-specific extractors
│   │   ├── __init__.py
│   │   ├── pdf_extractor.py
│   │   ├── docx_extractor.py
│   │   ├── xlsx_extractor.py
│   │   └── csv_extractor.py
│   └── normaliser.py        # Unit, date, entity normalisation
│
└── llm_gateway/             # Unified LLM access (R7)
    ├── __init__.py
    ├── gateway.py           # LLMGateway class — the ONLY entry point
    ├── providers/
    │   ├── __init__.py
    │   ├── base.py          # Abstract LLMProvider
    │   ├── cloud.py         # Cloud API provider (OpenAI-compatible)
    │   └── ollama.py        # Ollama local provider
    ├── schemas.py           # Request/Response schemas, JSON-schema validation
    └── config.py            # Gateway configuration (12-factor, R8)
```

### 2.2 Services (Deployable)

```
services/
├── api/                     # FastAPI application
│   ├── __init__.py
│   ├── main.py              # App factory, middleware, CORS, OTEL
│   ├── config.py            # Settings from environment (R8)
│   ├── database.py          # Async SQLAlchemy engine, session, RLS (R13)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── documents.py     # Upload, list, get, download
│   │   ├── facts.py         # Query facts with evidence
│   │   ├── reports.py       # Generate, list, approve, export
│   │   ├── questions.py     # Parliamentary Q&A with evidence packages
│   │   ├── pipeline.py      # Pipeline job status, retry
│   │   └── health.py        # /healthz, /readyz, /metrics
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── document.py
│   │   ├── fact.py
│   │   ├── report.py
│   │   ├── audit.py
│   │   └── user.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── tenant.py        # Extract subsidiary from JWT, set RLS var
│   │   └── audit.py         # Auto-audit middleware
│   └── deps.py              # FastAPI dependency injection
│
└── worker/                  # arq async task workers
    ├── __init__.py
    ├── main.py              # Worker entrypoint, task registry
    ├── config.py            # Worker settings
    └── tasks/
        ├── __init__.py
        ├── ingest.py        # Stage 1: Document ingestion task
        ├── understand.py    # Stage 2: Layout analysis task
        ├── extract.py       # Stage 3: Fact extraction task
        ├── normalise.py     # Stage 4: Normalisation task
        ├── validate.py      # Stage 5: Firewall validation task
        ├── retrieve.py      # Stage 6: Vector retrieval task
        ├── calculate.py     # Stage 7: Derived metrics task
        └── generate.py      # Stage 8: Report generation task
```

## 3. Data Model

### 3.1 Core Tables

```sql
-- All tables include: subsidiary_id, created_at, updated_at
-- RLS policy: current_setting('app.subsidiary_id') = subsidiary_id

documents (
    id              UUID PRIMARY KEY,
    sha256          CHAR(64) UNIQUE NOT NULL,     -- R3: immutable content address
    filename        TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    storage_key     TEXT NOT NULL,                 -- MinIO object key
    page_count      INTEGER,
    subsidiary_id   TEXT NOT NULL,                 -- R13: tenant
    status          TEXT NOT NULL DEFAULT 'uploaded',
    metadata        JSONB DEFAULT '{}'
)

facts (
    id              UUID PRIMARY KEY,
    document_id     UUID REFERENCES documents(id),
    category        TEXT NOT NULL,                 -- production, geology, finance, ...
    metric_name     TEXT NOT NULL,
    numeric_value   NUMERIC,
    text_value      TEXT,
    unit            TEXT,
    period_start    DATE,
    period_end      DATE,
    subsidiary_id   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'candidate',
    confidence      REAL,
    extractor_version TEXT NOT NULL                -- R4: idempotency key component
)

evidence (
    id              UUID PRIMARY KEY,
    fact_id         UUID REFERENCES facts(id),
    document_id     UUID REFERENCES documents(id),
    page_number     INTEGER NOT NULL,
    table_index     INTEGER,
    bbox_x0         REAL, bbox_y0 REAL,
    bbox_x1         REAL, bbox_y1 REAL,           -- R1: bounding box coordinates
    extracted_text  TEXT NOT NULL,
    subsidiary_id   TEXT NOT NULL
)

reports (
    id              UUID PRIMARY KEY,
    title           TEXT NOT NULL,
    report_type     TEXT NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    status          TEXT NOT NULL DEFAULT 'draft',  -- draft → validated → approved → published
    content         JSONB NOT NULL,                 -- structured sections
    firewall_verdict JSONB,                         -- R2: deterministic validation result
    subsidiary_id   TEXT NOT NULL,
    created_by      UUID,
    approved_by     UUID,
    approved_at     TIMESTAMPTZ
)

audit_log (
    id              UUID PRIMARY KEY,
    entity_type     TEXT NOT NULL,                  -- document, fact, report
    entity_id       UUID NOT NULL,
    action          TEXT NOT NULL,                   -- created, updated, validated, approved
    actor_id        UUID,
    actor_type      TEXT NOT NULL DEFAULT 'system',  -- system, user
    old_value       JSONB,
    new_value       JSONB,
    subsidiary_id   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- R12: append-only, no UPDATE or DELETE grants
)

pipeline_jobs (
    id              UUID PRIMARY KEY,
    document_sha256 CHAR(64) NOT NULL,
    stage           TEXT NOT NULL,
    extractor_version TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending → running → done → failed
    result          JSONB,
    error           TEXT,
    subsidiary_id   TEXT NOT NULL,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    UNIQUE(document_sha256, stage, extractor_version)  -- R4: idempotency
)
```

### 3.2 Vector Index

```sql
-- pgvector extension for semantic retrieval (Stage 6)
CREATE EXTENSION IF NOT EXISTS vector;

fact_embeddings (
    id              UUID PRIMARY KEY,
    fact_id         UUID REFERENCES facts(id),
    embedding       vector(1024),                    -- bge-m3 dimensions
    subsidiary_id   TEXT NOT NULL
)

CREATE INDEX fact_embeddings_ivfflat
    ON fact_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

## 4. Security Architecture

### 4.1 Multi-Tenancy (R13)

```sql
-- Enable RLS on every table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation ON documents
    USING (subsidiary_id = current_setting('app.subsidiary_id'));

-- Repeated for: facts, evidence, reports, audit_log, pipeline_jobs, fact_embeddings
```

The API middleware extracts `subsidiary_id` from the authenticated JWT claims and sets
the PostgreSQL session variable before every query.

### 4.2 Authentication

- Keycloak OIDC with subsidiary claim in JWT
- `oidc-client-ts` on frontend
- FastAPI dependency validates JWT and extracts claims

### 4.3 Document Safety (R5)

- Document text is **untrusted data** — never executed or followed as instructions
- LLM outputs are constrained to JSON schemas and validated; invalid output is rejected
- Uploaded files scanned for embedded scripts / macros

## 5. Observability (R11)

| Signal     | Tool            | Detail                                      |
|------------|-----------------|---------------------------------------------|
| Logs       | structlog → Loki| JSON structured logs, correlation IDs        |
| Traces     | OpenTelemetry   | Distributed traces across API + workers      |
| Metrics    | Prometheus      | Request latency, pipeline throughput, errors  |
| Dashboards | Grafana         | Pre-built dashboards for pipeline + API       |
| Health     | `/healthz`      | Liveness probe for Kubernetes                 |
| Readiness  | `/readyz`       | Checks DB + Redis + MinIO connectivity        |

## 6. Deployment

### 6.1 Docker Compose (Development)

PostgreSQL 16 + pgvector, Redis 7, MinIO, Keycloak, API server, Worker, Grafana stack.

### 6.2 Kubernetes (Production)

- Helm chart in `deploy/helm/geomine/`
- KEDA for autoscaling workers based on Redis queue length
- cert-manager for TLS
- Network policies for service isolation

## 7. Configuration (R8)

All configuration via environment variables (12-factor). No secrets in code or images.

| Variable                   | Description                          | Default          |
|---------------------------|--------------------------------------|------------------|
| `DATABASE_URL`            | PostgreSQL connection string          | —                |
| `REDIS_URL`               | Redis connection string               | —                |
| `MINIO_ENDPOINT`          | MinIO S3 endpoint                     | —                |
| `MINIO_ACCESS_KEY`        | MinIO access key                      | (from secret mgr)|
| `MINIO_SECRET_KEY`        | MinIO secret key                      | (from secret mgr)|
| `LLM_PROVIDER`            | `cloud` or `ollama`                   | `ollama`         |
| `LLM_MODEL`               | Model name                            | `llama3.1`       |
| `LLM_API_BASE`            | API base URL                          | —                |
| `LLM_API_KEY`             | API key (cloud provider)              | (from secret mgr)|
| `EMBEDDING_MODEL`         | Embedding model name                  | `bge-m3`         |
| `KEYCLOAK_URL`            | Keycloak OIDC issuer URL              | —                |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint  | —                |

## 8. Quality Gates

| Gate                 | Tool              | Threshold          |
|----------------------|-------------------|--------------------|
| Lint                 | ruff              | Zero warnings       |
| Type checking        | mypy --strict     | Zero errors         |
| Unit test coverage   | pytest-cov        | ≥ 80%              |
| Property tests       | Hypothesis        | 100 examples/test   |
| API contract         | Schemathesis      | Zero violations     |
| Security scan        | bandit, safety    | Zero high/critical  |
| Accessibility        | axe               | Zero violations     |
| Performance          | k6, Lighthouse CI | Per-endpoint SLOs   |
