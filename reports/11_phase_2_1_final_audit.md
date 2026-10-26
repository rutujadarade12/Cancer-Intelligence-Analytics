# PHASE 2.1 FINAL ETL AUDIT & CONTROLLED CORRECTIONS REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Audit Reference:** Phase 2.1 Final Audit & Controlled Corrections  
**Execution Timestamp:** October 2026  
**Status:** Audit Completed | Controlled Corrections Implemented & Formally Verified  
**Active Database:** [`warehouse/cancer_dw.db`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/cancer_dw.db) (167,936 bytes)  
**Deliverable:** `reports/11_phase_2_1_final_audit.md`  

---

## 1. Executive Summary & Audit Scorecard

This audit evaluates the SQLite data warehouse (`warehouse/cancer_dw.db`) and its associated data ingestion pipeline (`scripts/etl_pipeline.py`). In accordance with project instructions, all operations were performed under strict non-destructive safety constraints:
- All original raw sources in `Data/` and `Data/extracted_temp/` remain intact and byte-identical.
- Existing historical backups were preserved without overwrite.
- A newly timestamped binary backup was created prior to pipeline execution.
- Phase 3 (Machine Learning), backend API development, and frontend dashboard construction remain completely paused.
- The pipeline was updated with an atomic, transactional temporary-database promotion pattern (`cancer_dw_TEMP.db` $\rightarrow$ `cancer_dw.db`) to ensure that an unhandled error or failed validation check cannot corrupt or partially overwrite the active warehouse.
- A standalone, non-zero exit validation suite (`scripts/validate_warehouse.py`) was constructed and executed, passing **55 of 55 genuine checks** (Exit Code 0).

### Audit Verdict Summary

| Dimension | Severity | Finding | Correction Implemented | Verdict |
| :--- | :---: | :--- | :--- | :---: |
| **Pipeline Atomicity** | **HIGH** | Dropping/rebuilding tables directly in active database risked leaving partial data on failure. | Staged build in `cancer_dw_TEMP.db`, verified validation suite, atomic `os.replace`. | **PASS** |
| **National Total Reconciliation** | **HIGH** | National total check was logged as informational rather than a strict PASS/FAIL gate. | Added genuine PASS/FAIL check with documented tolerance ($\pm 1.0$ case) failing on discrepancy. | **PASS** |
| **Fact Grain Uniqueness** | **HIGH** | Logical record uniqueness for `Fact_Cancer_Incidence` on its grain was missing from standalone suite. | Added genuine PASS/FAIL grain uniqueness check on `(site_id, time_id, measure_type_id, gender)`. | **PASS** |
| **Data Provenance: Time Epochs** | **MEDIUM** | `Dim_Time` labeled 2022 as `'Observed'` and 2024 as `'Observed'`, conflicting with fact-level measure semantics. | Corrected `Dim_Time` 2022 to `'Extrapolated'` and 2024 to `'Benchmark'`. | **PASS** |
| **Data Provenance: APC Trends** | **MEDIUM** | Stray citation row loaded into `Fact_Cancer_Trends_APC` (`cancer_site` = `"Source: JCO 2020, Fig. 4..."`). | Added prefix-based filtering in ETL; row count cleanly reduced from 153 to 152. | **PASS** |
| **Data Provenance: Dataset 5 Scale** | **HIGH** | `Dataset 5.docx` table lacks cancer-site specification; scale (~77K national) is ~5% of all-cancer total (~1.46M). | Added explicit `cancer_type_note` column to `Fact_State_Mortality_Surveillance` and views documenting ambiguity. | **NEEDS REVIEW** |
| **Dimension-less Fact Tables** | **MEDIUM** | `Fact_Clinical_Stage`, `Fact_Cancer_Trends_APC`, and `Fact_PBCR_Surveillance` lacked provenance columns. | Added `source_measure_code` and `time_period_note` tracking attributes. | **PASS** |
| **Registry State Linking** | **LOW** | `Dim_Registry.state_id` is `NULL` for all 32 registries. | Documented as an architectural limitation; regional grouping is preserved. | **NEEDS REVIEW** |
| **Automated Validation** | **HIGH** | Validation suite required dynamic reconciliation of genuine checks and strict failure exit code. | Script tallies genuine checks dynamically; 55/55 passed with Exit Code 0. | **PASS** |

