# PHASE 4: DATA WAREHOUSING & OLAP ANALYTICS REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Report Reference:** `reports/14_phase_4_olap_analytics.md`  
**Execution Timestamp:** October 2026  
**Status:** Phase 4 Complete | Conformed OLAP Views Verified | Query Tests Passed (100%)  
**Verification Artifact:** [`warehouse/olap_test_results.json`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/olap_test_results.json)  

---

## 1. Executive Summary

This report establishes the Data Warehousing and On-Line Analytical Processing (OLAP) architecture implemented in `warehouse/cancer_dw.db`. In fulfillment of DWM Syllabus Unit 2 (Dimensional Modeling & OLAP) and Course Outcome CO2 ("Design dimensional data warehouse schemas and describe the ETL process"), the warehouse supports multi-dimensional analysis across conformed dimensions (`Dim_Geography`, `Dim_Cancer_Site`, `Dim_Organ_System`, `Dim_Time`, `Dim_Measure_Type`, and `Dim_Registry`).

Five conformed analytical views were constructed and tested across all classic OLAP operations:
- **Roll-up:** Summarization along dimensional hierarchies (State $\rightarrow$ Region $\rightarrow$ National, and Cancer Site $\rightarrow$ Organ System).
- **Drill-down:** Decomposition from aggregate regional summaries down to constituent states and sub-sites.
- **Slice:** Single-dimension filtering (e.g., Year = 2022 and Gender = 'Female').
- **Dice:** Multi-dimensional sub-cube extraction (e.g., Region $\in$ {North, East} $\times$ Year $\in$ {2020, 2022}).
- **Pivot:** Cross-tabular reorientation rotating temporal dimensions into column headers for longitudinal comparison.

---

## 2. Dimensional Schema Architecture

The warehouse operates a hybrid **Star and Snowflake Schema** designed to maximize query performance while eliminating redundant anatomical classifications:

```
                            [Dim_Organ_System] (Snowflake Sub-Dimension)
                                    │
                                    ▼ (1:N)
 [Dim_Geography]            [Dim_Cancer_Site]            [Dim_Time]
        │                           │                        │
        ├───────────────────────────┼────────────────────────┤
        ▼                           ▼                        ▼
[Fact_State_Surveillance]  [Fact_Cancer_Incidence]  [Fact_State_Mortality_Surveillance]
        ▲                           ▲                        ▲
        │                           │                        │
        └───────────────────────────┴────────────────────────┘
                                    │
                        [Dim_Measure_Type] (Conformed)
```

- **Conformed Dimensions:**
  - `Dim_Geography` (37 States/UTs, State Code, 6 Regional Zones)
  - `Dim_Time` (11 Periods from 2015 to 2045 with conformed Epochs: Historical, Extrapolated, Benchmark, Projected)
  - `Dim_Measure_Type` (5 Provenance Codes: `PBCR_EMPIRICAL`, `ICMR_NCRP_ESTIMATE`, `KUMAR_EXP_2026`, `GLOBOCAN_2024`, `PARLIAMENT_MOHFW`)
- **Snowflake Sub-Dimension:**
  - `Dim_Cancer_Site` normalizes into `Dim_Organ_System` (11 anatomical systems: Breast, Digestive, Respiratory, Oral/Pharynx, etc.), avoiding denormalized category repetition.

---

## 3. Conformed OLAP Views Inventory

| View Name | Source Tables | Dimensional Grain | Primary Analytical Purpose |
| :--- | :--- | :--- | :--- |
| **`vw_star_state_incidence`** | `Fact_State_Surveillance`, `Dim_Geography`, `Dim_Time`, `Dim_Measure_Type` | State $\times$ Year | Core star-schema view for state incidence and CAGR comparisons |
| **`vw_star_cancer_sites`** | `Dim_Cancer_Site`, `Dim_Organ_System` | Site | Cancer site anatomical hierarchy and tobacco attribution |
| **`vw_state_mortality_ratios`** | `Fact_State_Mortality_Surveillance`, `Dim_Geography`, `Dim_Time` | State $\times$ Year | Mortality, incidence, and computed MIR with provenance note |
| **`vw_olap_regional_rollups`** | `Fact_State_Surveillance`, `Dim_Geography`, `Dim_Time`, `Dim_Measure_Type` | Region $\times$ Year | Aggregated regional burden, state counts, min/max/avg |
| **`vw_olap_organ_system_burden`**| `Fact_Cancer_Incidence`, `Dim_Cancer_Site`, `Dim_Organ_System` | Organ System $\times$ Year $\times$ Gender | High-level organ-system burden and mortality rollup |
| **`vw_olap_state_pivots`** | `Fact_State_Surveillance`, `Dim_Geography` | State | Cross-tabular pivot of 37 states across 2019, 2020, 2021, 2022, 2026, 2030, 2045 |
| **`vw_olap_pbcr_analytics`** | `Fact_PBCR_Surveillance`, `Dim_Registry` | Registry $\times$ Gender | Registry-level surveillance, rates, and tobacco attribution % |
| **`vw_olap_infrastructure_national`** | `Fact_Healthcare_Infrastructure_National` | Indicator | National cancer healthcare infrastructure approvals |

---

## 4. Verification of the 5 Core OLAP Operations

All five core OLAP operations were executed and verified against `warehouse/cancer_dw.db` using automated unit assertions in `scripts/implement_olap_views.py`.

### A. Roll-up (State $\rightarrow$ Region $\rightarrow$ National)
- **Concept:** Moving up the geographic hierarchy by aggregating individual state counts into regional zones, and summing regional zones to the national estimate.
- **SQL Implementation:**
  ```sql
  SELECT region_zone, total_regional_cases, regional_share_pct 
  FROM vw_olap_regional_rollups 
  WHERE year = 2022 
  ORDER BY total_regional_cases DESC;
  ```
