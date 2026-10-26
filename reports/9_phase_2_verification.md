# PHASE 2 DATABASE VERIFICATION REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Inspection Type:** Read-Only Database & Data Quality Verification (Phase 2 Post-ETL)  
**Target Database:** `warehouse/cancer_dw.db`  
**Inspection Date:** October 2026  
**Deliverable:** `reports/9_phase_2_verification.md`

---

## 1. Executive Summary & Verification Scorecard

A thorough, read-only audit of the SQLite data warehouse (`warehouse/cancer_dw.db`), its schema, data provenance, ETL script (`scripts/etl_pipeline.py`), and mathematical consistency was performed using Python's standard `sqlite3` and `openpyxl` modules.

### Overall Verification Scorecard

| Check # | Audit Dimension | Status | Key Finding |
| :---: | :--- | :---: | :--- |
| **Check 1** | Database File Existence & Connectivity | **PASS** | File exists (110,592 bytes), opens cleanly with standard Python `sqlite3`, zero corruption. |
| **Check 2** | Tables & Views Inventory | **PASS** | 12 tables and 1 analytical view verified via `sqlite_master`. Row counts verified. |
| **Check 3** | Schema, Primary & Foreign Keys | **PASS** | All tables have explicit primary keys. `PRAGMA foreign_key_check` returned 0 violations. |
| **Check 4** | Duplicate Logical Records | **WARNING** | `Fact_State_Surveillance` has 0 duplicates. `Fact_Cancer_Incidence` has 5 duplicate rows caused by fuzzy string matching on sub-sites (`Hypopharynx`, `Nasopharynx` mapping to `Pharynx`). |
| **Check 5** | Analytical View `vw_star_state_incidence` | **PASS** | View definition valid, joins 4 tables, returns 259 rows matching `Fact_State_Surveillance`. |
| **Check 6** | Provenance of 2022 Total (1,461,427) | **WARNING** | Mathematical sum passes (1,461,427), but the column header `'2022 Observed'` in the source is actually an **ICMR-NCDIR model-extrapolated estimate**, not raw empirical registry registrations. |
| **Check 7** | Coverage of Mortality & Health Infrastructure | **WARNING** | `Dataset 5.docx` (state annual mortality) and `Fact_Healthcare_Infrastructure` planned in Report 5 were **not ingested** in the Phase 2 ETL run. State-level mortality is currently absent. |
| **Check 8** | Measure Classification & Assumptions | **WARNING** | State surveillance 2019–2022 was tagged as `OBS_EMPIRICAL` (Observed Registry Cases), which obscures that NCRP state figures are demographic rate-model extrapolations. |
| **Check 9** | Algorithmic Feasibility (ML / DM) | **PASS** | Warehouse supports DWM algorithms with clear mathematical boundaries. Specific feature inputs and limitations are documented. |

---

## 2. Database Structure, Schema & Row Counts

The database contains **12 Relational Tables** and **1 Analytical View**.

### Detailed Table & View Inventory

| Object Type | Name | Row Count | Primary Key | Foreign Keys Defined | Nullable Columns with Nulls |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Table** | `Dim_Geography` | 37 | `geo_id` | None | None |
| **Table** | `Dim_Organ_System` | 11 | `organ_system_id`| None | None |
| **Table** | `Dim_Cancer_Site` | 55 | `site_id` | `organ_system_id` $\rightarrow$ `Dim_Organ_System` | `icd10_code` (13), `parent_group` (11) |
| **Table** | `Dim_Time` | 10 | `time_id` | None | None |
| **Table** | `Dim_Measure_Type` | 5 | `measure_type_id` | None | None |
| **Table** | `Dim_Registry` | 32 | `registry_id` | `state_id` $\rightarrow$ `Dim_Geography` | `state_id` (32), `urban_percent` (32), `rural_percent` (32) |
| **Table** | `Fact_State_Surveillance` | 259 | `fact_state_id` | `geo_id`, `time_id`, `measure_type_id` | `cagr_observed` (111), `cagr_projected` (148), `national_share_pct` (222) |
| **Table** | `Fact_Cancer_Incidence` | 181 | `fact_id` | `site_id`, `time_id`, `measure_type_id` | `crude_rate` (42), `age_adjusted_rate` (83), `deaths` (156) |
| **Table** | `Fact_PBCR_Surveillance` | 32 | `fact_pbcr_id` | `registry_id` $\rightarrow$ `Dim_Registry` | None |
| **Table** | `Fact_Clinical_Stage` | 14 | `fact_stage_id` | None | None |
| **Table** | `Fact_Cancer_Trends_APC` | 153 | `fact_trend_id` | None | `apc_percent` (1) |
| **Table** | `Fact_Screening_Programs`| 3 | `screening_id` | None | None |
| **View** | `vw_star_state_incidence`| 259 | — | Dynamic SQL join | `national_share_pct`, `cagr_observed`, `cagr_projected` |

