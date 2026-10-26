# PHASE A: PROJECT CURRENT STATE & WORKSPACE AUDIT REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Report Reference:** `reports/12_project_current_state.md`  
**Execution Timestamp:** October 2026  
**Status:** Phase A Complete | Baseline Verified | Roadmap Defined  
**Active Database:** [`warehouse/cancer_dw.db`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/cancer_dw.db) (167,936 bytes)  

---

## 1. Executive Summary

This current-state audit establishes the verified baseline of the **Cancer Intelligence & Analytics** academic project before proceeding into analytical profiling, data mining, API services, and frontend engineering. 

All core data warehousing prerequisites (ETL ingestion, star/snowflake schema dimensional modeling, measure classification, and automated integrity validation) have been successfully engineered and verified. The database currently contains **1,228 records across 15 relational tables and 3 analytical views**, passing **55 of 55 automated validation checks** with exit code 0.

### Environment & Toolchain Status
- **Operating System:** Windows 11 (64-bit)
- **Python Runtime:** Python 3.13.1 (`C:\Users\ACER\AppData\Local\Programs\Python\Python313\python.exe`)
- **Package Manager (Python):** pip 26.0.1
- **Node.js Runtime:** Node.js v24.19.0
- **Package Manager (Node):** npm 11.17.0 (`npm.cmd`)
- **Core Installed Python Packages:** `pandas` (3.0.1), `numpy` (2.2.3), `openpyxl` (3.1.5), `docx` (1.1.2)
- **Packages Scheduled for Installation:** `fastapi`, `uvicorn`, `pydantic`, `scikit-learn`, `scipy`

---

## 2. Workspace Directory Structure & File Inventory

```
Cancer-Intelligence-Analytics/
├── Data/
│   ├── Cancer Dataset.zip                       # Original immutable raw zip archive (2,377,290 bytes)
│   ├── inspection_summary.json                  # Metadata inspection log
│   ├── final_excel_updated_details.json         # Workbook sheet inventory
│   └── extracted_temp/
│       └── Cancer Dataset/                      # Extracted source files
│           ├── cancer dataset 4.pdf
│           ├── Cancer_Data_India_2019_2026_Concise.xlsx
│           ├── dataset 3.pdf
│           ├── Dataset 5.docx                   # Parliamentary replies (Mortality/Incidence, unspecified cancer site)
│           ├── Dataset 6.docx                   # Approved infrastructure and NP-NCD screening tables
│           ├── Dataset 9.xlsx                   # GLOBOCAN 2024 site estimates & childhood cancer
│           ├── final excel.xlsx                 # Initial compilation
│           ├── final_excel_updated.xlsx         # Primary conformed workbook (State incidence, PBCRs, Trends, Stages)
│           └── final_excel_with_pdf_data (1).xlsx
├── Reference/
│   ├── dwm_syllabus_extracted.txt               # Mumbai University / Autonomous DWM Syllabus mapping
│   └── Latest_AAP-updated _Odd Sem2026-27_Final_DWM.docx
├── logs/
│   ├── etl_pipeline.log                         # Execution logs of ETL runs
│   └── validate_warehouse.log                   # Standalone validation output log
├── reports/
│   ├── 1_dataset_inventory_report.md
│   ├── 2_data_quality_report.md
│   ├── 3_recommended_dataset_selection_report.md
│   ├── 4_dwm_syllabus_mapping_report.md
│   ├── 5_refined_implementation_plan.md
│   ├── 6_phase_2_etl_warehouse_report.md
│   ├── 8_project_file_inventory.md
│   ├── 9_phase_2_verification.md
│   ├── 10_phase_2_1_correction_report.md
│   ├── 11_phase_2_1_final_audit.md              # 55/55 passed validation report
│   └── 12_project_current_state.md              # THIS REPORT
├── scripts/
│   ├── etl_pipeline.py                          # Atomic, staged ETL ingestion script with temp DB promotion
│   └── validate_warehouse.py                    # Standalone 55-check validation suite with exit code 0/1
└── warehouse/
    ├── cancer_dw.db                             # Active SQLite database (167,936 bytes)
    ├── cancer_dw_backup_phase2_pre_correction.db (110,592 bytes)
    ├── cancer_dw_backup_20261020_190913.db      (143,360 bytes)
    ├── cancer_dw_backup_20261020_194722.db      (143,360 bytes)
    ├── cancer_dw_backup_20261020_201843.db      (167,936 bytes - newly created snapshot)
    └── validation_results.json                  # Machine-readable validation test results
```

