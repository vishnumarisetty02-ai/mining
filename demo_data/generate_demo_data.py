"""
Generate synthetic demo data for CMPDI/CIL AI Reporting MVP.
Run: python demo_data/generate_demo_data.py
"""
import os
import csv
from pathlib import Path

DEMO_DIR = Path(__file__).resolve().parent

def write_csv(filename, rows):
    path = DEMO_DIR / filename
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)
    print(f"Created: {path}")

def write_txt(filename, content):
    path = DEMO_DIR / filename
    path.write_text(content, encoding="utf-8")
    print(f"Created: {path}")

# ── Demo 1: Mine Alpha production report FY2023-24 ──────────────────────────
write_csv("mine_alpha_FY2023-24.csv", [
    ["Mine: Alpha OC", "Subsidiary: Eastern Coalfields Ltd.", "FY 2023-24"],
    ["Metric", "Value", "Unit"],
    ["Production", "4.50", "MT"],
    ["Target", "5.00", "MT"],
    ["Dispatch", "4.20", "MT"],
    ["Reserve", "120.00", "MT"],
    ["GCV", "4200", "kcal/kg"],
    ["Overburden", "18.5", "MCum"],
    ["Stripping Ratio", "4.1", "ratio"],
    ["Depth", "85", "m"],
])

# ── Demo 2: Mine Alpha production report FY2024-25 ──────────────────────────
write_csv("mine_alpha_FY2024-25.csv", [
    ["Mine: Alpha OC", "Subsidiary: Eastern Coalfields Ltd.", "FY 2024-25"],
    ["Metric", "Value", "Unit"],
    ["Production", "5.10", "MT"],
    ["Target", "5.50", "MT"],
    ["Dispatch", "4.90", "MT"],
    ["Reserve", "114.50", "MT"],
    ["GCV", "4150", "kcal/kg"],
    ["Overburden", "22.0", "MCum"],
    ["Stripping Ratio", "4.3", "ratio"],
    ["Depth", "92", "m"],
])

# ── Demo 3: Mine Beta report FY2024-25 ──────────────────────────────────────
write_csv("mine_beta_FY2024-25.csv", [
    ["Mine: Beta UG", "Subsidiary: Bharat Coking Coal Ltd.", "FY 2024-25"],
    ["Metric", "Value", "Unit"],
    ["Production", "1.20", "MT"],
    ["Target", "1.50", "MT"],
    ["Dispatch", "1.10", "MT"],
    ["Reserve", "45.00", "MT"],
    ["GCV", "5800", "kcal/kg"],
    ["Depth", "310", "m"],
])

# ── Demo 4: Geological exploration summary TXT ───────────────────────────────
write_txt("geo_exploration_report.txt", """
GEOLOGICAL EXPLORATION REPORT
==============================
Project: Gamma Block Exploration
Period: FY 2024-25
Subsidiary: Central Mine Planning & Design Institute (CMPDI)

1. INTRODUCTION
   Borehole drilling was conducted across the Gamma Block in FY 2024-25.
   Total borehole depth: 1250 m across 8 boreholes.

2. RESERVE ESTIMATION
   Geological reserve is 85.50 MT as per FY 2024-25 assessment.
   Previous reserve estimate (FY 2023-24): 88.00 MT.

3. COAL QUALITY
   GCV is 4350 kcal/kg (average across seams sampled).
   Ash content: 28.5%
   Moisture: 7.2%

4. MINING OPERATIONS
   Overburden removal is 12.8 MCum for the period.
   Stripping ratio is 3.2 for the block.
   Production of coal was 3.80 MT for FY 2024-25.
   Target was 4.00 MT for FY 2024-25.

5. RECOMMENDATIONS
   Based on current reserve trends, extraction plan revision is recommended.
   Safety monitoring at depth (>200 m) must be reinforced.
""")

# ── Demo 5: Delta subsidiary summary FY2023-24 ───────────────────────────────
write_csv("delta_subsidiary_FY2023-24.csv", [
    ["Subsidiary: Delta Coalfields Ltd.", "FY 2023-24"],
    ["Mine/Unit", "Production (MT)", "Target (MT)", "Dispatch (MT)", "Reserve (MT)", "GCV (kcal/kg)"],
    ["Mine: Delta-1 OC", "8.20", "8.50", "7.90", "210.00", "3800"],
    ["Mine: Delta-2 OC", "3.10", "3.50", "2.90", "65.00", "4100"],
    ["Mine: Delta-3 UG", "0.85", "1.00", "0.80", "22.00", "5200"],
])

# ── Demo 6: Delta subsidiary summary FY2024-25 ───────────────────────────────
write_csv("delta_subsidiary_FY2024-25.csv", [
    ["Subsidiary: Delta Coalfields Ltd.", "FY 2024-25"],
    ["Mine/Unit", "Production (MT)", "Target (MT)", "Dispatch (MT)", "Reserve (MT)", "GCV (kcal/kg)"],
    ["Mine: Delta-1 OC", "9.05", "9.00", "8.80", "201.50", "3750"],
    ["Mine: Delta-2 OC", "3.40", "3.50", "3.20", "61.50", "4050"],
    ["Mine: Delta-3 UG", "0.92", "1.00", "0.88", "21.10", "5250"],
])

print("\nDemo data generation complete.")
print(f"Files saved to: {DEMO_DIR}")
print("\nNext: Upload these files via the Document Center in the Streamlit app.")