---

## 3. Schema & Integrity Checks

### A. Foreign Key & Referential Integrity
- `PRAGMA foreign_key_check` executed cleanly with **0 violations**.
- All `geo_id` references in `Fact_State_Surveillance` map to valid records in `Dim_Geography`.
- All `site_id` references in `Fact_Cancer_Incidence` map to valid records in `Dim_Cancer_Site`.

### B. Duplicate Record Analysis
- `Fact_State_Surveillance`: Distinct composite tuples on `(geo_id, time_id, measure_type_id)` count = 259. **Zero duplicates.**
- `Fact_Cancer_Incidence`: Distinct composite tuples on `(site_id, time_id, measure_type_id, gender)` has **5 duplicate rows**:
  - `site_id = 5` (`Pharynx`, 2024, Both): 3 rows with cases 35,489, 22,174, and 11,013.
  - `site_id = 15` (`Gallbladder and other biliary`, 2024, Both): 2 rows with cases 30,542 and 25,980.
  - **Root Cause Evidence:** In `scripts/etl_pipeline.py`, line 427, when loading `GLOBOCAN 2024 by Site`, a fallback substring check (`k in c_name.lower() or c_name.lower() in k`) causes `Hypopharynx`, `Oropharynx`, and `Nasopharynx` to all resolve to `Pharynx`.
  - **Correction Directive:** In Phase 3 or ETL refinement, expand `Dim_Cancer_Site` to include distinct site entries for `Hypopharynx`, `Oropharynx`, and `Nasopharynx` with exact matching.

---

## 4. Analytical View Verification: `vw_star_state_incidence`

### Actual SQL Definition in Database:
```sql
CREATE VIEW vw_star_state_incidence AS
    SELECT 
        f.fact_state_id,
        g.state_name,
        g.state_code,
        g.region_zone,
        t.year,
        t.epoch_category,
        m.measure_code,
        m.measure_name,
        m.is_modeled,
        f.incident_cases,
        f.national_share_pct,
        f.cagr_observed,
        f.cagr_projected
    FROM Fact_State_Surveillance f
    JOIN Dim_Geography g ON f.geo_id = g.geo_id
    JOIN Dim_Time t ON f.time_id = t.time_id
    JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id;
```
- **Evaluation:** The view successfully implements the core **Star Schema** query pattern. It correctly brings together state attributes, temporal dimensions, and measure metadata without requiring application developers to write manual joins.
- **Sample Query Output Verified:**
  - `fact_state_id=1`: Jammu and Kashmir | Year: 2019 | Epoch: Observed | Measure: OBS_EMPIRICAL | Cases: 12,396
  - `fact_state_id=4`: Jammu and Kashmir | Year: 2022 | Epoch: Observed | Measure: OBS_EMPIRICAL | Cases: 13,395 | Share: 0.92%
  - `fact_state_id=5`: Jammu and Kashmir | Year: 2026 | Epoch: Projected | Measure: KUMAR_EXP_2026 | Cases: 14,857 | CAGR: 2.62%