---

## 3. Verified Database State & Schema Audit

The active database [`warehouse/cancer_dw.db`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/cancer_dw.db) was queried and verified via [`scripts/validate_warehouse.py`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/scripts/validate_warehouse.py) (Exit Code: 0).

### Schema Objects & Row Counts

| Category | Object Name | Verified Records | Primary Dimensional Role / Grain |
| :--- | :--- | :---: | :--- |
| **Dimension** | `Dim_Geography` | 37 | State/UT level geography (37 States/UTs, State Code, Regional Zone) |
| **Dimension** | `Dim_Cancer_Site` | 76 | Standardized cancer sites, ICD-10 code, Tobacco association flag |
| **Sub-Dimension** | `Dim_Organ_System` | 11 | Snowflake sub-dimension normalizing cancer sites to anatomical systems |
| **Dimension** | `Dim_Time` | 11 | Temporal dimension (2015–2045) with corrected epoch categories |
| **Dimension** | `Dim_Measure_Type` | 5 | Conformed classification (Empirical, Extrapolated, Model Forecast, Benchmark) |
| **Dimension** | `Dim_Registry` | 32 | Population-based registries (PBCRs) with regional grouping |
| **Fact Table** | `Fact_State_Surveillance` | 259 | Grain: `(geo_id, time_id, measure_type_id)`. 37 states $\times$ 7 time periods |
| **Fact Table** | `Fact_Cancer_Incidence` | 190 | Grain: `(site_id, time_id, measure_type_id, gender)`. National site burden |
| **Fact Table** | `Fact_State_Mortality_Surveillance` | 185 | Grain: `(geo_id, time_id, measure_type_id)`. 37 states $\times$ 5 years (Dataset 5) |
| **Fact Table** | `Fact_PBCR_Surveillance` | 32 | Grain: `(registry_id, time_period, gender)`. 28 registries annual rates |
| **Fact Table** | `Fact_Clinical_Stage` | 14 | Grain: `(cancer_site, gender)`. 58 HBCRs clinical staging distribution |
| **Fact Table** | `Fact_Cancer_Trends_APC` | 152 | Grain: `(cancer_site, registry_name, gender)`. Longitudinal joinpoint trends |
| **Fact Table** | `Fact_Screening_Programs` | 3 | Grain: `(cancer_type)`. NP-NCD early detection screening indicators |
| **Fact Table** | `Fact_Healthcare_Infrastructure_National` | 7 | Grain: `(indicator_name)`. Parliamentary approved cancer centers/clinics |
| **Fact Table** | `Fact_Maharashtra_Infrastructure` | 15 | Grain: `(category, facility_name)`. State deep-dive infrastructure |
| **System Table** | `sqlite_sequence` | 14 | Internal SQLite autoincrement sequence tracker |
| **Analytical View** | `vw_star_state_incidence` | 259 | Star-schema state incidence linked to conformed dimensions |
| **Analytical View** | `vw_star_cancer_sites` | 76 | Cancer site hierarchy normalized with organ systems |
| **Analytical View** | `vw_state_mortality_ratios` | 185 | State mortality, incidence, and computed MIR with provenance |

**Total Live Records Across 15 Warehouse Tables:** **1,228 records**.

---

## 4. Key Provenance & Analytical Principles Established

