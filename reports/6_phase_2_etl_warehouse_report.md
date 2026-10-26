# PHASE 2 REPORT: ETL PIPELINE & WAREHOUSE SCHEMA IMPLEMENTATION
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Database:** SQLite at `warehouse/cancer_dw.db`  
**Execution Date:** October 2026  
**Status:** Phase 2 Complete (Verified & Audited)

---

## 1. Executive Summary & Verification

In accordance with the approved **Refined Implementation Plan** (`reports/5_refined_implementation_plan.md`), the end-to-end Extract, Transform, and Load (ETL) pipeline has been implemented, executed, and validated.

### Key Achievements
1. **Raw File Immutability:** All raw data files in `Data/Cancer Dataset.zip` and `Reference/` remain 100% pristine and untouched.
2. **Dedicated Relational Warehouse:** A production SQLite database was constructed at [`warehouse/cancer_dw.db`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/cancer_dw.db).
3. **Multi-Dimensional Star & Snowflake Schema:**
   - 6 Conformed/Normalized Dimension Tables (`Dim_Geography`, `Dim_Cancer_Site`, `Dim_Organ_System`, `Dim_Time`, `Dim_Measure_Type`, `Dim_Registry`).
   - 6 Specialized Fact Tables (`Fact_State_Surveillance`, `Fact_Cancer_Incidence`, `Fact_PBCR_Surveillance`, `Fact_Clinical_Stage`, `Fact_Cancer_Trends_APC`, `Fact_Screening_Programs`).
   - Pre-joined High-Performance Analytical View (`vw_star_state_incidence`).
4. **Definitional Separation Enforced:** Every fact row links to `Dim_Measure_Type` to prevent mixing empirical observed counts with model-projected forecasts (`is_modeled = 0` vs `is_modeled = 1`).
5. **Zero Data Fabrication:** No synthetic records or imputed values were introduced; missing cells are preserved as explicit SQL `NULL`s.
6. **Automated Validation:** The pipeline passed all referential integrity, domain boundary, and national sum cross-checks with **zero errors**.

---

## 2. Warehouse Schema Architecture & Dimensions

```
                           ┌────────────────────────────┐
                           │       Dim_Geography        │
                           │  (state_name, code, zone)  │
                           └─────────────┬──────────────┘
                                         │
                                         ▼
┌──────────────────┐           ┌────────────────────────────┐           ┌──────────────────┐
│     Dim_Time     │──────────▶│  Fact_State_Surveillance   │◀──────────│ Dim_Measure_Type │
│ (year, epoch)    │           │ (cases, share, cagr, etc.) │           │(Obs/Est/Forecast)│
└──────────────────┘           └────────────────────────────┘           └──────────────────┘

                           ┌────────────────────────────┐
                           │      Dim_Cancer_Site       │
                           │ (site_name, icd10, tobacco)│
                           └─────────────┬──────────────┘
                                         │ (Snowflake Normalization)
                                         ▼
                           ┌────────────────────────────┐
                           │      Dim_Organ_System      │
                           │(Digestive, Respiratory...) │
                           └────────────────────────────┘
```

### Table Inventory & Record Counts

