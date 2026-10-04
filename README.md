# CMPDI / CIL AI-Powered Reporting Intelligence

> **AI-Powered Geological, Mining and Other Reporting Solution for CMPDI/CIL Subsidiaries**  
> Smart Automation MVP — Streamlit-based platform

---

## Key Features (Unique Differentiators)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Fact Passport** | Every extracted fact carries provenance: source doc, page, snippet, confidence, verification status |
| 2 | **Consistency Firewall** | Cross-document conflict detection, low-confidence flagging, arithmetic sanity checks |
| 3 | **Change Intelligence** | Period-to-period delta analysis per mine/entity; flags high-impact changes |
| 4 | **Parliamentary Copilot** | Decomposes a question into evidence requirements, retrieves facts, drafts an answer |
| 5 | **Mining Domain Ontology** | Configurable alias dictionary for GCV, overburden, stripping ratio, reserves, etc. |
| 6 | **Evidence Trace** | Every AI answer traces: Answer → Fact ID → Document → Page → Snippet |
| 7 | **Human Approval Workflow** | All AI-generated output is a draft until verified by an authorized user |

---

## Project Structure

```
mining/
├── app.py                  # Main Streamlit application
├── requirements.txt        # Python dependencies
├── README.md               # This file
├── .streamlit/
│   └── config.toml         # Shared slate-dark Streamlit theme
├── data/                   # SQLite database (auto-created)
│   └── cmpdi_unique_reporting.db
├── demo_data/              # Synthetic CSV/TXT files for testing
│   └── *.csv, *.txt
├── reports/                # Generated DOCX/PDF reports
└── models/                 # Reserved for future ML model artifacts
```

## Interface Theme

The Streamlit workspace uses a custom slate-dark theme with mint accents,
glass-like bordered panels, styled navigation and controls, responsive KPI
cards, polished empty states, and animated loading feedback. Shared theme
tokens are configured in `.streamlit/config.toml`; the reusable CSS and layout
components are in `app.py`. Slow decorative animation automatically respects
the browser's reduced-motion accessibility preference.

---

## Modules

1. **Dashboard** — KPI cards, workflow diagram, recent facts
2. **Document Center** — Upload PDF/DOCX/XLSX/CSV/TXT/PNG/JPG; OCR support
3. **Fact Passport** — Browse every extracted fact with full provenance; mark Verified
4. **Consistency Firewall** — ERROR / WARNING / PASS report before approval
5. **Change Intelligence** — Compare two reporting periods for any entity
6. **AI Query Assistant** — Natural-language evidence search with evidence trace
7. **Parliamentary Copilot** — Draft responses to parliamentary questions from evidence
8. **Topic Intelligence** — Keywords, domain topic scores, word cloud
9. **Report Generator** — Download DOCX or PDF with facts + firewall + approval note
10. **Mining Ontology** — View and test the domain term dictionary
11. **Audit Log** — Full activity trail

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the application
streamlit run app.py

# 3. Open in browser (auto-opens)
#    http://localhost:8501
```

---

## Testing with Demo Data

The `demo_data/` folder contains synthetic CSV files.  
Upload them via **Document Center → Process & Index Documents**.

---

## Technical Stack

- Python 3.10+
- Streamlit (UI)
- SQLite (database)
- PyMuPDF (PDF text extraction)
- python-docx (DOCX read/write)
- Pillow (image handling)
- pytesseract (optional OCR for scanned docs)
- scikit-learn (TF-IDF search)
- WordCloud + Matplotlib (topic visualization)
- ReportLab (PDF generation)
- Requests (optional Ollama integration)

---

## Workflow

```
UPLOAD
  → OCR / EXTRACTION
    → DOMAIN NORMALIZATION
      → FACT PASSPORT
        → CONSISTENCY FIREWALL
          → EVIDENCE SEARCH
            → AI QUERY / PARLIAMENTARY COPILOT
              → CHANGE INTELLIGENCE
                → REPORT GENERATION
                  → HUMAN APPROVAL
                    → FINAL OUTPUT
```

---

## Important Notes

- This is a **prototype** for demonstration purposes.
- Use only approved / synthetic data.
- AI-generated outputs are **drafts** and must be validated by an authorized officer before official use.
- No real CMPDI/CIL confidential data is stored or hard-coded.
- Numerical facts are retrieved deterministically from the indexed database, not invented by an LLM.

---

## Optional: Ollama Local LLM

For answer wording (not numerical retrieval), you may run a local Ollama model:

```bash
ollama pull llama3.2
ollama serve
```

Then enable the **"Use local Ollama"** checkbox in the AI Query Assistant.

---

## Deployment (GitHub / Render)

```bash
git init
git add .
git commit -m "CMPDI/CIL AI Reporting MVP"
git remote add origin <your-github-url>
git push -u origin main
```

For Render: add a **Web Service**, set build command `pip install -r requirements.txt`, start command `streamlit run app.py --server.port $PORT --server.address 0.0.0.0`.

---

*CMPDI / CIL AI Reporting Intelligence — Hackathon MVP*