1. **Model Extrapolation vs. Empirical Registry Observation:**
   - In `Fact_State_Surveillance`, 2019–2022 figures are model-based demographic extrapolations (`ICMR_NCRP_ESTIMATE`), not direct clinical censuses.
   - Direct empirical registrations are confined to `Fact_PBCR_Surveillance` (`PBCR_EMPIRICAL`, pooled 28 registries covering $\approx 10\%$ of India).
   - Future values (2026, 2030, 2045) are econometric moderated exponential model forecasts (`KUMAR_EXP_2026`).

2. **National Total Arithmetic Reconciliation:**
   - The sum of 2022 state incidence across all 37 state rows is exactly:
     $$\sum_{i=1}^{37} \text{cases}_{i, 2022} = 1,461,427.0$$
   - This reconciles to the reported 1,461,427 estimate with $0.0000\%$ error.
   - This check is strictly an **arithmetic sum verification** confirming proper state ingestion, not an independent validation of epidemiological methodology.

3. **Dataset 5 Specificity (Unspecified Cancer Type):**
   - The source table in `Dataset 5.docx` lists 37 States $\times$ 5 Years (2021–2025) of incidence and mortality without an anatomical site header.
   - The national sum (~77,426 cases in 2022) is $\approx 5.3\%$ of the all-cancer total (1.46M), strongly indicating a single organ site (consistent with ovarian cancer figures).
   - In accordance with research integrity rules, the cancer site is explicitly retained as **UNSPECIFIED** in `cancer_type_note`. Downstream analytics must never confuse this with all-site cancer mortality.

4. **Registry State Linkage:**
   - `Dim_Registry.state_id` is NULL for all 32 registries because registry jurisdictions are grouped by regional territory (`region` column) rather than state administrative codes.

---

## 5. Phase-by-Phase Implementation Roadmap

The remaining project work will proceed sequentially across 8 distinct phases:

```
[Phase A: Baseline Audit (Done)] ──► [Phase B: Data Profiling (Phase 3)] ──► [Phase C: OLAP Views (Phase 4)]
                                                                                       │
[Phase F: React Frontend (Phase 7)] ◄── [Phase E: FastAPI Backend (Phase 6)] ◄── [Phase D: Data Mining (Phase 5)]
                 │
                 ▼
[Phase G: Full Integration] ──► [Phase H: Complete Testing] ──► [Phase I: Final Report & Documentation]
```

### Phase Schedule & Deliverables

| Phase | Core Objective | Primary Deliverables / Files | Status |
| :---: | :--- | :--- | :---: |
| **Phase A** | Current State & Baseline Audit | `reports/12_project_current_state.md`, timestamped backup | **COMPLETE** |
| **Phase B (Phase 3)** | Statistical & Structural Data Profiling | `reports/13_phase_3_data_profiling.md`, profiling scripts | **READY TO START** |
| **Phase C (Phase 4)** | OLAP Query Design & Analytical Views | `reports/14_phase_4_olap_analytics.md`, SQL view definitions | Scheduled |
| **Phase D (Phase 5)** | Data Mining Implementation & Evaluation | `reports/15_phase_5_data_mining_results.md`, model scripts | Scheduled |
| **Phase E (Phase 6)** | FastAPI REST Backend Service | `backend/main.py`, routers, schemas, tests | Scheduled |
| **Phase F (Phase 7)** | React + Vite Analytical Dashboard | `frontend/`, interactive charts, dark/light theme | Scheduled |
| **Phase G** | System Integration & Export Services | API connection, CSV exports, dynamic filters | Scheduled |
| **Phase H** | Comprehensive Multi-Level Testing | Unit tests, API endpoint tests, frontend build tests | Scheduled |
| **Phase I** | Final Documentation & Completion Report | `README.md`, `reports/16_final_project_completion_report.md` | Scheduled |

---

## 6. Immediate Next Actions

1. Proceed to **Phase B (Phase 3: Data Profiling and Analytical Readiness)**.
2. Install required machine learning and statistical dependencies (`scikit-learn`, `scipy`).
3. Execute rigorous structural, statistical, and distributional profiling on all 15 warehouse tables.
4. Generate `reports/13_phase_3_data_profiling.md`.
