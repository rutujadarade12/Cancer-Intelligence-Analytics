# PHASE 3: DATA PROFILING & ANALYTICAL READINESS REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Report Reference:** `reports/13_phase_3_data_profiling.md`  
**Execution Timestamp:** October 2026  
**Status:** Phase 3 Complete | Data Profiled | Analytical Gates Established  
**Profiling Data Artifact:** [`warehouse/data_profiling_results.json`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/warehouse/data_profiling_results.json)  

---

## 1. Executive Summary

This report delivers the foundational data profiling and analytical readiness assessment for the **Cancer Intelligence & Analytics** warehouse (`warehouse/cancer_dw.db`). In accordance with DWM course outcomes (CO3: Data Preprocessing and Exploratory Analysis; CO4: Algorithm Selection and Comparison), all 15 relational tables and 3 dimensional views were subjected to:
1. **Structural Profiling:** Schema validation, field counts, nullability, primary key constraints, and distinct value cardinality.
2. **Statistical Profiling:** Parametric (mean, standard deviation) and non-parametric 5-number summaries (minimum, Q1, median, Q3, maximum, IQR) and skewness across all continuous numeric metrics.
3. **Distributional Analysis:** Geographic ranking (top states vs. small union territories), anatomical site breakdown by sex, organ-system shares, and longitudinal progression.
4. **Data Quality & Anomaly Profiling:** Outlier detection via the $1.5 \times \text{IQR}$ rule, small-number ratio artifacts, and strict incompatible-unit safeguards.
5. **Analytical Readiness Matrix:** Feasibility, target variable definitions, feature engineering requirements, and evaluation protocols for Regression, Classification, Clustering, and Association Rule Mining.

---

## 2. Structural Profiling & Dimensional Inventory

The warehouse contains **1,228 records across 15 relational tables and 3 conformed views**. All foreign key dependencies are verified with 0 orphan keys.

| Table Name | Entity Type | Records | Columns | Primary Key | Mandatory Foreign Keys | Verified Distinct Keys |
| :--- | :---: | :---: | :---: | :--- | :--- | :---: |
| **`Dim_Geography`** | Dimension | 37 | 5 | `geo_id` | None | 37 States/UTs, 6 Region Zones |
| **`Dim_Cancer_Site`** | Dimension | 76 | 7 | `site_id` | `organ_system_id` | 76 Sites, 10 Organ Systems |
| **`Dim_Organ_System`** | Sub-Dimension | 11 | 2 | `organ_system_id` | None | 11 Systems |
| **`Dim_Time`** | Dimension | 11 | 4 | `time_id` | None | 11 Years (2015–2045) |
| **`Dim_Measure_Type`** | Dimension | 5 | 5 | `measure_type_id` | None | 5 Conformed Measure Codes |
| **`Dim_Registry`** | Dimension | 32 | 7 | `registry_id` | `state_id` (NULL) | 32 Registries, 6 Regions |
| **`Fact_State_Surveillance`** | Fact | 259 | 8 | `fact_state_id` | `geo_id`, `time_id`, `measure_type_id` | 37 States $\times$ 7 Periods |
| **`Fact_Cancer_Incidence`** | Fact | 190 | 10 | `fact_id` | `site_id`, `time_id`, `measure_type_id` | 76 Sites $\times$ Genders |
| **`Fact_State_Mortality_Surveillance`** | Fact | 185 | 8 | `fact_mort_id` | `geo_id`, `time_id`, `measure_type_id` | 37 States $\times$ 5 Years |
| **`Fact_PBCR_Surveillance`** | Fact | 32 | 10 | `fact_pbcr_id` | `registry_id` | 28 Registries $\times$ Genders |
| **`Fact_Clinical_Stage`** | Fact (Ref) | 14 | 10 | `fact_stage_id` | `source_measure_code` (Lineage) | 7 Major Sites $\times$ Genders |
| **`Fact_Cancer_Trends_APC`** | Fact (Ref) | 152 | 9 | `fact_trend_id` | `source_measure_code` (Lineage) | 152 Trend Lines (Cleaned) |
| **`Fact_Screening_Programs`** | Fact | 3 | 7 | `screening_id` | None | 3 National Screened Cancers |
| **`Fact_Healthcare_Infrastructure_National`** | Fact | 7 | 4 | `infra_id` | None | 7 MOHFW Indicators |
| **`Fact_Maharashtra_Infrastructure`** | Fact | 15 | 5 | `mh_infra_id` | None | 15 State Facility Records |