---

## 5. Provenance Investigation: National 2022 Total (1,461,427)

### Verification Trace:
1. **Source File:** `Data/extracted_temp/Cancer Dataset/final_excel_updated.xlsx`
2. **Sheet:** `State-wise Incidence`
3. **Columns:** Row 1 Header has `2022 Observed` in Column E (index 4).
4. **Rows:** Rows 2 to 38 represent the 37 States and Union Territories.
5. **Row 39:** `All India (sum of 37 states/UTs)` = `1,461,427`.
6. **Row 42 (Critical Caveat in Source File):**
   > *"Important caveat: The all-India sums for '2020 Observed' (1,392,179) and '2022 Observed' (1,461,427) equal the NCRP national ESTIMATES published in the JCO 2020 and IJMR 2022 papers... These columns are therefore model-based NCRP estimates, not raw registry counts."*

### Definitional Finding:
- **Conclusion:** While the mathematical sum in our SQLite database is **100% exact** ($1,461,427.0 = 1,461,427$), labeling this column as `Observed Registry Cases` (`OBS_EMPIRICAL`) is an **epidemiological misnomer**.
- India does not have 100% population-based registry coverage (PBCRs cover $\approx 10\%$ of India's population). The 1,461,427 figure is an **extrapolated estimate** produced by applying age-specific rates from 28 PBCRs to Census population projections.
- **Recommended Correction:** Update `Dim_Measure_Type` linking in `Fact_State_Surveillance` so 2019–2022 state figures are labeled `ICMR_NCRP_ESTIMATE` rather than `OBS_EMPIRICAL`.

---

## 6. Audit of Missing Data (Mortality & Infrastructure)

Comparing `warehouse/cancer_dw.db` with the approved plan (`reports/5_refined_implementation_plan.md`):

1. **`Dataset 5.docx` (State-wise Incidence & Mortality):**
   - **Audit Finding:** Not ingested into `warehouse/cancer_dw.db`.
   - **Inspection of `scripts/etl_pipeline.py`:** The script extracts screening numbers from `Dataset 6.docx` (Table 2), but contains no ingestion handler for `Dataset 5.docx`.
   - **Impact:** State-level mortality counts (2021–2025) and state Mortality-to-Incidence Ratios (MIR) are currently missing from the database. (National mortality by cancer site for 2024 from GLOBOCAN is present in `Fact_Cancer_Incidence`, but state-level mortality is absent).
2. **`Fact_Healthcare_Infrastructure`:**
   - **Audit Finding:** Table was defined in Report 5, but was omitted in `etl_pipeline.py`'s database initialization script.
   - **Impact:** State-level counts of cancer hospitals, oncologists, and beds are not currently stored in relational tables, although they are present in raw text/tabular forms in the source workbooks (`Healthcare Moderators` sheet).

---

## 7. Feasibility Analysis for DWM Algorithms

Based on the verified relational records in `warehouse/cancer_dw.db`:

### 1. Simple & Multiple Linear Regression (Module 4)
- **Data Availability:** **SUFFICIENT.**
  - `Fact_State_Surveillance` provides a multi-year panel (2019, 2020, 2021, 2022, 2026, 2030, 2045) across 37 states (259 records).
- **Feasible Models:**
  - Simple Linear Regression: Time trend forecasting ($\text{Cases} = f(\text{Year})$) per state or national total.
  - Multiple Regression: Modeling incidence as a function of urbanization %, regional zone, and historical CAGR.
- **Limitation:** Small longitudinal observation span (4 annual points 2019–2022). Evaluation should use a hold-out test (Train: 2019–2021, Test: 2022) reporting $R^2$ and RMSE.

### 2. Decision Tree & Naïve Bayes Classification (Module 4)
- **Data Availability:** **SUFFICIENT.**
  - `vw_star_state_incidence` combined with `Dim_Geography` provides 37 distinct state records with features: $[ \text{Incident Cases}, \text{CAGR}, \text{Region Zone}, \text{National Share} ]$.
  - Target classes can be formulated as **Burden Tiers** (High Burden $> 50\text{k}$ cases, Moderate $10\text{k} - 50\text{k}$, Low $< 10\text{k}$) or **Growth Trajectory** (High Growth $> 2.6\%$ CAGR vs Stable $\le 2.6\%$).
- **Limitation:** Sample size is $N = 37$ states. Must use **Stratified 5-Fold Cross-Validation** or **Leave-One-Out Cross-Validation (LOOCV)** to avoid overfitting.

### 3. K-Means & Agglomerative Hierarchical Clustering (Module 5)
- **Data Availability:** **SUFFICIENT.**
  - `Fact_PBCR_Surveillance` (32 registries) provides continuous vectors: $[ \text{Crude Rate}, \text{Age-Adjusted Rate}, \text{Cumulative Risk}, \text{Tobacco Share \%} ]$.
  - `Fact_Clinical_Stage` (14 records) provides staging distributions: $[ \text{Localized \%}, \text{Locoregional \%}, \text{Distant Metastasis \%} ]$.
- **Feasible Outputs:**
  - K-Means on Registries: Elbow curve ($k=2$ to $k=6$) + Silhouette analysis.
  - Agglomerative Clustering on Cancer Sites: Hierarchical **Dendrogram** grouping anatomical sites by epidemiological similarity.

### 4. Association Rule Mining (Apriori Algorithm) (Module 6)
- **Data Availability:** **SUFFICIENT (When Discretized).**
  - Continuous attributes from `Fact_PBCR_Surveillance` and `Fact_Cancer_Trends_APC` (153 records) can be discretized into categorical itemsets:
    $$\text{Basket} = \{ \text{Region: North-East}, \text{Tobacco-Share: High}, \text{APC: Significant-Increase}, \text{Site: Oral/Lung} \}$$
- **Limitation:** Aggregate registry data, not patient-level transactions. Must be documented as population epidemiological pattern mining.

---

## 8. Summary of Check Results & Recommended Action Plan

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASE 2 AUDIT SUMMARY                           │
├────────────────────────────────┬─────────┬─────────────────────────────┤
│ Component                      │ Status  │ Primary Takeaway            │
├────────────────────────────────┼─────────┼─────────────────────────────┤
│ 1. SQLite Connectivity & File  │ PASS    │ Database clean, uncorrupted │
│ 2. Table & View Row Counts     │ PASS    │ All 12 tables + 1 view alive│
│ 3. Schema & Referential Keys   │ PASS    │ 0 orphan foreign keys       │
│ 4. Logical Duplicates Check    │ WARNING │ 5 sub-site overlaps in GLOB │
│ 5. Star View (vw_star_state)   │ PASS    │ Correct SQL join logic      │
│ 6. 2022 Total Source Trace     │ WARNING │ Extrapolated, not observed  │
│ 7. Mortality & Infra Tables    │ WARNING │ Dataset 5.docx omitted      │
│ 8. Measure Categorization      │ WARNING │ Needs ICMR_EST label        │
│ 9. DWM Algorithmic Fitness     │ PASS    │ Ready for Phase 3 models    │
└────────────────────────────────┴─────────┴─────────────────────────────┘
```

### Recommended Next Steps for Implementation
1. **Preserve Current DB:** Do not discard or corrupt the existing `cancer_dw.db`.
2. **Minor ETL Refinement (Before or During Phase 3):**
   - Add `Fact_State_Mortality` to ingest the 36-state mortality table from `Dataset 5.docx`.
   - Disambiguate `Hypopharynx`, `Oropharynx`, and `Nasopharynx` in `Dim_Cancer_Site` to remove the 5 duplicate rows in `Fact_Cancer_Incidence`.
   - Update `Dim_Measure_Type` description for state surveillance to clarify that figures are ICMR-NCDIR demographic model estimates.
3. **Execution Gate:** Phase 2 verification is complete. Stop and await user approval before proceeding to Phase 3.