- **Execution Output:**
  - Central Zone (4 states): $398,753.0$ cases ($27.28\%$)
  - South Zone (8 states/UTs): $383,215.0$ cases ($26.22\%$)
  - East Zone (4 states): $297,713.0$ cases ($20.37\%$)
  - West Zone (5 states/UTs): $202,305.0$ cases ($13.84\%$)
  - North Zone (8 states/UTs): $127,109.0$ cases ($8.70\%$)
  - North East Zone (8 states): $52,332.0$ cases ($3.58\%$)
- **Unit Assertion:** $\sum \text{Regional Cases} = 1,461,427.0 \equiv \text{Expected National Total} = 1,461,427.0$.
- **Result:** **PASS**.

### B. Drill-down (Region $\rightarrow$ States)
- **Concept:** Navigating from an aggregate regional summary down into the individual constituent states.
- **SQL Implementation:**
  ```sql
  SELECT state_name, incident_cases, national_share_pct 
  FROM vw_star_state_incidence 
  WHERE region_zone = 'West' AND year = 2022 
  ORDER BY incident_cases DESC;
  ```
- **Execution Output (West Zone Drill-down):**
  1. Maharashtra: $121,717.0$ cases ($8.33\%$ national share)
  2. Gujarat: $73,382.0$ cases ($5.02\%$)
  3. Goa: $6,395.0$ cases ($0.44\%$)
  4. Daman & Diu: $437.0$ cases ($0.03\%$)
  5. Dadra & Nagar Haveli: $374.0$ cases ($0.03\%$)
- **Unit Assertion:** Decomposes West Zone into exactly 5 states/UTs totaling $202,305.0$ cases.
- **Result:** **PASS**.

### C. Slice (Single Dimension Cut)
- **Concept:** Fixing one or more dimensions to examine a specific slice of the multi-dimensional cube (fixing `year = 2022` and `gender = 'Female'`).
- **SQL Implementation:**
  ```sql
  SELECT s.site_name, f.incident_cases, f.crude_rate, f.age_adjusted_rate
  FROM Fact_Cancer_Incidence f
  JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
  WHERE f.time_id = 2022 AND f.gender = 'Female'
  ORDER BY f.incident_cases DESC;
  ```
- **Execution Output:**
  - Total Female Cancer Burden (All Sites): $749,251.0$ cases (Crude Rate: $112.5$ per 100k)
  - Top Anatomical Site: **Breast** ($216,108.0$ cases, Crude Rate: $32.4$, AAR: $26.8$)
  - Second Anatomical Site: **Cervix Uteri** ($127,526.0$ cases, Crude Rate: $19.1$, AAR: $15.7$)
  - Third Anatomical Site: **Ovary** ($46,312.0$ cases, Crude Rate: $7.0$, AAR: $6.1$)
- **Result:** **PASS**.

### D. Dice (Sub-Cube Selection)
- **Concept:** Selecting a multi-dimensional sub-cube by applying conditional filters across multiple dimensions simultaneously (`region_zone IN ('North', 'East')` $\times$ `year IN (2020, 2022)`).
- **SQL Implementation:**
  ```sql
  SELECT region_zone, year, SUM(incident_cases) as dice_cases, COUNT(DISTINCT state_name) as state_count
  FROM vw_star_state_incidence
  WHERE region_zone IN ('North', 'East') AND year IN (2020, 2022)
  GROUP BY region_zone, year
  ORDER BY region_zone, year;
  ```
- **Execution Output:**
  - East Zone, 2020: $283,733.0$ cases (4 states)
  - East Zone, 2022: $297,713.0$ cases (4 states, observed growth: $+4.93\%$)
  - North Zone, 2020: $121,189.0$ cases (8 states/UTs)
  - North Zone, 2022: $127,109.0$ cases (8 states/UTs, observed growth: $+4.89\%$)
- **Result:** **PASS** (Sub-cube contains exactly 4 cells as expected).

### E. Pivot (Cross-Tabular Reorientation)
- **Concept:** Reorienting the temporal dimension from row tuples into distinct column attributes for all 37 states.
- **SQL Implementation:** `vw_olap_state_pivots` rotates time IDs (2019, 2020, 2021, 2022, 2026) across horizontal columns.
- **Sample Pivoted Output:**
  ```
  State Name          Region     2019 Cases   2020 Cases   2021 Cases   2022 Cases   2026 Forecast   Observed CAGR
  ----------------------------------------------------------------------------------------------------------------
  Uttar Pradesh       Central       196,177      201,319      206,129      210,958         230,816           2.45%
  Maharashtra         West          113,195      116,121      118,919      121,717         133,184           2.45%
  West Bengal         East          105,627      108,356      110,968      113,581         124,279           2.45%
  Bihar               East          101,619      104,247      106,760      109,274         119,566           2.45%
  Tamil Nadu          South          86,988       89,237       91,387       93,536         102,347           2.45%
  ```
- **Unit Assertion:** Evaluates all 37 states with 0 NULL values for 2022.
- **Result:** **PASS**.

---

## 5. Conclusions & Next Phase Gate

Phase 4 OLAP view construction and multi-dimensional verification are complete.
- All five core operations (Roll-up, Drill-down, Slice, Dice, Pivot) function with mathematical accuracy.
- The warehouse schema is verified as OLAP-ready, providing the exact SQL interface required by both the upcoming machine learning pipelines and the FastAPI backend routers.

**Phase Gate Approved:** Proceed to **Phase 5 (Data Mining Algorithms: Regression, Classification, Clustering, Association Rules)**.