---

## 3. Statistical Profiling of Key Numerical Dimensions

Metrics are strictly partitioned by table and measurement unit to prevent invalid aggregation.

### A. State-Level Cancer Burden (`Fact_State_Surveillance`)
- **Evaluated Metric:** `incident_cases` ($N = 259$)
  - **Mean:** $43,767.1$ cases
  - **Standard Deviation:** $47,651.9$ cases
  - **Minimum:** $29.0$ cases (Lakshadweep, 2019)
  - **Q1 (25th percentile):** $4,769.0$ cases
  - **Median (50th percentile):** $27,885.0$ cases
  - **Q3 (75th percentile):** $75,349.5$ cases
  - **Maximum:** $266,419.0$ cases (Uttar Pradesh, 2045 projection)
  - **Interquartile Range (IQR):** $70,580.5$ cases
  - **Skewness:** $+1.789$ (pronounced right-skew driven by large demographic populations)

- **Evaluated Metric:** `cagr_observed` ($N = 148$, 2019–2022)
  - **Mean:** $2.42\%$ annual growth
  - **Median:** $2.45\%$
  - **Min / Max:** $1.80\% / 3.10\%$

### B. National Site Burden (`Fact_Cancer_Incidence`)
- **Evaluated Metric:** `incident_cases` ($N = 188$ non-null observations)
  - **Mean:** $21,114.7$ cases per site-gender stratum
  - **Median:** $10,030.5$ cases
  - **IQR:** $25,296.5$ cases
  - **Maximum:** $192,020.0$ cases (Breast Cancer, Female, 2022)

- **Evaluated Metric:** `crude_rate` (per 100,000 population, $N = 148$)
  - **Mean:** $3.58$ per 100k
  - **Median:** $1.40$ per 100k
  - **Max:** $28.20$ per 100k (Female Breast Cancer)

- **Evaluated Metric:** `age_adjusted_rate` (AAR per 100,000, $N = 100$)
  - **Mean:** $3.67$ per 100k
  - **Median:** $1.60$ per 100k
  - **Max:** $26.80$ per 100k

### C. State Mortality Surveillance (`Fact_State_Mortality_Surveillance`)
- **Evaluated Metric:** `reported_incidence` ($N = 185$, Dataset 5 single unspecified cancer type)
  - **Mean:** $2,185.0$ cases
  - **Median:** $1,472.0$ cases
  - **Min / Max:** $1.0 / 10,774.0$ cases (UP 2025)

- **Evaluated Metric:** `reported_deaths` ($N = 185$)
  - **Mean:** $1,180.2$ deaths
  - **Median:** $795.0$ deaths
  - **Min / Max:** $1.0 / 5,820.0$ deaths

- **Evaluated Metric:** `mortality_incidence_ratio` (MIR, $N = 185$)
  - **Mean:** $0.5503$ ($55.03\%$)
  - **Standard Deviation:** $0.0402$
  - **Min:** $0.5000$ (Dadra & Nagar Haveli, Daman & Diu)
  - **Median:** $0.5401$
  - **Max:** $1.0000$ (Ladakh: 1 case, 1 death)
  - **IQR:** $0.0039$ (remarkably stable empirical ratio across major states)

### D. Empirical Registry Surveillance (`Fact_PBCR_Surveillance`)
- **Evaluated Metric:** `annual_cases` ($N = 32$)
  - **Mean:** $2,780.2$ annual cases per registry
  - **Median:** $1,879.0$ cases
  - **Min / Max:** $73.0$ (Pasighat) / $10,879.0$ (Delhi)
- **Evaluated Metric:** `tobacco_share_pct` ($N = 32$)
  - **Male Tobacco Share:** Mean $45.2\%$, Max $56.8\%$ (Meghalaya)
  - **Female Tobacco Share:** Mean $16.4\%$, Max $32.1\%$ (Mizoram)

---

## 4. Distribution Analysis

### A. State Incidence Hierarchy (2022 Verified ICMR-NCRP Estimates)

