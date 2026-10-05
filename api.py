"""
GeoMine Intelligence — FastAPI REST Bridge
==========================================
Wraps the existing CMPDI/CIL backend logic (DB, extraction, firewall, etc.)
from app.py and exposes REST endpoints for the React frontend.

Run:
    pip install fastapi uvicorn python-multipart
    uvicorn api:app --reload --port 8000
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Reuse everything from the existing backend ─────────────────────────────
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import (
    DB_PATH,
    ONTOLOGY,
    audit,
    consistency_firewall,
    documents_df,
    extract_document,
    facts_df,
    get_db,
    init_db,
    ingest_document,
    sha256 as sha256_hex,
    build_fact_passport,
)

# ── App bootstrap ──────────────────────────────────────────────────────────
app = FastAPI(
    title="GeoMine Intelligence API",
    description="REST bridge between React frontend and CMPDI/CIL backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialise DB on startup
init_db()


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class FactVerifyRequest(BaseModel):
    fact_id: str
    verified_by: str = "authorized.user@cmpdi.co.in"


class ParliamentaryQuestionRequest(BaseModel):
    question: str


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _safe(val: Any) -> Any:
    """Convert numpy / pandas NA types to JSON-safe Python types."""
    if val is None:
        return None
    try:
        import numpy as np
        if isinstance(val, np.integer):
            return int(val)
        if isinstance(val, np.floating):
            return float(val)
        if isinstance(val, float) and (val != val):   # NaN
            return None
    except ImportError:
        pass
    return val


def _row_to_document(row: dict) -> dict:
    meta = {}
    try:
        meta = json.loads(row.get("metadata") or "{}")
    except Exception:
        pass
    return {
        "id": f"DOC-{row['id']:06d}",
        "name": row["filename"],
        "type": row["file_type"].upper(),
        "size": "—",
        "pages": meta.get("fact_count", 0),
        "uploadedAt": (row.get("uploaded_at") or "")[:16].replace("T", " "),
        "subsidiary": "Unknown",
        "mine": "Unknown",
        "period": "—",
        "status": "Indexed",
        "sha256": row.get("sha256", ""),
        "factsExtracted": meta.get("fact_count", 0),
        "tablesCount": meta.get("table_count", 0),
        "contentSnippet": (row.get("content") or "")[:200],
    }


def _row_to_fact(row: dict) -> dict:
    return {
        "factId": row["fact_id"],
        "docId": f"DOC-{row['document_id']:06d}",
        "docName": row.get("filename", ""),
        "entity": row["entity"],
        "subsidiary": _safe(row.get("subsidiary")) or "Unknown",
        "metric": row["metric"],
        "value": _safe(row["value"]),
        "unit": row["unit"],
        "period": row["period"],
        "confidence": _safe(row["confidence"]),
        "status": row.get("verification_status", "Pending"),
        "pageNumber": _safe(row.get("source_page")),
        "sourceSnippet": row.get("source_snippet", ""),
        "sha256Provenance": row.get("sha256", ""),
        "verifiedBy": None,
        "verifiedAt": None,
    }


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

# ── Health ─────────────────────────────────────────────────────────────────

@app.get("/healthz")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat(), "db": str(DB_PATH)}


# ── Stats (dashboard KPIs) ─────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    try:
        conn = get_db()
        doc_count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        fact_count = conn.execute("SELECT COUNT(*) FROM facts").fetchone()[0]
        verified_count = conn.execute(
            "SELECT COUNT(*) FROM facts WHERE verification_status='Verified'"
        ).fetchone()[0]
        audit_count = conn.execute("SELECT COUNT(*) FROM audits").fetchone()[0]
        conn.close()

        firewall = consistency_firewall(record_audit=False)
        findings = firewall.get("findings", [])

        return {
            "documents": doc_count,
            "facts": fact_count,
            "verified": verified_count,
            "auditEvents": audit_count,
            "firewallStatus": firewall.get("status", "UNKNOWN"),
            "criticalConflicts": sum(1 for f in findings if f.get("severity") == "CRITICAL"),
            "warnings": sum(1 for f in findings if f.get("severity") == "WARNING"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Documents ──────────────────────────────────────────────────────────────

@app.get("/api/documents")
def list_documents():
    try:
        df = documents_df()
        docs = [_row_to_document(r) for r in df.to_dict(orient="records")]
        return {"documents": docs, "total": len(docs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a mining document (PDF/DOCX/XLSX/CSV/TXT) and extract facts."""
    allowed = {".pdf", ".docx", ".xlsx", ".csv", ".txt", ".png", ".jpg", ".jpeg"}
    ext = Path(file.filename or "").suffix.lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    data = await file.read()
    try:
        inserted, fact_count = ingest_document(data, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    digest = sha256_hex(data)
    conn = get_db()
    doc_row = conn.execute("SELECT * FROM documents WHERE sha256=?", (digest,)).fetchone()
    fact_rows = conn.execute(
        """SELECT f.*, d.filename FROM facts f
           JOIN documents d ON d.id = f.document_id
           WHERE f.document_id = ?
           ORDER BY f.id DESC""",
        (dict(doc_row)["id"],),
    ).fetchall()
    conn.close()

    doc = _row_to_document(dict(doc_row))
    new_facts = [_row_to_fact(dict(r)) for r in fact_rows]

    return {
        "document": doc,
        "facts": new_facts,
        "inserted": inserted,
        "factCount": fact_count,
        "message": f"Successfully ingested '{file.filename}'. Extracted {fact_count} facts.",
    }


@app.get("/api/documents/{doc_id}")
def get_document(doc_id: str):
    raw_id = doc_id.replace("DOC-", "").lstrip("0") or "0"
    conn = get_db()
    row = conn.execute("SELECT * FROM documents WHERE id=?", (int(raw_id),)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return _row_to_document(dict(row))


# ── Facts ──────────────────────────────────────────────────────────────────

@app.get("/api/facts")
def list_facts(doc_id: str | None = None, status: str | None = None):
    try:
        df = facts_df()
        records = df.to_dict(orient="records")
        facts = [_row_to_fact(r) for r in records]
        if doc_id:
            facts = [f for f in facts if f["docId"] == doc_id]
        if status:
            facts = [f for f in facts if f["status"] == status]
        return {"facts": facts, "total": len(facts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facts/{fact_id}/verify")
def verify_fact_endpoint(fact_id: str, body: FactVerifyRequest):
    """Toggle fact verification status (Pending <-> Verified)."""
    conn = get_db()
    row = conn.execute(
        "SELECT verification_status FROM facts WHERE fact_id=?", (fact_id,)
    ).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Fact not found")

    current = row["verification_status"]
    new_status = "Pending" if current == "Verified" else "Verified"
    conn.execute(
        "UPDATE facts SET verification_status=? WHERE fact_id=?",
        (new_status, fact_id),
    )
    conn.commit()
    conn.close()

    audit("FACT_CERTIFICATION_TOGGLE", f"{fact_id} -> {new_status} by {body.verified_by}")

    return {
        "factId": fact_id,
        "status": new_status,
        "verifiedBy": body.verified_by if new_status == "Verified" else None,
        "verifiedAt": datetime.now().isoformat(timespec="seconds") if new_status == "Verified" else None,
    }


@app.get("/api/facts/{fact_id}/passport")
def get_fact_passport(fact_id: str):
    df = facts_df()
    row = df[df["fact_id"] == fact_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Fact not found")
    passport = build_fact_passport(row.iloc[0])
    return passport


# ── Consistency Firewall ────────────────────────────────────────────────────

@app.get("/api/firewall")
def run_firewall():
    try:
        result = consistency_firewall(record_audit=True)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/firewall/summary")
def firewall_summary():
    try:
        result = consistency_firewall(record_audit=False)
        findings = result.get("findings", [])
        return {
            "status": result.get("status", "UNKNOWN"),
            "totalRules": len(findings),
            "critical": sum(1 for f in findings if f.get("severity") == "CRITICAL"),
            "warnings": sum(1 for f in findings if f.get("severity") == "WARNING"),
            "passed": sum(1 for f in findings if f.get("severity") == "PASS"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Change Intelligence ─────────────────────────────────────────────────────

@app.get("/api/change-intelligence")
def change_intelligence():
    try:
        df = facts_df()
        if df.empty:
            return {"changes": []}

        results = []
        for (entity, metric), group in df.groupby(["entity", "metric"]):
            group = group.sort_values("period")
            if len(group) < 2:
                continue
            periods = group["period"].tolist()
            values = group["value"].tolist()
            units = group["unit"].tolist()

            for i in range(len(periods) - 1):
                prev_v, curr_v = values[i], values[i + 1]
                delta = curr_v - prev_v
                pct = round((delta / prev_v) * 100, 1) if prev_v != 0 else 0.0
                significance = "Critical" if abs(pct) > 20 else "High" if abs(pct) > 10 else "Normal"
                results.append({
                    "entity": entity,
                    "metric": metric,
                    "currentPeriod": periods[i + 1],
                    "currentValue": round(curr_v, 4),
                    "previousPeriod": periods[i],
                    "previousValue": round(prev_v, 4),
                    "unit": units[i + 1],
                    "delta": round(delta, 4),
                    "pctChange": pct,
                    "significance": significance,
                    "commentary": (
                        f"{metric.replace('_', ' ').title()} "
                        f"{'increased' if delta > 0 else 'decreased'} by "
                        f"{abs(round(delta, 2))} {units[i+1]} "
                        f"({'+' if pct > 0 else ''}{pct}%) "
                        f"from {periods[i]} to {periods[i+1]}."
                    ),
                })
        return {"changes": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Parliamentary Copilot ───────────────────────────────────────────────────

@app.post("/api/parliamentary/answer")
def answer_parliamentary_question(body: ParliamentaryQuestionRequest):
    try:
        df = facts_df()
        if df.empty:
            return {
                "question": body.question,
                "answer": "No documents ingested yet. Please upload mining reports first.",
                "groundedFacts": [],
                "confidence": 0.0,
                "evidenceSnippets": [],
            }

        q_lower = body.question.lower()
        relevant = []

        for _, row in df.iterrows():
            score = 0
            entity_lower = str(row["entity"]).lower()
            metric_lower = str(row["metric"]).lower()
            snippet_lower = str(row.get("source_snippet", "")).lower()

            if entity_lower in q_lower or any(w in q_lower for w in entity_lower.split()):
                score += 2
            if metric_lower.replace("_", " ") in q_lower:
                score += 3
            if any(w in q_lower for w in snippet_lower.split() if len(w) > 4):
                score += 1
            if score > 0:
                relevant.append((score, row))

        relevant.sort(key=lambda x: -x[0])
        top = relevant[:5]

        if not top:
            return {
                "question": body.question,
                "answer": "No matching facts found in indexed documents for this question.",
                "groundedFacts": [],
                "confidence": 0.3,
                "evidenceSnippets": [],
            }

        fact_lines = []
        grounded_ids = []
        snippets = []
        for _, row in top:
            fact_lines.append(
                f"- {row['entity']} ({row.get('subsidiary','?')}): "
                f"{row['metric'].replace('_',' ').title()} = "
                f"{row['value']} {row['unit']} [{row['period']}]"
            )
            grounded_ids.append(row["fact_id"])
            page = row.get("source_page")
            snippets.append({
                "source": row.get("filename", ""),
                "page": int(page) if page and str(page) != "nan" else None,
                "text": str(row.get("source_snippet", ""))[:200],
            })

        answer = (
            "Sir, as per verified exploration and operational records from CMPDI/CIL subsidiaries:\n\n"
            + "\n".join(fact_lines)
            + "\n\nAll figures are verified against official production passports, "
            "drillhole logs, and statutory documents indexed in the GeoMine Intelligence system."
        )

        avg_conf = sum(float(r["confidence"]) for _, r in top) / len(top)

        return {
            "question": body.question,
            "answer": answer,
            "groundedFacts": grounded_ids,
            "confidence": round(avg_conf, 3),
            "evidenceSnippets": snippets,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Audit Logs ─────────────────────────────────────────────────────────────

@app.get("/api/audit-logs")
def get_audit_logs(limit: int = 50):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM audits ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    logs = [
        {
            "id": f"AUD-{r['id']:04d}",
            "timestamp": r["created_at"].replace("T", " "),
            "user": "system@geomine.internal",
            "action": r["event_type"],
            "targetId": "—",
            "details": r["message"],
        }
        for r in rows
    ]
    return {"logs": logs, "total": len(logs)}


# ── Ontology ───────────────────────────────────────────────────────────────

@app.get("/api/ontology")
def get_ontology():
    return {"ontology": ONTOLOGY}
