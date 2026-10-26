# Cancer Intelligence & Analytics — Command Center Upgrade & Verification Report

**Document ID:** `reports/18_command_center_upgrade_report.md`  
**Execution Date:** 2026-10-21  
**Project:** Cancer Intelligence & Analytics (Academic DWM Platform)  
**System Architecture:** FastAPI Backend + SQLite Conformed Data Warehouse + Scikit-Learn Data Mining + Vite/React 19 Frontend  
**Inspiration Reference:** Maharashtra Crime Intelligence & Analytics (`MH-Crime-Intelligence`), WHO/IARC Global Cancer Observatory (GCO)  

---

## 1. Executive Summary & Acceptance Criteria Status

The Cancer Intelligence & Analytics application has been comprehensively upgraded into an interactive, visually impressive, and academically rigorous command-center platform. All critical defects—including the Data Mining Lab blank-screen crash and API report serialization discrepancies—have been diagnosed and definitively resolved.

| Acceptance Criterion | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Warehouse Integrity & Schema Validation** | **PASS** | `scripts/validate_warehouse.py` executed: **55/55 checks passed** (Exit Code 0). |
| **Backend Integration & API Verification** | **PASS** | `scripts/run_api_tests.py` executed: **13/13 tests passed** (Exit Code 0). |
| **Frontend Production Build** | **PASS** | `npm run build` executed: Built in 1.37s with 0 errors / 0 warnings. |
| **Section 1 (Overview) Verification** | **PASS** | 2022 national sum (1,461,427 cases) verified, 6 zonal rollups, top-5 state share bars, gender-stratified leading sites. |
| **Section 2 (Geography) Verification** | **PASS** | Interactive regional zonal comparison cards, 37 state heat distribution tiles by burden quintiles, inspection drawer with historical/projected CAGR. |
| **Section 3 (Cancer Sites) Verification** | **PASS** | 75 anatomical sites (76 dimension records), 11 organ systems, male vs female comparative dual burden, clinical stage distribution (Stages I–IV). |
| **Section 4 (Trends & Projections) Verification** | **PASS** | 2019–2045 multi-year trajectory workspace, Joinpoint APC regression trends with directional badges, 64 empirical PBCR registry records. |
| **Section 5 (Mortality & MIR) Verification** | **PASS** | MoHFW Dataset 5 single-site qualification banner prominently preserved, 2021–2025 year selector, sortable mortality table with calculated MIR. |
| **Section 6 (Infrastructure) Verification** | **PASS** | NP-NCD screening cascade (detection & treatment retention %), approved national TCCCs/SCIs grant metrics, Maharashtra district oncology profile. |
| **Section 7 (Data Mining Lab) Verification** | **PASS** | **Blank screen bug fixed** (runtime `ReferenceError: Activity is not defined` eliminated); all 6 DWM algorithms interactive with genuine verified metrics. |
| **Section 8 (Cancer Analytics Assistant) Verification** | **PASS** | Interactive Q&A chat engine (`POST /api/assistant/query`) grounded in warehouse tables with preset prompts and clinical guardrails. |
| **Section 9 (Data Provenance & Lineage) Verification** | **PASS** | Lineage matrix across Datasets 1–6, Dim_Measure_Type taxonomy, Dim_Time epoch classifications, DWM syllabus mapping. |
| **Section 10 (Exports & Technical Reports) Verification** | **PASS** | Live CSV downloads for all 15 warehouse tables, JSON model exports, 17 technical reports directory with formatted date/size. |
| **Themes & Accessibility** | **PASS** | Seamless Dark mode (Deep Navy `#0B1120`, Cyan `#06B6D4`, Orange `#F97316`) and Light mode (`#F8FAFC`, `#2563EB`) switching. |

---

## 2. Root Cause Analysis & Critical Defect Rectification

### Defect 1: Data Mining Lab Blank Screen Crash
- **Symptom:** When clicking the "Data Mining Lab" tab, the entire user interface rendered a completely blank white screen.
- **Root Cause:** In `frontend/src/components/DataMiningTab.jsx`, line 100 referenced `<Activity size={22} ... />` inside the Methodological Transparency Disclosure block. However, `Activity` was omitted from the `lucide-react` import statement on line 3. While the JSX compiler bundled the reference into `jsx(Activity, ...)`, at browser runtime evaluating `Activity` threw an unhandled `ReferenceError: Activity is not defined`, crashing the React render phase.
- **Resolution:** Imported `Activity` and `RefreshCw` from `lucide-react`, added comprehensive error boundaries, and implemented null-safe fallbacks for all 6 model structures.

### Defect 2: Exports Tab Technical Reports List Empty
- **Symptom:** In `ExportsTab.jsx`, the technical reports archive table displayed 0 rows despite 17 audit reports residing in `reports/`.
- **Root Cause:** In `frontend/src/components/ExportsTab.jsx`, line 32 destructured `data.reports || []`. However, `backend/routers/reports.py` returns a direct JSON array `[{ filename, size_bytes }]`, causing `data.reports` to evaluate to `undefined`. Furthermore, `backend/routers/reports.py` did not serialize the file `modified` timestamp.
- **Resolution:** Updated `ExportsTab.jsx` to parse `Array.isArray(data) ? data : (data.reports || [])` and updated `backend/routers/reports.py` to return `modified: os.path.getmtime(filepath)`.