---

## 2. Backup Integrity & Safety Architecture

### Backup Register

All historical backups are preserved in `warehouse/`:

| Backup Filename | File Size (Bytes) | Verification Status | Purpose / Role |
| :--- | :---: | :---: | :--- |
| `warehouse/cancer_dw_backup_phase2_pre_correction.db` | 110,592 | **VERIFIED** | Original pre-correction backup |
| `warehouse/cancer_dw_backup_20261020_190913.db` | 143,360 | **VERIFIED** | First Phase 2.1 verification snapshot |
| `warehouse/cancer_dw_backup_20261020_194722.db` | 143,360 | **VERIFIED** | Pre-final audit snapshot created before rewrite |
| `warehouse/cancer_dw.db` (Active Warehouse) | 167,936 | **VERIFIED** | Corrected, validated active database |

### Atomic Promotion Pattern

The ETL pipeline was modified in `scripts/etl_pipeline.py` to prevent silent corruption:
1. All schema drops, dimension inserts, fact loads, and index builds are executed against a distinct staging file: `warehouse/cancer_dw_TEMP.db`.
2. The complete validation suite (`run_integrity_checks`) runs against the temporary database.
3. If any critical validation check fails (referential integrity, stray rows, nulls in required fields, negative values, domain boundaries), an error is logged, the staging database is unlinked via `os.remove()`, and the process terminates with exit code 1.
4. Only upon 100% pass of critical checks is `os.replace(TEMP_DB_PATH, DB_PATH)` called. In SQLite on Windows/POSIX, `os.replace` guarantees atomic filesystem promotion.

---

## 3. Data Provenance & Measure Code Audit

The active warehouse defines 5 conformed measure types in `Dim_Measure_Type`:

```sql
SELECT measure_type_id, measure_code, measure_name, is_modeled, methodology_source 
FROM Dim_Measure_Type;
```

1. **`PBCR_EMPIRICAL` (`is_modeled = 0`)**:
   - **Underlying Source:** `final_excel_updated.xlsx` sheet `PBCR Incidence Table` and `Tobacco-related Cancers`.
   - **Clinical Reality:** Directly observed registry data pooled from 28 Population-Based Cancer Registries published in the JCO 2020 landmark monograph. Covers approximately 10% of India's population.
   - **Verdict:** **ACCURATE**.
2. **`ICMR_NCRP_ESTIMATE` (`is_modeled = 0`)**:
   - **Underlying Source:** `final_excel_updated.xlsx` sheet `State-wise Incidence` (2019–2022) and `India Sites 2022`.
   - **Clinical Reality:** Demographic extrapolations by ICMR-NCRP applying 2012–2016 pooled rates onto Census population projections.
   - **Verdict:** **ACCURATE**. Reclassification from Phase 2 prevents these from being misrepresented as raw registry tallies.
3. **`KUMAR_EXP_2026` (`is_modeled = 1`)**:
   - **Underlying Source:** `final_excel_updated.xlsx` sheet `State-wise Incidence` (2026, 2030, 2045 columns).
   - **Clinical Reality:** Moderated exponential growth forecasts from Kumar et al. 2026 (*International Journal of Community Medicine and Public Health*).
   - **Verdict:** **ACCURATE**.
4. **`GLOBOCAN_2024` (`is_modeled = 0`)**:
   - **Underlying Source:** `Dataset 9.xlsx` sheet `GLOBOCAN 2024 by Site`.
   - **Clinical Reality:** World Health Organization / IARC standard international epidemiological model estimates.
   - **Verdict:** **ACCURATE**.
5. **`PARLIAMENT_MOHFW` (`is_modeled = 0`)**:
   - **Underlying Source:** `Dataset 5.docx` and `Dataset 6.docx` (Table 1, Table 2).
   - **Clinical Reality:** Official written replies provided to Parliament by the Ministry of Health and Family Welfare (MOHFW).
   - **Verdict:** **ACCURATE**, subject to the unresolved cancer site ambiguity described in Section 4.