```
State / UT                       Cases (2022)      Nat'l Share %      Cumulative Share %
----------------------------------------------------------------------------------------
1. Uttar Pradesh                   210,958            14.44%               14.44%
2. Maharashtra                     121,717             8.33%               22.76%
3. West Bengal                     113,581             7.77%               30.54%
4. Bihar                           109,274             7.48%               38.01%
5. Tamil Nadu                       93,536             6.40%               44.41%
6. Karnataka                        90,349             6.18%               50.60%
7. Madhya Pradesh                   81,901             5.60%               56.20%
8. Rajasthan                        74,725             5.11%               61.31%
9. Andhra Pradesh                   73,536             5.03%               66.35%
10. Gujarat                         73,382             5.02%               71.37%
...
33. Daman & Diu                        437             0.03%               99.93%
34. Andaman & Nicobar                  393             0.03%               99.96%
35. Dadra & Nagar Haveli               374             0.03%               99.98%
36. Ladakh                             178             0.01%               99.99%
37. Lakshadweep                         33             0.002%             100.00%
----------------------------------------------------------------------------------------
Total National Estimate (37 States): 1,461,427       100.00%
```

**Key Distributional Finding:** The top 10 states account for **$71.37\%$** of India's total estimated cancer burden, while the bottom 7 union territories contribute under $0.2\%$.

### B. Regional Zone Distribution (2022)
- **Central Zone (UP, MP, Chhattisgarh, Rajasthan):** $398,753$ cases ($27.28\%$)
- **South Zone (TN, KA, AP, TG, KL, PY, LD, AN):** $383,215$ cases ($26.22\%$)
- **East Zone (WB, BR, JH, OR):** $297,713$ cases ($20.37\%$)
- **West Zone (MH, GJ, GA, DD, DN):** $202,305$ cases ($13.84\%$)
- **North Zone (JK, LA, HP, PB, CH, UK, HR, DL):** $127,109$ cases ($8.70\%$)
- **North East Zone (AS, AR, ML, MN, MZ, NL, SK, TR):** $52,332$ cases ($3.58\%$)

### C. Leading Cancer Sites by Sex (IJMR 2022)
- **Males:**
  1. Mouth / Oral Cavity ($15.6\%$ of male cases, AAR $10.1$ per 100k)
  2. Lung & Bronchus ($10.8\%$ of male cases, AAR $7.2$ per 100k)
  3. Stomach ($6.8\%$ of male cases, AAR $4.4$ per 100k)
  4. Colorectum ($5.9\%$ of male cases)
  5. Oesophagus ($5.6\%$ of male cases)
- **Females:**
  1. Breast ($28.2\%$ of female cases, AAR $26.8$ per 100k, $1$ in $28$ lifetime risk)
  2. Cervix Uteri ($16.5\%$ of female cases, AAR $15.7$ per 100k)
  3. Ovary ($6.4\%$ of female cases, AAR $6.1$ per 100k)
  4. Mouth / Oral Cavity ($4.8\%$ of female cases)
  5. Colorectum ($4.1\%$ of female cases)

---

## 5. Data Quality, Outliers & Epidemiological Safeguards

### A. Genuine Demographic Outliers
Applying the standard $1.5 \times \text{IQR}$ rule to 2022 state incidence:
$$\text{Upper Threshold} = Q3 + (1.5 \times \text{IQR}) = 75,349.5 + (1.5 \times 70,580.5) = 181,220.25 \text{ cases}$$
- **Statistical Outlier Identified:** Uttar Pradesh ($210,958$ cases).
- **Epidemiological Assessment:** Uttar Pradesh has a Census-projected population of $\approx 235$ million people. Its crude cancer rate ($\approx 89.8$ per 100,000) is consistent with national averages.
- **Handling Protocol:** **DO NOT REMOVE OR WINSORIZE**. This is an authentic demographic outlier representing genuine population healthcare demand. Algorithms sensitive to scale (K-Means, Linear Regression) must apply `StandardScaler` or logarithmic transformation rather than truncating records.

### B. Small-Number Ratio Artifacts
In `Fact_State_Mortality_Surveillance`:
- Ladakh reports: $1$ case, $1$ death ($\text{MIR} = 1.0000$) across 2021–2025.
- Lakshadweep reports: $29$ cases, $15$ deaths ($\text{MIR} = 0.5172$).
- **Handling Protocol:** Document that an MIR of $1.0$ in small jurisdictions is a discrete integer artifact ($1/1 = 1.0$), not clinical proof that cancer is $100\%$ fatal in Ladakh.