---

## 3. Detailed Verification of the Six Data Mining Algorithms

All data mining metrics were regenerated and verified via `scripts/run_data_mining.py` against conformed warehouse records:

```
Task A: Regression & Trend Analysis
  - In-sample OLS 2022: MAE = 12.99 cases, RMSE = 18.33, R² = 1.0000
  - In-sample Ridge 2022: MAE = 12.99 cases, RMSE = 18.33, R² = 1.0000
  - Forward 2026 Out-of-sample Trajectory Validation: MAE = 2,896.91 cases, R² = 0.9922
  - Methodological Disclosure: In-sample R² = 1.0000 reflects deterministic ICMR-NCRP population model momentum across census projections with integer-rounding residuals. Genuine predictive validity is demonstrated on the 2026 forecast horizon.

Task B: Decision Tree Classification
  - Tree Complexity: Regularized max_depth = 3 (preventing overfitting on N = 37 states)
  - Accuracy: 62.16% (23 / 37 states correctly classified)
  - Macro F1-Score: 0.5302 across 4 demographic burden quartiles (Tier 1 Low to Tier 4 Severe)

Task C: Gaussian Naive Bayes Classification
  - Feature Space: Organ system encoding, crude incidence rate, and sex ratio asymmetry
  - Target: Tobacco-associated site attribution across 75 anatomical sites
  - Accuracy: 88.00% (66 / 75 sites correctly classified)
  - Sensitivity / Recall: 100.0% (13 / 13 tobacco-associated sites detected, 0 False Negatives)
  - Binary F1-Score: 0.7429

Task D: K-Means Clustering
  - Feature Scaling: StandardScaler (zero mean, unit variance) on 2019–2022 trajectory space
  - Optimal k: 4 clusters selected via silhouette score maximization (k = 4, Silhouette = 0.5218)
  - Cluster Profiles: Discloses state memberships, mean 2022 incidence, national burden share, and CAGR growth rates.

Task E: Hierarchical Agglomerative Clustering
  - Linkage Criterion: Ward's Minimum Variance Linkage
  - Distance Metric: Euclidean distance on standardized trajectory features
  - Cophenetic Correlation Coefficient: c = 0.7919 (> 0.75 gold standard threshold)
  - Agglomeration Matrix: 36 merge steps pairing smallest union territories before clustering regional groups and demographic giants.

Task F: Apriori Association Rule Mining
  - Transaction Formulation: 37 state baskets discretized into objective binary items using median splits
  - Rules Generated: 25 association rules meeting Support ≥ 15% and Confidence ≥ 60%
  - Maximum Lift: 2.47 (strong non-random epidemiological co-occurrence)
  - Causality Warning: Association does not imply clinical or biological causation.
```

---

## 4. Cancer Analytics Assistant Implementation

A dedicated analytical assistant router (`backend/routers/assistant.py`) and UI component (`frontend/src/components/AssistantTab.jsx`) were implemented to answer user queries with grounded warehouse records:
- **Direct Database Grounding:** Queries `Fact_State_Surveillance`, `Dim_Geography`, `Fact_Cancer_Incidence`, `Dim_Cancer_Site`, `Fact_State_Mortality_Surveillance`, `Fact_Screening_Programs`, and `warehouse/data_mining_results.json`.
- **Pre-configured Prompt Pills:** Supports 8 instant queries covering top burden states, zonal rollups, leading cancer sites by gender, 2026/2045 forecasts, MIR summary, ML metrics, and screening retention.
- **Clinical Guardrail:** Queries inquiring about individual personal symptoms, diagnostic advice, or medical treatment trigger an immediate explicit disclaimer redirecting the user to oncology specialists.

---

## 5. Warehouse and API Validation Results

### Warehouse Validation (`scripts/validate_warehouse.py`)
```
=== Cancer Intelligence Warehouse Validation Suite ===
DB Path: warehouse/cancer_dw.db
Database file size: 180,224 bytes

Schema Tables and Views: 15 Tables, 3 Star Views — PASS
Minimum Row Counts: All tables exceed threshold — PASS
Epoch Classifications: 2022 Extrapolated, 2024 Benchmark, 2026 Projected — PASS
Measure Codes: PBCR_EMPIRICAL, ICMR_NCRP_ESTIMATE, KUMAR_EXP_2026, GLOBOCAN_2024, PARLIAMENT_MOHFW — PASS
Stray Footnotes: Fact_Cancer_Trends_APC stray count = 0 — PASS
Referential Integrity: 0 orphaned foreign keys — PASS
Numeric Boundaries: 0 negative values — PASS
NULL Checks: 0 unexpected nulls — PASS
MIR Bounds: 100% of MIR values within [0.0, 1.5] — PASS
Clinical Stage Percentages: 100% within [0, 100] — PASS
National 2022 Sum Reconciliation: Calculated = 1,461,427.0, Difference = 0.0000% — PASS
Fact_Cancer_Incidence Grain Uniqueness: 0 duplicate groups — PASS
Data Provenance Metadata Columns: Present on all fact tables — PASS

SUMMARY: 55/55 checks PASSED | 0 FAILED | Exit Code: 0
```

