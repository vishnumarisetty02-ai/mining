-- GeoMine PostgreSQL initialisation script
-- R13: Multi-tenancy via Row-Level Security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ── Documents ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sha256          CHAR(64) UNIQUE NOT NULL,
    filename        TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    storage_key     TEXT NOT NULL,
    page_count      INTEGER,
    subsidiary_id   TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'uploaded',
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Facts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facts (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id       UUID REFERENCES documents(id) ON DELETE CASCADE,
    category          TEXT NOT NULL,
    metric_name       TEXT NOT NULL,
    numeric_value     NUMERIC,
    text_value        TEXT,
    unit              TEXT,
    period_start      DATE,
    period_end        DATE,
    subsidiary_id     TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'candidate',
    confidence        REAL,
    extractor_version TEXT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Evidence ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_id         UUID REFERENCES facts(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number     INTEGER NOT NULL,
    table_index     INTEGER,
    bbox_x0         REAL,
    bbox_y0         REAL,
    bbox_x1         REAL,
    bbox_y1         REAL,
    extracted_text  TEXT NOT NULL,
    subsidiary_id   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Reports ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title             TEXT NOT NULL,
    report_type       TEXT NOT NULL,
    version           INTEGER NOT NULL DEFAULT 1,
    status            TEXT NOT NULL DEFAULT 'draft',
    content           JSONB NOT NULL DEFAULT '[]',
    firewall_verdict  JSONB,
    subsidiary_id     TEXT NOT NULL,
    created_by        UUID,
    approved_by       UUID,
    approved_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Audit Log (R12: append-only) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    action          TEXT NOT NULL,
    actor_id        UUID,
    actor_type      TEXT NOT NULL DEFAULT 'system',
    old_value       JSONB,
    new_value       JSONB,
    subsidiary_id   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent UPDATE and DELETE on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log records are immutable (R12). UPDATE and DELETE are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER audit_log_no_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ── Pipeline Jobs (R4: idempotent) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_jobs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_sha256   CHAR(64) NOT NULL,
    stage             TEXT NOT NULL,
    extractor_version TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending',
    result            JSONB,
    error             TEXT,
    subsidiary_id     TEXT NOT NULL,
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(document_sha256, stage, extractor_version)
);

-- ── Fact Embeddings (pgvector) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_embeddings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fact_id         UUID REFERENCES facts(id) ON DELETE CASCADE,
    embedding       vector(1024),
    subsidiary_id   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fact_embeddings_ivfflat
    ON fact_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ── Row-Level Security (R13) ─────────────────────────────────────────
-- Enable RLS on all data tables

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation_documents ON documents
    USING (subsidiary_id = current_setting('app.subsidiary_id', true));

ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation_facts ON facts
    USING (subsidiary_id = current_setting('app.subsidiary_id', true));

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation_evidence ON evidence
    USING (subsidiary_id = current_setting('app.subsidiary_id', true));

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation_reports ON reports
    USING (subsidiary_id = current_setting('app.subsidiary_id', true));

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation_audit ON audit_log
    USING (subsidiary_id = current_setting('app.subsidiary_id', true));

ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation_pipeline ON pipeline_jobs
    USING (subsidiary_id = current_setting('app.subsidiary_id', true));

ALTER TABLE fact_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY subsidiary_isolation_embeddings ON fact_embeddings
    USING (subsidiary_id = current_setting('app.subsidiary_id', true));

-- ── Indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_subsidiary ON documents(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_documents_sha256 ON documents(sha256);
CREATE INDEX IF NOT EXISTS idx_facts_document ON facts(document_id);
CREATE INDEX IF NOT EXISTS idx_facts_subsidiary ON facts(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_facts_metric ON facts(metric_name);
CREATE INDEX IF NOT EXISTS idx_facts_period ON facts(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_evidence_fact ON evidence(fact_id);
CREATE INDEX IF NOT EXISTS idx_reports_subsidiary ON reports(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_sha256 ON pipeline_jobs(document_sha256);