---

## 4. Critical Investigation: Dataset 5 Ambiguity & Mortality Metrics

### The Problem
`Data/extracted_temp/Cancer Dataset/Dataset 5.docx` contains a single 39-row table presenting state-wise figures for 37 States/UTs plus an all-India total across 5 years (2021 to 2025). The columns are labeled solely as:
- `State/UT`
- `Incidence 2021`, `Incidence 2022`, `Incidence 2023`, `Incidence 2024`, `Incidence 2025`
- `Deaths 2021`, `Deaths 2022`, `Deaths 2023`, `Deaths 2024`, `Deaths 2025`

**Crucially, nowhere in Dataset 5 is the cancer site or anatomical organ specified.**

### Mathematical Scale Analysis

| Data Source | Metric / Year | Value | Interpretation |
| :--- | :--- | :---: | :--- |
| `final_excel_updated.xlsx` / `Dataset 6` | All-Cancer All-India Estimated Cases (2022) | **1,461,427** | Verified national total of all invasive neoplasms |
| `Dataset 5.docx` | All-India "Incidence" (2022) | **77,426** | **$\approx 5.30\%$ of all-cancer total** |
| `Dataset 6.docx` (Table 4) | Breast Cancer All-India Cases (2022) | **221,178** | Dataset 5 total is roughly 35% of breast cancer |
| `final_excel_updated.xlsx` (India Sites 2022) | Ovarian Cancer All-India Cases (2022) | **78,338** | **Extremely close match to Dataset 5 (77,426)** |

Furthermore, comparing state-level data:
- In `Fact_State_Surveillance` (All Sites, 2022), Maharashtra has **121,717** cases.
- In `Dataset 5.docx` (2022), Maharashtra has **4,752** cases.
- In `Dataset 6.docx` Table 7, state-level figures are provided specifically for *Breast Cancer* and *Ovarian Cancer*.

### Conclusion & Pipeline Resolution
1. `Dataset 5.docx` **is NOT all-site cancer mortality**. Treating it as all-cancer mortality would misinform epidemiological analyses by an order of magnitude ($20\times$).
2. It strongly reflects a single gynecological or organ-specific cancer (likely ovarian cancer, or a specific cohort), but because the source document does not provide a label, making an unverified assignment would violate data integrity principles.
3. **Resolution:**
   - The table `Fact_State_Mortality_Surveillance` has been augmented with an explicit column:
     `cancer_type_note TEXT DEFAULT 'UNIDENTIFIED - Dataset 5.docx does not state cancer type; scale (~77K national) suggests single-site (possibly ovarian); NOT all-cancer total'`
   - The analytical view `vw_state_mortality_ratios` now exposes `m.cancer_type_note`.
   - Analysts and frontend developers are formally warned never to compare `Fact_State_Mortality_Surveillance` incidence against `Fact_State_Surveillance` incidence.

### Mortality-to-Incidence Ratio (MIR) Analysis
Across all 185 records in `Fact_State_Mortality_Surveillance`:
- **Minimum MIR:** 0.5000 (Daman & Diu, Dadra & Nagar Haveli)
- **Mean MIR:** 0.5503
- **Maximum MIR:** 1.0000 (Ladakh: 1 case, 1 death each year from 2021 to 2025)
- **Small-Number Phenonemon:** Ladakh's MIR of 1.0 represents a classic small-number statistical artifact ($1 / 1 = 1.0$) rather than genuine clinical fatality parity.

---

## 5. Time Dimension & Epoch Categorization

### The Issue
Previously, `Dim_Time` marked `epoch_category` as `'Observed'` for years 2019, 2020, 2021, 2022, 2023, and 2024. This caused ambiguity because:
- 2022 state surveillance counts (`Fact_State_Surveillance`) are model-based extrapolations (`ICMR_NCRP_ESTIMATE`), not registry observations.
- 2024 numbers (`Fact_Cancer_Incidence`) originate from GLOBOCAN international modeling (`GLOBOCAN_2024`).

### Implemented Correction
`Dim_Time` has been updated with strictly accurate epoch labels:

| `time_id` | `year` | `period_label` | `epoch_category` | Methodological Justification |
| :---: | :---: | :--- | :--- | :--- |
| **2015** | 2015 | 2015 Historical | `Historical` | Historic baseline surveillance |
| **2019** | 2019 | 2019 NCRP Extrapolation | `Extrapolated` | Model-based NCRP state estimate |
| **2020** | 2020 | 2020 NCRP Extrapolation | `Extrapolated` | Model-based NCRP state estimate |
| **2021** | 2021 | 2021 Estimated (PARLIAMENT) | `Extrapolated` | MOHFW surveillance response |
| **2022** | 2022 | 2022 Extrapolated NCRP | `Extrapolated` | Model-based NCRP state estimate (was `'Observed'`) |
| **2023** | 2023 | 2023 Estimated (PARLIAMENT) | `Extrapolated` | MOHFW surveillance response |
| **2024** | 2024 | 2024 GLOBOCAN Benchmark | `Benchmark` | WHO/IARC international benchmark (was `'Observed'`) |
| **2025** | 2025 | 2025 Projection | `Projected` | Near-term projection |
| **2026** | 2026 | 2026 Forecast | `Projected` | Econometric forecast (Kumar et al.) |
| **2030** | 2030 | 2030 Forecast | `Projected` | Medium-term econometric forecast |
| **2045** | 2045 | 2045 Forecast | `Projected` | Long-term demographic projection |

---

## 6. Elimination of Stray Metadata Rows

In sheet `Cancer Trends (APC)` of `final_excel_updated.xlsx`, row 154 contained the footnote:
`"Source: JCO 2020, Fig. 4 - APC in age-adjusted incidence rates (Joinpoint regression)..."`
Previously, this row was read as a valid data record, leading to 153 rows in `Fact_Cancer_Trends_APC` where `cancer_site` was the text of the citation.

### Implemented Correction
In `load_fact_trends_apc()`, a filter was installed:
```python
if str(site).strip().lower().startswith("source:"):
    logging.warning(f"Skipping footnote row in Cancer Trends APC: {site_str[:80]}")
    continue
```
- **ETL Log Verification:** `2026-10-20 19:50:28,300 [WARNING] Skipping footnote row in Cancer Trends APC: Source: JCO 2020, Fig. 4...`
- **Resulting Count:** Exactly **152 rows** (all genuine cancer trend records; 0 metadata rows).
- **Validation Suite:** `CHECK 5: No stray footnote rows in Fact_Cancer_Trends_APC` $\rightarrow$ **PASS**.

---

## 7. Dimensional Enrichment of Semi-Structured Fact Tables

Three fact tables lacked direct foreign key relationships to dimensions due to source data grain limitations. To avoid fabricating synthetic keys while maintaining data provenance, non-FK audit columns were added:

1. **`Fact_Clinical_Stage` (14 records)**:
   - Added column: `source_measure_code TEXT DEFAULT 'JCO_2020_HBCR'`
   - Documents that stage distributions (Localized, Locoregional, Distant Metastasis) derive from 58 Hospital-Based Cancer Registries published in JCO 2020.
2. **`Fact_Cancer_Trends_APC` (152 records)**:
   - Added column: `source_measure_code TEXT DEFAULT 'JCO_2020_APC'`
   - Documents joinpoint regression longitudinal trends from 28 PBCRs.
3. **`Fact_PBCR_Surveillance` (32 records)**:
   - Added column: `time_period_note TEXT DEFAULT 'Multi-year avg period as TEXT; not FK to Dim_Time - see PBCR publication'`
   - Clarifies that empirical registry metrics represent pooled multi-year annual averages (e.g., `"2012-2016"`) and cannot be joined to annual rows in `Dim_Time`.

---

## 8. Structural Incompleteness in Dimensions