### API Test Suite (`scripts/run_api_tests.py`)
```
=== Running FastAPI Backend Integration Tests ===
  [PASS] Root Endpoint
  [PASS] Health Check
  [PASS] Dashboard Summary (KPIs & Regional)
  [PASS] Geography & State Endpoints
  [PASS] Cancer Sites & Organ Systems
  [PASS] Trends, APC & PBCR Endpoints
  [PASS] Mortality & MIR Analytics
  [PASS] Infrastructure (National & MH)
  [PASS] OLAP Rollup, Slice & Pivots
  [PASS] Data Mining Models Endpoints
  [PASS] CSV Data Export Service
  [PASS] SQL Injection Prevention Guard
  [PASS] Cancer Analytics Assistant Query & Guardrails

BACKEND TEST SUMMARY: 13/13 PASSED | 0 FAILED | Exit Code: 0
```

---

## 6. Files Modified and Created

| File Path | Type | Modifications Summary |
| :--- | :---: | :--- |
| `frontend/src/styles/theme.css` | Enhanced | Command-center glassmorphism, glowing status dots, progress bar utilities, chat box styles. |
| `frontend/src/components/DataMiningTab.jsx` | Fixed & Upgraded | Imported `Activity`, resolved runtime crash, added interactive filters for all 6 algorithms. |
| `frontend/src/components/GeographyTab.jsx` | Upgraded | Added regional zonal cards, 37 state heat distribution tiles, inspection drawer, sortable table. |
| `frontend/src/components/CancerSitesTab.jsx` | Upgraded | Added view switcher: Site Burden (Male vs Female), Clinical Stage Distribution (I–IV), 75-site directory. |
| `frontend/src/components/TrendsTab.jsx` | Upgraded | Added view switcher: Trajectory Workspace (2019–2045), Joinpoint APC Trends, PBCR Surveillance table. |
| `frontend/src/components/MortalityTab.jsx` | Upgraded | Added search and multi-column sorting (State, Deaths, MIR), preserved Dataset 5 caveat banner. |
| `frontend/src/components/Navigation.jsx` | Upgraded | Added 10th tab for Cancer Analytics Assistant with "AI" badge. |
| `frontend/src/components/AssistantTab.jsx` | Created | Interactive chat assistant querying warehouse endpoints with prompt pills and guardrails. |
| `frontend/src/components/Header.jsx` | Enhanced | Added pulsating live warehouse status indicator, conformed table counter, dark/light toggle. |
| `frontend/src/components/ExportsTab.jsx` | Fixed | Corrected report array destructuring, formatted file modified dates and file sizes. |
| `frontend/src/App.jsx` | Upgraded | Registered Assistant tab routing, confirmed zero rendering regressions. |
| `frontend/src/services/api.js` | Enhanced | Added `postJson` and `askAssistant` client service methods. |
| `backend/routers/assistant.py` | Created | Grounded Q&A assistant endpoint with natural language intent matching and query generation. |
| `backend/routers/reports.py` | Enhanced | Added file `modified` timestamp to `/reports/list` response. |
| `backend/main.py` | Updated | Registered `assistant.router` under `/api/assistant`. |
| `backend/tests/test_api.py` | Updated | Added automated tests for assistant endpoint and medical guardrail. |
| `scripts/run_api_tests.py` | Updated | Included assistant test in the master backend test suite. |

---

## 7. Instructions to Execute the Application

### Backend API Server
```powershell
Set-Location "c:\Users\ACER\OneDrive\Desktop\Cancer-Intelligence-Analytics"
$env:PYTHONPATH="."
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Root: `http://127.0.0.1:8000`
- Interactive Swagger Docs: `http://127.0.0.1:8000/api/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

### Frontend Development Server
```powershell
Set-Location "c:\Users\ACER\OneDrive\Desktop\Cancer-Intelligence-Analytics\frontend"
npm.cmd run dev
```
- Local URL: `http://localhost:5173`

### Standalone Verification Suites
```powershell
# Warehouse Schema & Integrity Validation (55/55 PASS)
python scripts/validate_warehouse.py

# Backend Integration & Endpoint Tests (13/13 PASS)
$env:PYTHONPATH="."
python scripts/run_api_tests.py

# Frontend Production Build (0 Errors)
Set-Location "c:\Users\ACER\OneDrive\Desktop\Cancer-Intelligence-Analytics\frontend"
npm.cmd run build
```

---

## 8. Conclusion

The Cancer Intelligence & Analytics application meets and exceeds all project requirements. The user interface now matches the visual command-center quality of the reference project while preserving complete academic rigor, authentic conformed dimensional modeling, real Scikit-learn machine learning evaluations, and strict epidemiological provenance disclosures.
