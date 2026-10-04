"""
Quick functional smoke-test for the CMPDI/CIL AI Reporting backend.
Run: python test_backend.py
"""
import sys, types, unittest.mock as mock

# Stub out streamlit so we can import app.py without a display
st_mock = types.ModuleType("streamlit")
for attr in [
    "set_page_config","title","caption","sidebar","radio","divider","markdown",
    "header","subheader","write","metric","columns","dataframe","code","button",
    "file_uploader","selectbox","text_input","text_area","json","success","info",
    "warning","error","multiselect","checkbox","download_button","pyplot",
    "expander","rerun",
]:
    setattr(st_mock, attr, mock.MagicMock())
st_mock.session_state = {}
sys.modules["streamlit"] = st_mock

# ---- import only backend code (stop before Streamlit UI section) ------------
source = open("app.py", encoding="utf-8").read()
backend_src = source.split("# STREAMLIT UI")[0]
ns = {"__file__": str(__import__("pathlib").Path("app.py").resolve())}
exec(backend_src, ns)

init_db = ns["init_db"]
extract_document = ns["extract_document"]
extract_facts = ns["extract_facts"]
save_document = ns["save_document"]
sha256 = ns["sha256"]
facts_df = ns["facts_df"]
documents_df = ns["documents_df"]
consistency_firewall = ns["consistency_firewall"]
evidence_answer = ns["evidence_answer"]
draft_parliamentary_answer = ns["draft_parliamentary_answer"]
build_fact_passport = ns["build_fact_passport"]
top_keywords = ns["top_keywords"]
domain_topic_scores = ns["domain_topic_scores"]

PASS = lambda msg: print(f"  PASS  {msg}")
FAIL = lambda msg: (print(f"  FAIL  {msg}"), sys.exit(1))

print("=" * 60)
print("CMPDI/CIL AI Reporting — Backend Smoke Tests")
print("=" * 60)

# T1: DB init
init_db()
PASS("init_db()")

# T2: extract plain text document
demo = (
    b"Mine: Gamma OC  FY 2024-25\n"
    b"Production of coal is 3.50 MT.\n"
    b"Target is 4.00 MT.\n"
    b"GCV is 4500 kcal/kg.\n"
    b"Reserve is 60.00 MT.\n"
    b"Overburden removal is 8.5 MCum.\n"
    b"Borehole depth is 120 m.\n"
)
pages, text, _ = extract_document(demo, "test_gamma.txt")
PASS(f"extract_document: {len(pages)} page(s) extracted")

# T3: fact extraction
h = sha256(demo)
facts = extract_facts(pages, h)
PASS(f"extract_facts: {len(facts)} fact(s) found")
for f in facts:
    print(f"        {f['fact_id']} | {f['metric']:20s} | {f['value']:>12.2f} {f['unit']:15s} | conf={f['confidence']}")

if len(facts) == 0:
    FAIL("No facts extracted from demo text")

# T4: save document
doc_id, inserted = save_document(demo, "test_gamma.txt", "txt", text, facts)
PASS(f"save_document: doc_id={doc_id}, inserted={inserted}")

# T5: retrieve facts
df = facts_df()
PASS(f"facts_df: {len(df)} row(s) in DB")

# T6: consistency firewall
fw = consistency_firewall()
PASS(f"consistency_firewall: status={fw['status']} errors={fw['errors']} warnings={fw['warnings']}")

# T7: evidence query
ans = evidence_answer("What is the production for Gamma OC in FY 2024-25?")
PASS(f"evidence_answer: {ans['answer'][:80]}")

if ans["fact"] is not None:
    passport = build_fact_passport(ans["fact"])
    PASS(f"build_fact_passport: FACT_ID={passport['FACT_ID']}")

# T8: parliamentary copilot
analysis, draft, result = draft_parliamentary_answer(
    "What was production of Gamma OC in FY 2024-25?"
)
PASS(f"parliamentary_copilot: metrics={analysis['metrics']}")

# T9: topic intelligence
docs = documents_df()
text_blob = " ".join(docs["content"].fillna("").tolist())
scores = domain_topic_scores(text_blob)
keywords = top_keywords(text_blob, 10)
PASS(f"topic_intelligence: top topic={next(iter(scores))}, top keyword={keywords[0][0] if keywords else 'N/A'}")

print("=" * 60)
print("ALL TESTS PASSED")
print("=" * 60)