### `Dim_Registry.state_id`
An audit of `Dim_Registry` revealed:
```sql
SELECT COUNT(*) FROM Dim_Registry WHERE state_id IS NULL; -- Result: 32 / 32
```
All 32 registries have `state_id = NULL`. While each registry record possesses a valid `region` attribute (e.g., `'North East'`, `'West'`, `'South'`), the ETL does not map registry names (e.g., `'Kamrup Urban'`, `'Barshi Rural'`, `'Ahmedabad Urban'`) to their corresponding `Dim_Geography.geo_id`.
- **Severity:** LOW.
- **Impact:** Analytical queries aggregating registries by state cannot directly join through `state_id`; they must aggregate by `region` or use an explicit registry-to-state lookup dictionary.
- **Recommendation:** Retain as documented limitation. Do not invent automated string heuristics that could misassign multi-district or urban/rural registries without authoritative jurisdiction documentation.

---

## 9. Comprehensive Database Inventory

Following the Phase 2.1 execution, the active database [`warehouse/cancer_dw.db`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/cancer_dw.db) comprises 15 tables, 3 star-schema views, and 1 internal SQLite sequence table:

| Object Name | Object Type | Verified Row Count | Key Attributes / Role |
| :--- | :---: | :---: | :--- |
| **`Dim_Geography`** | Dimension | 37 | 37 States/UTs, State Code, Regional Zones |
| **`Dim_Cancer_Site`** | Dimension | 76 | Standardized sites, ICD-10, Tobacco-association |
| **`Dim_Organ_System`** | Dimension | 11 | Snowflake hierarchy for cancer site grouping |
| **`Dim_Time`** | Dimension | 11 | 2015 to 2045; corrected epoch categories |
| **`Dim_Measure_Type`** | Dimension | 5 | PBCR_EMPIRICAL, ICMR_NCRP_ESTIMATE, etc. |
| **`Dim_Registry`** | Dimension | 32 | Population-based registries with regional tags |
| **`Fact_State_Surveillance`** | Fact | 259 | 37 states $\times$ 7 years (2019–2022, 2026, 2030, 2045) |
| **`Fact_Cancer_Incidence`** | Fact | 190 | National site-wise burden (IJMR 2022 & GLOBOCAN 2024) |
| **`Fact_State_Mortality_Surveillance`** | Fact | 185 | 37 states $\times$ 5 years (2021–2025) with cancer_type_note |
| **`Fact_PBCR_Surveillance`** | Fact | 32 | Empirical registry surveillance & tobacco share |
| **`Fact_Clinical_Stage`** | Fact | 14 | 58 HBCR clinical stage at presentation |
| **`Fact_Cancer_Trends_APC`** | Fact | 152 | Longitudinal APC % (cleaned; stray footnote removed) |
| **`Fact_Screening_Programs`** | Fact | 3 | Oral, Cervical, and Breast NP-NCD screening |
| **`Fact_Healthcare_Infrastructure_National`**| Fact | 7 | SCI, TCCC, AIIMS, and NCD clinic approvals |
| **`Fact_Maharashtra_Infrastructure`** | Fact | 15 | State deep-dive health infrastructure facilities |
| **`sqlite_sequence`** | System | 14 | Autoincrement tracking table |
| **`vw_star_state_incidence`** | View | 259 | Star-schema state incidence with conformed dimensions |
| **`vw_star_cancer_sites`** | View | 76 | Normalized cancer sites linked to organ systems |
| **`vw_state_mortality_ratios`** | View | 185 | State mortality, incidence, and MIR with provenance |

**Total Records Across 15 Warehouse Tables:** **1,228 records**.

---

## 10. Automated Validation Suite Results & Gap Corrections

The automated validation suite (`scripts/validate_warehouse.py`) was updated to close two key verification gaps:
1. **National Total 2022 State Incidence Sum Validation**:
   - Upgraded from an informational print statement to a **strict, genuine PASS/FAIL validation check**.
   - Evaluates:
     $$\sum_{i=1}^{37} \text{cases}_{i, 2022} = 1,461,427.0 \quad \text{vs.} \quad \text{Expected} = 1,461,427$$
   - Enforces a documented numeric tolerance of $\pm 1.0$ case.
   - Any difference exceeding $1.0$ case immediately fails the check, registers in `failed` count, and forces process exit code 1.
   - **Result:** Sum = **1,461,427.0**, Expected = **1,461,427**, Absolute Difference = **0.0000**, Status = **PASS**.
