# PROJECT FILE INVENTORY REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Inspection Date:** October 2026  
**Scope:** Complete physical audit of all existing files and directories  
**Deliverable:** `reports/8_project_file_inventory.md`

---

## 1. Executive Summary & Inventory Overview

This report provides a complete, verified inventory of all existing directories, files, tables, scripts, logs, and artifacts in the workspace:
`c:\Users\ACER\OneDrive\Desktop\Cancer-Intelligence-Analytics`

### Audit Methodology
- Every file was verified via physical path and byte-size checks on disk.
- Contents and schemas were verified through Python file handlers and SQLite metadata inspectors.
- Zero files were created, modified, deleted, renamed, or executed during this inventory inspection.

---

## 2. Directory Structure & File Listing

The project contains **6 primary parent folders** (`Data/`, `logs/`, `Reference/`, `reports/`, `scripts/`, `warehouse/`) comprising a total of **24 individual files** (excluding root directory pointers).

```
Cancer-Intelligence-Analytics/
├── Data/
│   ├── Cancer Dataset.zip                         (1,440,524 bytes) [Original Archive]
│   ├── final_excel_updated_details.json           (55,008 bytes)    [Phase 1 Inspection]
│   ├── inspection_summary.json                    (10,114 bytes)    [Phase 1 Inspection]
│   └── extracted_temp/                            [Inspection Extract Folder]
│       └── Cancer Dataset/
│           ├── cancer dataset 4.pdf               (724,141 bytes)
│           ├── Cancer_Data_India_2019_2026_Concise.xlsx (9,990 bytes)
│           ├── dataset 3.pdf                      (616,397 bytes)
│           ├── Dataset 5.docx                     (21,246 bytes)
│           ├── Dataset 6.docx                     (19,097 bytes)
│           ├── Dataset 9.xlsx                     (94,882 bytes)
│           ├── final excel.xlsx                   (28,805 bytes)
│           ├── final_excel_updated.xlsx           (212,441 bytes)
│           └── final_excel_with_pdf_data (1).xlsx (73,268 bytes)
├── logs/
│   └── etl_pipeline.log                           (2,027 bytes)     [ETL Execution Log]
├── Reference/
│   ├── Latest_AAP-updated _Odd Sem2026-27_Final_DWM.docx (619,909 bytes) [Original Syllabus]
│   └── dwm_syllabus_extracted.txt                 (59,310 bytes)    [Parsed Syllabus Text]
├── reports/
│   ├── 1_dataset_inventory_report.md              (12,666 bytes)    [Phase 1]
│   ├── 2_data_quality_report.md                   (6,392 bytes)     [Phase 1]
│   ├── 3_recommended_dataset_selection_report.md  (5,756 bytes)     [Phase 1]
│   ├── 4_dwm_syllabus_mapping_report.md           (9,432 bytes)     [Phase 1]
│   ├── 5_refined_implementation_plan.md           (24,382 bytes)    [Approved Plan]
│   └── 6_phase_2_etl_warehouse_report.md          (8,820 bytes)     [Phase 2]
├── scripts/
│   └── etl_pipeline.py                            (31,501 bytes)    [Executed ETL Script]
└── warehouse/
    ├── cancer_dw.db                               (110,592 bytes)   [SQLite Database]
    └── validation_results.json                    (827 bytes)       [Validation Suite Output]
```

---

## 3. Granular File Details Grouped by Parent Folder

### Folder 1: `Data/`
| File / Subfolder | Type | Size | Verified Purpose & Contents |
| :--- | :---: | :---: | :--- |
| `Cancer Dataset.zip` | ZIP Archive | 1,440,524 bytes | **Original input dataset archive** provided by user. Contains 9 raw cancer surveillance documents (Excel, Word, PDF). Untouched. |
| `final_excel_updated_details.json` | JSON | 55,008 bytes | Technical schema audit of `final_excel_updated.xlsx` created during Phase 1 inspection (column names, types, null counts per sheet). |
| `inspection_summary.json` | JSON | 10,114 bytes | Structural metadata summary created during Phase 1 (sheet counts, dimensions, page numbers across all files in ZIP). |
| `extracted_temp/Cancer Dataset/` | Directory | — | Read-only working folder created during Phase 1 to inspect the contents of `Cancer Dataset.zip` without altering the archive. |
| `.../cancer dataset 4.pdf` | PDF | 724,141 bytes | WHO GLOBOCAN 2024 India Factsheet (2 pages). Digitized in `Dataset 9.xlsx`. |
| `.../Cancer_Data_India_2019_2026_Concise.xlsx` | Excel | 9,990 bytes | Preliminary 18-state summary workbook. (Redundant draft). |
| `.../dataset 3.pdf` | PDF | 616,397 bytes | Research paper by Kumar et al. (2026) on moderated exponential forecasting in India. Digitized in `final_excel_updated.xlsx`. |
| `.../Dataset 5.docx` | Word | 21,246 bytes | Official state-wise annual cancer incidence & mortality (2021–2025). |
| `.../Dataset 6.docx` | Word | 19,097 bytes | Official health infrastructure, SCI/TCCC approvals, and NP-NCD screening tables. |
| `.../Dataset 9.xlsx` | Excel | 94,882 bytes | Multi-sheet workbook containing WHO GLOBOCAN 2024 by site, JAMA 2025 PBCRs, and Key Indicators. |
| `.../final excel.xlsx` | Excel | 28,805 bytes | Baseline 37-state forecasting workbook (Kumar et al.). Superseded. |
| `.../final_excel_updated.xlsx` | Excel | 212,441 bytes | **Master primary dataset** (30 structured sheets: NCRP national estimates, Maharashtra factsheet, JCO trends, Kumar forecasts). |
| `.../final_excel_with_pdf_data (1).xlsx` | Excel | 73,268 bytes | Intermediate working draft. Superseded. |