### C. Incompatible Unit Ingestion Safeguards
The platform enforces three strict computational barriers:
1. **Count vs. Rate Barrier:** Raw counts (`incident_cases`) must never be summed with normalized rates (`crude_rate`, `age_adjusted_rate`).
2. **Temporal Multi-Year Barrier:** `Fact_PBCR_Surveillance` represents pooled multi-year annual rates (`"2012-2016"`). It is barred from annual time series joins with `Fact_State_Surveillance`.
3. **Single-Site Mortality Barrier:** `Fact_State_Mortality_Surveillance` represents a single unspecified cancer cohort (~77K cases) and must never be subtracted from or compared as all-cancer mortality against `Fact_State_Surveillance` (1.46M cases).

---

## 6. Analytical Readiness Matrix for Data Mining (Phase 5)

| Syllabus Algorithm | Proposed Analytical Task | Usable Observations | Features & Target Variable | Limitations & Methodological Constraints | Feasibility Decision |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **A. Regression** | Econometric trend validation: State historical trajectory vs. 2026 forecast | $N = 37$ states $\times$ 7 periods ($259$ records) | **Target:** `incident_cases`<br>**Features:** Year, historical CAGR, regional tier | Historical data (2019–2022) and targets (2026) are both model-derived. Must be framed as trend validation, not ground-truth clinical forecasting. | **JUSTIFIED (Descriptive Trend Validation)** |
| **B. Decision Tree** | State epidemiological burden tier classification (Quartile Tiers: Low, Moderate, High, Severe) | $N = 37$ states | **Target:** `burden_tier` (Q1–Q4)<br>**Features:** Regional zone, observed CAGR, infrastructure count | Small sample size ($N = 37$). Risk of overfitting if tree depth $> 3$. Max depth strictly capped at 3 with cross-validation. | **JUSTIFIED (Constrained Tree, Max Depth 3)** |
| **C. Naive Bayes** | Probabilistic classification of cancer sites by primary risk factor (Tobacco vs Non-Tobacco) | $N = 76$ anatomical sites | **Target:** `is_tobacco_associated` ($1/0$)<br>**Features:** Organ system, male-to-female incidence ratio, AAR tier | Classifies cancer anatomical categories, not human patients. Gaussian/Categorical NB appropriate. | **JUSTIFIED (Site Category Profiling)** |
| **D. K-Means Clustering** | Unsupervised multivariate grouping of 37 States by epidemiological and health burden profiles | $N = 37$ states | **Features:** Standardized 2022 incidence, CAGR, regional indicators, infrastructure counts | Scale disparity requires `StandardScaler`. Optimal $k$ ($3$ to $5$) must be justified via Silhouette Score and Elbow Method. | **HIGHLY JUSTIFIED (State Healthcare Clustering)** |
| **E. Hierarchical Clustering** | Agglomerative clustering with Dendrogram of Indian States and PBCR Registries | $N = 37$ states & $N = 28$ registries | **Features:** Standardized incidence, growth rate, tobacco attribution % | Ward linkage with Euclidean distance. Produces clear, interpretable dendrogram without visual clutter. | **HIGHLY JUSTIFIED (Dendrogram Visual Analytics)** |
| **F. Association Rule Mining (Apriori)** | Market-basket co-occurrence of state healthcare risk factors and high burden profiles | $N = 37$ state baskets | **Transaction Definition:** Discretized quantile itemsets (e.g., `{High_Incidence, Rapid_Growth, Low_Infrastructure}`) | Must discretize continuous variables using objective quartiles. Never fabricate transactions. Report Support, Confidence, Lift. | **JUSTIFIED (Quantile-Discretized Itemsets)** |

---

## 7. Conclusions & Phase Gate

Phase 3 profiling is complete. All variables have been inventoried, statistical properties quantified, anomalies audited, and algorithmic candidate tasks formally defined with strict ethical and methodological safeguards.

**Phase Gate Approved:** Proceed to **Phase 4 (Data Warehousing and OLAP Demonstration)**.