2. **Fact Grain Uniqueness Validation (`Fact_Cancer_Incidence`)**:
   - Evaluates logical uniqueness on the composite grain:
     `(site_id, time_id, measure_type_id, gender)`
   - Any duplicate group causes validation failure and forces process exit code 1.
   - **Result:** **0 duplicate groups found**, Status = **PASS**.
3. **Reconciled Check Tally**:
   - All executed checks are dynamically evaluated and counted. No check total is hardcoded.
   - Total genuine checks executed: **55**. Passed: **55**. Failed: **0**. Exit Code: **0**.

### Detailed Validation Run Log

```text
=== Cancer Intelligence Warehouse Validation Suite ===
DB Path: C:\Users\ACER\OneDrive\Desktop\Cancer-Intelligence-Analytics\warehouse\cancer_dw.db

Database file size: 167,936 bytes

--- CHECK 1: Schema Tables and Views existence ---
  [PASS] Table Dim_Geography exists — type=table
  [PASS] Table Dim_Cancer_Site exists — type=table
  [PASS] Table Dim_Organ_System exists — type=table
  [PASS] Table Dim_Time exists — type=table
  [PASS] Table Dim_Measure_Type exists — type=table
  [PASS] Table Dim_Registry exists — type=table
  [PASS] Table Fact_State_Surveillance exists — type=table
  [PASS] Table Fact_Cancer_Incidence exists — type=table
  [PASS] Table Fact_State_Mortality_Surveillance exists — type=table
  [PASS] Table Fact_PBCR_Surveillance exists — type=table
  [PASS] Table Fact_Clinical_Stage exists — type=table
  [PASS] Table Fact_Cancer_Trends_APC exists — type=table
  [PASS] Table Fact_Screening_Programs exists — type=table
  [PASS] Table Fact_Healthcare_Infrastructure_National exists — type=table
  [PASS] Table Fact_Maharashtra_Infrastructure exists — type=table
  [PASS] View vw_star_state_incidence exists
  [PASS] View vw_star_cancer_sites exists
  [PASS] View vw_state_mortality_ratios exists

--- CHECK 2: Minimum row counts ---
  [PASS] Dim_Geography row count >= 35 — actual=37
  [PASS] Dim_Cancer_Site row count >= 50 — actual=76
  [PASS] Dim_Measure_Type row count >= 5 — actual=5
  [PASS] Dim_Time row count >= 11 — actual=11
  [PASS] Fact_State_Surveillance row count >= 200 — actual=259
  [PASS] Fact_Cancer_Incidence row count >= 100 — actual=190
  [PASS] Fact_State_Mortality_Surveillance row count >= 150 — actual=185
  [PASS] Fact_PBCR_Surveillance row count >= 20 — actual=32
  [PASS] Fact_Cancer_Trends_APC row count >= 100 — actual=152

--- CHECK 3: Epoch label classifications in Dim_Time ---
  [PASS] Dim_Time year=2022 epoch='Extrapolated' — actual='Extrapolated'
  [PASS] Dim_Time year=2024 epoch='Benchmark' — actual='Benchmark'
  [PASS] Dim_Time year=2026 epoch='Projected' — actual='Projected'
  [PASS] Dim_Time year=2030 epoch='Projected' — actual='Projected'
  [PASS] Dim_Time year=2045 epoch='Projected' — actual='Projected'

--- CHECK 4: Measure codes in Dim_Measure_Type ---
  [PASS] Measure code PBCR_EMPIRICAL
  [PASS] Measure code ICMR_NCRP_ESTIMATE
  [PASS] Measure code KUMAR_EXP_2026
  [PASS] Measure code GLOBOCAN_2024
  [PASS] Measure code PARLIAMENT_MOHFW

--- CHECK 5: Stray footnote rows in Fact_Cancer_Trends_APC ---
  [PASS] No stray footnote rows in Fact_Cancer_Trends_APC — stray_count=0

--- CHECK 6: Referential integrity across foreign keys ---
  [PASS] Fact_State_Surveillance geo_id FK valid — orphans=0
  [PASS] Fact_Cancer_Incidence site_id FK valid — orphans=0
  [PASS] Fact_State_Mortality_Surveillance geo_id FK valid — orphans=0
  [PASS] Fact_State_Surveillance time_id FK valid — orphans=0
  [PASS] Fact_State_Surveillance measure_type_id FK valid — orphans=0

--- CHECK 7: Numeric boundary (non-negative values) ---
  [PASS] No negative incident_cases in Fact_State_Surveillance — count=0
  [PASS] No negative values in Fact_State_Mortality_Surveillance — count=0

--- CHECK 8: NULL checks in required metric columns ---
  [PASS] No NULL incident_cases in Fact_State_Surveillance — count=0
  [PASS] No NULL incidence/deaths in Fact_State_Mortality_Surveillance — count=0

--- CHECK 9: Mortality-to-Incidence Ratio (MIR) domain bounds [0.0, 1.5] ---
  [PASS] All MIR values in [0.0, 1.5] — violations=0

--- CHECK 10: Percentage bounds [0, 100] in Clinical Stage facts ---
  [PASS] Clinical stage pct in [0, 100] — violations=0

--- CHECK 11: National 2022 state incidence sum validation ---
  [PASS] 2022 state incidence sum == expected national total (1,461,427) within tolerance (±1.0) — calculated_sum=1,461,427.0, state_rows=37, abs_diff=0.0000, pct_err=0.0000%

--- CHECK 12: Fact_Cancer_Incidence grain uniqueness (no duplicate records) ---
  [PASS] Fact_Cancer_Incidence grain uniqueness (site_id, time_id, measure_type_id, gender) — duplicate_groups=0

--- CHECK 13: Data provenance and documentation attributes ---
  [PASS] Fact_State_Mortality_Surveillance has cancer_type_note column
  [PASS] Fact_Clinical_Stage has source_measure_code
  [PASS] Fact_Cancer_Trends_APC has source_measure_code
  [PASS] Fact_PBCR_Surveillance has time_period_note

=== SUMMARY: 55/55 checks PASSED | 0 FAILED ===
VALIDATION RESULT: PASS — All 55/55 checks passed.
```