---

### Folder 2: `logs/`
| File | Type | Size | Verified Purpose & Execution Status |
| :--- | :---: | :---: | :--- |
| `etl_pipeline.log` | Log File | 2,027 bytes | Execution log generated by `scripts/etl_pipeline.py` on 2026-10-20 at 12:35:28. Confirms successful database creation, record counts, and integrity validation passing with 100% success. |

---

### Folder 3: `Reference/`
| File | Type | Size | Verified Purpose & Contents |
| :--- | :---: | :---: | :--- |
| `Latest_AAP-updated _Odd Sem2026-27_Final_DWM.docx` | Word Document | 619,909 bytes | **Original course syllabus and Academic Administration Plan** for Data Warehousing and Mining (PECE02T / PECE02P), Sem V CMPN (2026–2027). |
| `dwm_syllabus_extracted.txt` | UTF-8 Text | 59,310 bytes | Extracted text and tables (397 lines) from the syllabus document, used to map course outcomes (CO1–CO5) and laboratory experiments. |

---

### Folder 4: `reports/`
| Report File | Size | Phase | Current Status | Summary of Contents |
| :--- | :---: | :---: | :---: | :--- |
| `1_dataset_inventory_report.md` | 12,666 bytes | Phase 1 | **Completed** | Deep granular inventory of all 9 files in the archive (dimensions, types, sheets). |
| `2_data_quality_report.md` | 6,392 bytes | Phase 1 | **Completed** | Assessment of missing values, comma text formatting, naming variations, duplicates. |
| `3_recommended_dataset_selection_report.md` | 5,756 bytes | Phase 1 | **Completed** | Recommendation of `final_excel_updated.xlsx` as primary, auxiliary sheets to merge, files to drop. |
| `4_dwm_syllabus_mapping_report.md` | 9,432 bytes | Phase 1 | **Completed** | Mapping of all 17 DWM topics (Star/Snowflake, OLAP, Regression, Trees, K-Means, Apriori). |
| `5_refined_implementation_plan.md` | 24,382 bytes | Planning Gate | **Approved** | Comprehensive architecture plan covering ETL rules, validation checks, algorithm limits, and phases. |
| `6_phase_2_etl_warehouse_report.md` | 8,820 bytes | Phase 2 | **Completed** | Technical execution report detailing SQLite schema creation, records loaded, and validation pass. |
| `8_project_file_inventory.md` | *(This file)* | Audit | **In Progress** | Physical inventory of all project folders, files, sizes, statuses, and gaps. |

*(Note on numbering: Report 7 was skipped in sequence when generating the Phase 2 report as `6_phase_2_etl_warehouse_report.md`, and this inventory report is designated Report 8 as requested).*

---

### Folder 5: `scripts/`
| Script File | Type | Size | Execution Status & Functionality |
| :--- | :---: | :---: | :--- |
| `etl_pipeline.py` | Python Script | 31,501 bytes | **Executed Successfully (Exit Code 0).** <br>• Ingests data from `final_excel_updated.xlsx`, `Dataset 9.xlsx`, and `Dataset 6.docx`.<br>• Performs type casting, regex comma stripping, and geographic name harmonization.<br>• Initializes and populates 6 dimension tables, 6 fact tables, and 1 star schema view in `warehouse/cancer_dw.db`.<br>• Runs automated integrity tests and exports validation metrics. |

---

### Folder 6: `warehouse/`
| File | Type | Size | Verified Purpose & Verification Status |
| :--- | :---: | :---: | :--- |
| `cancer_dw.db` | SQLite Database | 110,592 bytes | **Active Production Relational Warehouse**. Contains 12 relational tables and 1 analytical view. Passed all integrity constraints. |
| `validation_results.json` | JSON | 827 bytes | Machine-readable validation output generated by `etl_pipeline.py`. Contains table row counts, national 2022 sum check (`PASS`), referential integrity (`PASS`), and domain checks (`PASS`). |

---

## 4. Database Schema, Tables, Views & Integrity Audit

Verified database file: [`warehouse/cancer_dw.db`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/cancer_dw.db)