| Table Type | Table Name | Key Primary / Foreign Attributes | Loaded Rows | Source Provenance |
| :--- | :--- | :--- | :---: | :--- |
| **Dimension** | `Dim_Geography` | `geo_id` (PK), `state_name`, `state_code`, `region_zone` | 37 | `final_excel_updated.xlsx` (State-wise) |
| **Dimension** | `Dim_Organ_System` | `organ_system_id` (PK), `system_name` | 11 | Snowflake classification standard |
| **Dimension** | `Dim_Cancer_Site` | `site_id` (PK), `site_name`, `icd10_code`, `organ_system_id` (FK) | 55 | `India Sites 2022` (IJMR Table I) |
| **Dimension** | `Dim_Time` | `time_id` (PK), `year`, `epoch_category` | 10 | 2015 to 2045 surveillance epochs |
| **Dimension** | `Dim_Measure_Type` | `measure_type_id` (PK), `measure_code`, `is_modeled` | 5 | Methodological source tags |
| **Dimension** | `Dim_Registry` | `registry_id` (PK), `registry_name`, `region` | 32 | `PBCR Incidence Table` (JCO 2020) |
| **Fact** | `Fact_State_Surveillance` | `fact_state_id` (PK), `geo_id`, `time_id`, `incident_cases` | 259 | 37 States x 7 Epochs (2019-2045) |
| **Fact** | `Fact_Cancer_Incidence` | `fact_id` (PK), `site_id`, `time_id`, `gender`, rates | 181 | National site-level incidence (IJMR & GLOBOCAN) |
| **Fact** | `Fact_PBCR_Surveillance` | `fact_pbcr_id` (PK), `registry_id`, `tobacco_share_pct` | 32 | Registry empirical rates & tobacco fraction |
| **Fact** | `Fact_Clinical_Stage` | `fact_stage_id` (PK), `cancer_site`, staging % (Loc/Adv) | 14 | 58 HBCRs National & Maharashtra Staging |
| **Fact** | `Fact_Cancer_Trends_APC`| `fact_trend_id` (PK), `registry_name`, `apc_percent` | 153 | JCO Fig 4 Longitudinal Trends |
| **Fact** | `Fact_Screening_Programs`| `screening_id` (PK), `cancer_type`, screened, diagnosed | 3 | `Dataset 6.docx` NP-NCD Screening |
| **View** | `vw_star_state_incidence`| Pre-joined dimensional star query view | 259 | Dynamic query accelerator |

---

## 3. Data Cleaning & Transformation Audit

1. **Numeric Sanitation:** Stripped thousand-separator commas, whitespace, and non-breaking spaces (`\xa0`) from extracted text strings (e.g. `'347,130,399'` $\rightarrow$ `347130399`).
2. **Harmonized Naming:** Normalized state naming variations (`'Jammu & Kashmir'` vs `'Jammu and Kashmir'`, `'Uttaranchal'` vs `'Uttarakhand'`) across all dimensional joins.
3. **Mathematical Validation of Formula Cells:** Recomputed rates and growth calculations to ensure formulas from `final_excel_updated.xlsx` matched stored data values.
4. **Tobacco Attribution Mapping:** Classified high-risk sites (`Mouth`, `Tongue`, `Lung`, `Oesophagus`, `Larynx`) with `is_tobacco_associated = 1` for Association Rule Mining in Module 6.

---

## 4. Automated Integrity Test Results

The validation suite executed immediately post-ETL yielded the following verified outcomes:

```json
{
  "national_sum_check_2022": {
    "calculated_sum": 1461427.0,
    "expected_sum": 1461427,
    "absolute_difference": 0.0,
    "percentage_error": 0.0,
    "status": "PASS"
  },
  "referential_integrity": {
    "orphan_state_surveillance_geos": 0,
    "orphan_cancer_incidence_sites": 0,
    "status": "PASS"
  },
  "domain_boundary_checks": {
    "invalid_clinical_stage_percentages": 0,
    "status": "PASS"
  }
}
```

- **All-India Total Additivity:** The sum of all 37 individual state/UT incident cases for 2022 equaled exactly **1,461,427** (0.00% error), perfectly matching the official ICMR-NCDIR national figure.
- **Referential Integrity:** Zero orphan foreign keys. Every state and organ site in fact tables successfully resolves to its parent dimension table.
- **Domain Sanity:** All clinical percentages satisfy $0 \le P \le 100$.

---

## 5. Artifacts and Code Deliverables

1. **ETL Pipeline Script:** [`scripts/etl_pipeline.py`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/scripts/etl_pipeline.py)
2. **SQLite Database:** [`warehouse/cancer_dw.db`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/cancer_dw.db)
3. **Execution Log:** [`logs/etl_pipeline.log`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/logs/etl_pipeline.log)
4. **Validation Test Suite Output:** [`warehouse/validation_results.json`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/validation_results.json)
5. **Phase 2 Report:** [`reports/6_phase_2_etl_warehouse_report.md`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/reports/6_phase_2_etl_warehouse_report.md)

---

## 6. Phase 2 Conclusion & Hold Directive

Phase 2 is now **100% complete**. 
- The warehouse schema is populated and verified.
- No machine learning modeling has been executed yet.
- No dashboard development has begun.

**Awaiting your approval to proceed to Phase 3 (Machine Learning, Statistical Modeling & Model Evaluation).**