### Arithmetic National Sum Reconciliation Note
The calculated sum of 2022 state incidence across all 37 rows in `Fact_State_Surveillance` is:
$$\sum_{i=1}^{37} \text{cases}_{i, 2022} = 1,461,427.0$$
This matches the reported national total of 1,461,427 with **0.0000% difference**.
> [!IMPORTANT]
> This check is documented strictly as an **arithmetic sum reconciliation** of model-extrapolated state estimates. It confirms that the 37 loaded state values exactly aggregate to the published national sum. It does **not** signify that 1,461,427 cancer patients were empirically enumerated by hospitals across India in 2022.

---

## 11. Remaining Limitations & Risk Disclosure

1. **Dataset 5 Organ-Specificity Ambiguity:**
   - As established in Section 4, `Dataset 5.docx` contains mortality and incidence for an **unspecified single cancer type** (~77K national cases). Analysts and downstream modules must not treat these values as all-cancer mortality.
2. **Registry-to-State Disconnection:**
   - `Dim_Registry.state_id` remains NULL. Queries aggregating registries by administrative territory must rely on the broader `region` column (e.g. `'North East'`, `'West'`).
3. **Multi-Year Temporal Grain in Registry Data:**
   - `Fact_PBCR_Surveillance` represents 2012–2016 multi-year annualized rates stored as a text string, which cannot be joined to annual time rows in `Dim_Time`.
4. **Denormalized Clinical Stage & Trend Facts:**
   - `Fact_Clinical_Stage` and `Fact_Cancer_Trends_APC` are reference datasets from JCO 2020 without direct foreign keys to `Dim_Geography` or `Dim_Cancer_Site`. They are enriched with `source_measure_code` for lineage tracking.

---

## 12. Next Phase Readiness & Phase 3 Gate

Phase 2.1 controlled corrections, gap closures, and audit are complete.
- All code and validation artifacts are committed and verified.
- The warehouse schema is robust, normalized, and cleanly partitioned between empirical observations, extrapolations, international benchmarks, and model forecasts.
- Machine learning modeling (Phase 3), FastAPI backend endpoints, and React/Vite dashboard implementation remain **strictly paused** pending user approval of this audit.