### A. Populated Tables & Record Counts
1. **Dimension Tables (6 Tables):**
   - `Dim_Geography`: **37 records** (All 37 Indian States and Union Territories with ISO code and region zone).
   - `Dim_Cancer_Site`: **55 records** (Anatomical cancer sites, ICD-10 codes, level type, tobacco attribution).
   - `Dim_Organ_System`: **11 records** (Snowflake normalization dimension grouping organ sites).
   - `Dim_Time`: **10 records** (Surveillance epochs: 2015, 2019–2022, 2024, 2025, 2026, 2030, 2045).
   - `Dim_Measure_Type`: **5 records** (Distinguishes empirical observed, national estimated, model forecasts).
   - `Dim_Registry`: **32 records** (Population-Based Cancer Registries with geographic zone).
2. **Fact Tables (6 Tables):**
   - `Fact_State_Surveillance`: **259 records** (37 States x 7 Epochs with incident cases, shares, CAGR).
   - `Fact_Cancer_Incidence`: **181 records** (National site-level incidence by sex, crude rates, AAR, deaths).
   - `Fact_PBCR_Surveillance`: **32 records** (Registry-level empirical surveillance & tobacco shares).
   - `Fact_Clinical_Stage`: **14 records** (Pre-treatment clinical extent: localized, loco-regional, distant).
   - `Fact_Cancer_Trends_APC`: **153 records** (Annual Percentage Change longitudinal trends across sites/registries).
   - `Fact_Screening_Programs`: **3 records** (National NP-NCD screening: oral, breast, cervical cancer).

### B. Analytical Views
- `vw_star_state_incidence`: **259 pre-joined records**. Joins `Fact_State_Surveillance` with `Dim_Geography`, `Dim_Time`, and `Dim_Measure_Type` for direct OLAP querying and API consumption.

### C. Validation Check Status
- **2022 National Additivity Check:** Sum of 37 state records = **1,461,427** vs. expected **1,461,427** (0.00% error $\rightarrow$ `PASS`).
- **Referential Integrity:** 0 orphan foreign keys (`PASS`).
- **Domain Range Constraints:** 0 invalid staging percentages outside $[0, 100]$ (`PASS`).

---

## 5. Identification of Missing Deliverables & Remaining Roadmap

Based on the approved implementation plan (`reports/5_refined_implementation_plan.md`), the project status against scheduled phases is:

| Implementation Phase | Planned Deliverables | Current Status | Notes / Blockers |
| :--- | :--- | :---: | :--- |
| **Phase 1: Inspection** | Reports 1, 2, 3, 4 | **Completed** | Full archive and syllabus audited. |
| **Phase 2: ETL & Schema**| `etl_pipeline.py`, `cancer_dw.db`, Report 6 | **Completed** | Fully verified, 0 errors. |
| **Phase 3: Machine Learning**| `train_models.py`, `models/`, Evaluation Report | **Pending Approval** | Awaiting user instruction to begin Phase 3. |
| **Phase 4: Backend API** | FastAPI application (`app/main.py`), Endpoints | **Pending Phase 3** | Dependent on ML and schema. |
| **Phase 5: Frontend UI** | React + Vite Dashboard, Dark/Light Mode | **Pending Backend** | Dependent on API endpoints. |

### Missing Files Identified
- No files are missing from Phase 1 or Phase 2. All planned deliverables for completed phases exist on disk and have been verified.
- The machine learning scripts and model serialization files (`.joblib` / `.pkl`) are intentionally absent because Phase 3 has not been initiated.

---

## 6. Duplicate, Temporary, or Review-Worthy Files

The physical audit identified the following files that warrant explicit notation:

1. **Temporary Extraction Folder (`Data/extracted_temp/`):**
   - **Nature:** Uncompressed working directory created in Phase 1 to inspect the ZIP archive.
   - **Status:** Contains the working copies of `final_excel_updated.xlsx`, `Dataset 9.xlsx`, etc., which are read by `etl_pipeline.py`.
   - **Action:** Retain for development; can be packaged into a clean build asset later.
2. **Intermediate Drafts inside the Archive:**
   - `Cancer_Data_India_2019_2026_Concise.xlsx` (18-state partial preview)
   - `final excel.xlsx` (superseded 7-sheet baseline)
   - `final_excel_with_pdf_data (1).xlsx` (superseded working draft)
   - **Status:** Kept inside `Data/extracted_temp/Cancer Dataset/` to preserve archive parity, but **correctly ignored** by the ETL pipeline.
3. **Inspection JSON Cache Files in `Data/`:**
   - `Data/final_excel_updated_details.json` (55 KB)
   - `Data/inspection_summary.json` (10 KB)
   - **Status:** Informational inspection cache files generated during Phase 1. They are harmless and provide detailed audit logs.
4. **Extracted Syllabus Text (`Reference/dwm_syllabus_extracted.txt`):**
   - **Status:** Plain-text transcription of the 620 KB docx syllabus used for mapping. Retain for documentation traceability.

---

## 7. Conclusion & Next Steps

All existing project files have been audited. The repository is in an orderly state with complete Phase 1 and Phase 2 assets verified.

**Phase 3 (Machine Learning & Modeling) and frontend development remain paused, awaiting your review and approval.**
