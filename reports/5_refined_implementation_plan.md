# REFINED IMPLEMENTATION PLAN: CANCER INTELLIGENCE & ANALYTICS
**Subject:** Data Warehousing and Data Mining (DWM) — Sem V CMPN (2026–2027)  
**Status:** Architecture Specification & Engineering Blueprint (Pre-implementation Gate)  
**Deliverable:** `reports/5_refined_implementation_plan.md`

---

## 1. Executive Summary & Foundational Principles

This Refined Implementation Plan governs the end-to-end design of the **Cancer Intelligence & Analytics** platform. Built for an academic Data Warehousing and Data Mining (DWM) project, this plan adheres strictly to sound statistical methodology, clinical data hygiene, and autonomous course syllabus outcomes.

### Core Governance Principles
1. **Preservation of Raw Truth:** All raw source files in `Data/Cancer Dataset.zip` and `Reference/` remain completely untouched, immutable, and preserved.
2. **Definitional Separation:** Epidemiological measures are explicitly partitioned into three non-interchangeable tiers:
   - **Observed / Empirical Registrations:** Confirmed incident cases registered directly by Population-Based Cancer Registries (PBCR).
   - **National / State Extrapolations:** Age-standardized rates applied to Census demographic forecasts by ICMR-NCDIR.
   - **Model-Projected Forecasts:** Econometric and mathematical predictions (e.g. Kumar et al. 2026 moderated exponential regressions).
3. **No Ecological Fallacy:** Macro-level state rates, regional cancer shares, and demographic patterns represent population public-health surveillance, **never** individual clinical risk or personal diagnostic likelihood.
4. **No Artificially Fabricated Data:** Zero synthetic records, fake patient encounters, or hallucinated numbers will be introduced. Missing values will be represented explicitly as nulls/missing indicators.
5. **No Blind Modeling:** Data mining algorithms must have rigorous validation regimes (temporal split or $k$-fold cross-validation) and will only be applied where feature dimensions genuinely support them.

---

## 2. Final Dataset Selection & Granular Ingestion Matrix

Following the deep structural inspection in Phase 1, `final_excel_updated.xlsx` is established as the **Single Source of Truth / Primary Dataset**. Auxiliary sheets from `Dataset 9.xlsx` and structured tables from `Dataset 5.docx` and `Dataset 6.docx` will be ingested strictly where they provide non-duplicative, verified data.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INGESTION & SURVEILLANCE MATRIX                       │
├───────────────────────────────┬──────────────────────┬──────────────────────────┤
│ Source File & Sheet / Table   │ Data Domain          │ Measure Category         │
├───────────────────────────────┼──────────────────────┼──────────────────────────┤
│ final_excel_updated.xlsx      │                      │                          │
│  • State-wise Incidence       │ 37 States/UTs        │ Observed (2019–22) +     │
│                               │                      │ Modeled (2026, 30, 45)   │
│  • India Sites 2022           │ 56 Primary Sites     │ Extrapolated (2022)      │
│  • India Sites 2020           │ 56 Primary Sites     │ Modeled (2020 baseline)  │
│  • India Age-Sex Sites        │ 4 Age Strata x Sex   │ Extrapolated (2022)      │
│  • India Top10 Sites 2022     │ Leading Top 10 Sites │ Extrapolated (2022)      │
│  • India Trend 2015-2025      │ 10 Major Organ Sites │ Observed + Projected     │
│  • PBCR Incidence Table       │ 28 Registries (JCO)  │ Empirical PBCR Observed  │
│  • Tobacco-related Cancers    │ Registry-level Share │ Empirical PBCR Observed  │
│  • Cancer Trends (APC)        │ Annual % Change      │ Empirical Registry Trend │
│  • Clinical Stage             │ Stage at Diagnosis   │ Hospital-Based (HBCR)    │
│  • MH PBCR Profile & Sites    │ Maharashtra Deepdive │ Registry + Health Infra  │
│  • Healthcare Moderators      │ Infrastructure A-E   │ Capacity Determinants    │
├───────────────────────────────┼──────────────────────┼──────────────────────────┤
│ Dataset 9.xlsx (Unique Only)  │                      │                          │
│  • GLOBOCAN 2024 by Site      │ 35 Cancer Sites      │ International Benchmark  │
│  • GLOBOCAN 2024 Summary      │ National Indicators  │ Global Incidence/Mort.   │
│  • PBCR 2015-2019 (JAMA 2025) │ 58 Registry Units    │ Recent Empirical JAMA    │
│  • Key Indicators 2019-2026   │ 77 Benchmarks        │ Macro KPI Metrics        │
├───────────────────────────────┼──────────────────────┼──────────────────────────┤
│ Dataset 5.docx & 6.docx       │                      │                          │
│  • Dataset 5: State Mortality │ 36 States/UTs        │ Official Gov Mortality   │
│  • Dataset 6: NP-NCD Screening│ National Screening   │ Screened / Diagnosed / Tx│
│  • Dataset 6: SCI / TCCC List │ Oncology Centers     │ Approved Infra Counts    │
└───────────────────────────────┴──────────────────────┴──────────────────────────┘
```

### Files Explicitly Excluded from Ingestion
1. `final_excel_with_pdf_data (1).xlsx` — Unchecked working copy; 100% superseded by `final_excel_updated.xlsx`.
2. `Cancer_Data_India_2019_2026_Concise.xlsx` — 18-state truncated preview; completely redundant.
3. `final excel.xlsx` — Baseline 7-sheet version; completely incorporated into `final_excel_updated.xlsx`.
4. `cancer dataset 4.pdf` & `dataset 3.pdf` — Raw PDF publications already digitized with 100% fidelity into the above workbooks.

---

## 3. Warehouse Architecture: Fact & Dimension Tables

The Data Warehouse is structured using a **Constellation Schema** consisting of a centralized core **Star Schema** for cancer incidence/mortality, supplemented by specialized satellite marts and a normalized **Snowflake hierarchy** for anatomical sites.

```
                    ┌────────────────────────────┐
                    │       Dim_Geography        │
                    │  (State, Zone, ISO, Pop)   │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
┌──────────────────┐    ┌────────────────────────────┐    ┌──────────────────┐
│     Dim_Time     │───▶│   Fact_Cancer_Incidence    │◀───│   Dim_Measure    │
│ (Year, Category) │    │  (State, Site, Year, Count)│    │(Observed/Modelled│
└──────────────────┘    └─────────────┬──────────────┘    └──────────────────┘
                                      │
                                      ▼
                        ┌────────────────────────────┐
                        │       Dim_Cancer_Site      │
                        │ (Site_Name, ICD10, Tobacco)│
                        └─────────────┬──────────────┘
                                      │ (Normalized Snowflake)
                                      ▼
                        ┌────────────────────────────┐
                        │      Dim_Organ_System      │
                        │ (Digestive, Respiratory...)│
                        └────────────────────────────┘
```

### Table Definitions & Attributes

#### Dimension Tables
1. **`Dim_Geography` (Conformed Dimension)**
   - `Geo_ID` (PK, Integer): Unique identifier.
   - `State_UT_Name` (String): Standardized state or UT name.
   - `State_Code` (String, 2-letter ISO): e.g. `MH`, `DL`, `KA`.
   - `Region_Zone` (String): `North`, `South`, `East`, `West`, `North-East`, `Central`.
   - `Census_Population_2011` (Integer): Baseline population.
   - `Estimated_Population_2022` (Integer): Projected demographic baseline.
   - `Urbanization_Rate` (Float): % of urban population.
2. **`Dim_Time` (Conformed Dimension)**
   - `Time_ID` (PK, Integer): e.g. `2019`, `2022`, `2026`.
   - `Calendar_Year` (Integer): Year number.
   - `Data_Period` (String): `2012-2016`, `2019-2022`, `2021-2025`, `2026-2045`.
   - `Decade` (String): `2010s`, `2020s`, `2030s`, `2040s`.
   - `Surveillance_Epoch` (String): `Historical Baseline`, `Recent Observed`, `Near-term Forecast`, `Long-term Horizon`.
3. **`Dim_Cancer_Site` (Snowflake Hierarchy Dimension)**
   - `Site_ID` (PK, Integer): Primary organ site identifier.
   - `Site_Name` (String): Common anatomical name (e.g. `Breast`, `Lung`, `Mouth`).
   - `ICD10_Code` (String): International code (e.g. `C50`, `C33-C34`, `C03-C06`).
   - `Tobacco_Associated_Flag` (Boolean): `True` if classified as tobacco-related by ICMR/WHO.
   - `Gender_Predilection` (String): `Male-dominated`, `Female-dominated`, `Neutral`.
   - `Organ_System_ID` (FK $\rightarrow$ `Dim_Organ_System`).
4. **`Dim_Organ_System` (Snowflake Extension)**
   - `Organ_System_ID` (PK, Integer).
   - `System_Name` (String): `Digestive System`, `Respiratory & Intrathoracic`, `Female Genital`, `Breast`, `Lymphoid & Haematopoietic`.
5. **`Dim_Measure_Type`**
   - `Measure_Type_ID` (PK, Integer).
   - `Measure_Class` (String): `Empirical Observed (PBCR)`, `National Extrapolated (ICMR)`, `Moderated Exponential Forecast (Kumar 2026)`, `WHO GLOBOCAN Benchmark`.
   - `Confidence_Flag` (String): `High (Direct Registration)`, `Medium (Demographic Matrix)`, `Model-Projected`.

#### Fact Tables
1. **`Fact_Cancer_Incidence` (Primary Fact Table)**
   - `Fact_Incidence_ID` (PK, BigInt).
   - `Geo_ID` (FK $\rightarrow$ `Dim_Geography`).
   - `Time_ID` (FK $\rightarrow$ `Dim_Time`).
   - `Site_ID` (FK $\rightarrow$ `Dim_Cancer_Site`).
   - `Measure_Type_ID` (FK $\rightarrow$ `Dim_Measure_Type`).
   - `Incident_Cases` (Float / Integer): Absolute case count.
   - `Crude_Incidence_Rate` (Float): Cases per 100,000 population.
   - `Age_Adjusted_Rate_AAR` (Float): World Standardized rate per 100,000.
   - `Cumulative_Risk_Percent` (Float): Probability of developing cancer before age 75.
2. **`Fact_State_Annual_Mortality` (Mortality Mart Fact)**
   - `Fact_Mortality_ID` (PK, BigInt).
   - `Geo_ID` (FK $\rightarrow$ `Dim_Geography`).
   - `Time_ID` (FK $\rightarrow$ `Dim_Time`).
   - `Registered_Deaths` (Integer).
   - `Crude_Mortality_Rate` (Float).
   - `Mortality_to_Incidence_Ratio` (Float, Calculated: $\frac{\text{Deaths}}{\text{Incidence}}$).
3. **`Fact_Healthcare_Infrastructure` (Moderators Fact)**
   - `Fact_Infra_ID` (PK, BigInt).
   - `Geo_ID` (FK $\rightarrow$ `Dim_Geography`).
   - `Year` (Integer).
   - `Dedicated_Cancer_Hospitals` (Integer).
   - `Approved_TCCC_SCI_Count` (Integer).
   - `Oncologist_Density_Index` (Float).
   - `Radiotherapy_Equipment_Index` (Float).
   - `Hospital_Beds_Per_1000` (Float).
   - `Per_Capita_Health_Expenditure` (Float).

---

## 4. ETL Pipeline & Data Cleaning Rules

```
┌────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Extract Phase     │────▶│  Transform Phase     │────▶│  Load Phase         │
│  - Excel Openpyxl  │     │  - Type Casting      │     │  - SQLite Database  │
│  - Word Docx Tables│     │  - String Strip (,)  │     │  - Star Schema View │
│  - Selective Read  │     │  - Geo Harmonization │     │  - OLAP Cube Marts  │
└────────────────────┘     └──────────────────────┘     └─────────────────────┘
```

### Rigorous Cleaning & Transformation Rules

| Step ID | Rule Name | Problem Statement | Execution Logic |
| :---: | :--- | :--- | :--- |
| **ETL-01** | Comma Stripping & Integer Casting | Text tables in Word documents contain numbers like `'1,279'` or `'347,130,399'`. | Apply regex `re.sub(r'[, ]', '', val)` and cast to standard 64-bit integer. Return `null` if string is non-numeric. |
| **ETL-02** | Geographic Harmonization | Mismatched spellings across files (`'Jammu & Kashmir'` vs `'Jammu and Kashmir'` vs `'Jammu & Kashmir UT'`). | Map all state names against an authoritative Master Geographic Alias Dictionary. Assign standardized `Geo_ID` and `State_Code`. |
| **ETL-03** | Historical Administrative Split | Ladakh was carved out of Jammu & Kashmir in 2019. Pre-2019 data lumps them together; post-2019 separates them. | Store Ladakh as a distinct entity with `Geo_ID`. In historical sheets where only combined rates exist, document with `Flag_Historical_Combined=True` rather than synthesizing synthetic splits. |
| **ETL-04** | Separation of Calculated Formulas | In `final_excel_updated.xlsx`, green cells contain Excel formulas (`=I2/J2*100`). | Read sheets with `openpyxl(data_only=True)` to extract computed numeric values, then verify computed results with automated Python integrity checks. |
| **ETL-05** | Handling Sparse Pediatric & District Data | Smaller registries have null cells for pediatric age-adjusted rates due to case counts $< 5$. | Do **not** impute zero. Store as `null` with a metadata attribute `Low_Sample_Suppressed=True` to prevent skewing rate averages. |
| **ETL-06** | Metric Classification Tagging | Mixing observed and projected numbers in the same column destroys query validity. | Every row loaded into `Fact_Cancer_Incidence` must carry a foreign key to `Dim_Measure_Type` (`Observed`, `ICMR_Extrapolated`, `Kumar_Projected`). |

---

## 5. Automated Data Validation & Integrity Checks

Before data is marked as ready for analysis, the ETL pipeline will execute an automated test suite:

1. **Summation & Additivity Check:**
   $$\sum \text{State Incident Cases} \approx \text{All-India Reported Total} \quad (\pm 0.5\% \text{ tolerance due to rounding})$$
   Any discrepancy exceeding $0.5\%$ triggers an ETL pipeline failure.
2. **Domain Boundary Constraints:**
   - Percentage shares must satisfy $0 \le \text{Share} \le 100$.
   - Rates per 100,000 must satisfy $\text{Crude Rate} > 0$ and $\text{AAR} > 0$.
   - Mortality-to-Incidence Ratio must satisfy $0.05 \le \text{MIR} \le 1.0$ (Cancer deaths cannot exceed total diagnosed incident cases in a standard surveillance epoch).
3. **Referential Integrity Constraints:**
   - Every `Geo_ID` in fact tables must resolve to an existing record in `Dim_Geography`.
   - Every `Site_ID` must resolve to `Dim_Cancer_Site`.
4. **No-Duplicate Primary Key Rule:**
   - Composite keys $(\text{Geo\_ID}, \text{Time\_ID}, \text{Site\_ID}, \text{Measure\_Type\_ID})$ must be strictly unique.

---

## 6. DWM Algorithms: Opportunities, Formulations & Limitations

To satisfy the academic objectives of the DWM course (PECE02T / PECE02P) without compromising scientific integrity, algorithms are mapped strictly to compatible data slices.

### 1. Simple & Multiple Linear Regression (Module 4)
- **Supported Problem:**
  - *Simple Regression:* Temporal trend of incidence over time: $\text{Cases}_t = \beta_0 + \beta_1 \cdot \text{Year}_t + \epsilon$.
  - *Multiple Regression:* Predicting state cancer incidence as a function of demographic and healthcare infrastructure moderators:
    $$\text{Incidence} = \beta_0 + \beta_1(\text{Population}) + \beta_2(\text{Urbanization}) + \beta_3(\text{Hospitals}) + \beta_4(\text{Oncologists}) + \epsilon$$
- **Evaluation Protocol:** Time-series train/test split (Train on 2019–2021, evaluate on 2022 observed data) using $R^2$, Mean Absolute Error (MAE), and Root Mean Squared Error (RMSE).
- **Limitations:** Limited longitudinal points (4 observed annual intervals); cannot capture non-linear biological mutation trends without wide confidence intervals.

### 2. Decision Tree Classifier (Module 4)
- **Supported Problem:** Classifying Indian states into **Healthcare Burden Tiers** (`High Burden`, `Moderate Burden`, `Controlled Burden`) or **Epidemiological Risk Profiles** (`Tobacco-Dominated`, `Hormone/Breast-Dominated`, `General Pattern`).
- **Input Features:** State population, urbanization %, tobacco-related cancer %, oncologist density index, screening rate per 10,000.
- **Evaluation Protocol:** Leave-One-Out Cross-Validation (LOOCV) or Stratified 5-Fold Cross-Validation, reporting Precision, Recall, F1-Score, and a Confusion Matrix.
- **Limitations & Ethical Guardrail:** This classifies **state-level public health capacity and burden**, **never** an individual patient's probability of having cancer.

### 3. Naïve Bayes Classifier (Module 4)
- **Supported Problem:** Probabilistic categorization of regional cancer profiles based on categorical attributes (e.g. Zone: `North/NE/South`, Dominant Cancer Site, Screening Coverage Category: `High/Low`).
- **Evaluation Protocol:** Compared directly against Decision Tree classification performance on the same test folds.
- **Limitations:** Assumes conditional independence between health infrastructure determinants, which is violated in practice (e.g., states with high cancer hospitals also have high oncologist density).

### 4. K-Means Clustering (Module 5)
- **Supported Problem:** Partitioning the 37 States/UTs into **Homogeneous Health Policy Clusters** for targeted governmental intervention.
- **Input Feature Vector:** Normalized vector: $[ \text{AAR}, \text{Mortality-to-Incidence Ratio}, \text{Tobacco Share \%}, \text{Cancer Bed Density} ]$.
- **Cluster Diagnostics:**
  - **Elbow Method:** Plotting Within-Cluster Sum of Squares (WCSS) across $k \in [2, 8]$.
  - **Silhouette Coefficient:** Quantifying cluster separation to empirically justify optimal $k$.
- **Limitations:** Sensitive to scale (requires Z-score standardization); sensitive to outliers (e.g., Mizoram and Kamrup Urban have extraordinarily high AAR due to local tobacco habits).

### 5. Agglomerative Hierarchical Clustering (Module 5)
- **Supported Problem:** Building a hierarchical taxonomy of cancer sites and state profiles based on epidemiological correlation.
- **Methodology:** Euclidean distance matrix with Ward's minimum variance linkage method.
- **Visualization:** A complete **Dendrogram** illustrating natural clusters (e.g. clustering lung, esophagus, and oral cavity together due to common tobacco etiology).

### 6. Association Rule Mining (Apriori Algorithm) (Module 6)
- **Supported Problem:** Discovering co-occurrence associations between high-prevalence cancer patterns and risk factors across states and demographic cohorts.
- **Transaction Framing:** Each "transaction" represents a State-Demographic Surveillance Profile with discretized attributes:
  $$\text{Transaction} = \{ \text{Region: North-East}, \text{Tobacco-Cancer-Share: High}, \text{Urbanization: Low}, \text{Leading-Site: Oral} \}$$
- **Evaluation Protocol:** Filtered by $\text{Minimum Support} \ge 15\%$, $\text{Minimum Confidence} \ge 60\%$, and $\text{Lift} > 1.2$.
- **Limitations:** Cannot be run on individual patient transactions because registries publish aggregated tabular statistics. Documented explicitly in the project report.

---

## 7. Phased Implementation Roadmap

```
Phase 1: Inspection & Governance      [COMPLETED]
   │
   ▼
Phase 2: ETL & Warehouse Schema Build [NEXT UPON APPROVAL]
   │  • Scripted ingestion from raw files to SQLite
   │  • Comma stripping, type casting, geo-harmonization
   │  • Creation of Star Schema & Snowflake views
   │  • Automated validation tests (sums, boundary rules)
   │
   ▼
Phase 3: Data Mining & Model Engineering
   │  • Regression modeling & evaluation (R², RMSE)
   │  • K-Means & Dendrogram clustering
   │  • Decision Tree & Naïve Bayes classification
   │  • Apriori association rule generation
   │
   ▼
Phase 4: Analytics Dashboard & OLAP Engine
   │  • Responsive multi-tab interface (MH-Crime-Intelligence inspiration)
   │  • Dynamic OLAP operations (Roll-up, Drill-down, Slice, Dice, Pivot)
   │  • Choropleth GIS Heatmap (WHO GLOBOCAN style)
   │
   ▼
Phase 5: Academic Report, Viva Documentation & Audit
      • DWM syllabus mapping evidence
      • Architectural diagrams (Star, Snowflake, Architecture)
      • Final evaluation write-up
```

---

## 8. Risks, Constraints & Unresolved Questions

### Identified Technical Risks
1. **Low Sample Sparsity in Small UTs:** Entities like Lakshadweep and Ladakh have tiny population baselines, resulting in zero or near-zero annual cases. Applying crude rates directly can produce erratic spikes.  
   *Mitigation:* Implement Bayesian rate smoothing or provide rate confidence intervals on the dashboard.
2. **Definitional Divergence Between NCRP and GLOBOCAN:** ICMR-NCRP projects $\approx 1.46\text{M}$ cases for 2022, while WHO GLOBOCAN estimates $1.56\text{M}$ for 2024.  
   *Mitigation:* Never merge them into a single continuous time series without explicit labeling. Present them on separate comparative tabs as national vs. international surveillance standards.
3. **Temporal Incommensurability:** Historical PBCR tables span 2012–2016 pooled data, while state forecasts span 2019–2045.  
   *Mitigation:* Retain time dimension keys with explicit surveillance epochs (`Baseline 2012-16` vs `Annual 2019-22`).

### Unresolved Decisions for User Approval
1. **Database Engine Choice for Data Warehouse:**
   - *Option A (Recommended):* **SQLite database file (`warehouse/cancer_dw.db`)**. Self-contained, zero-configuration, perfectly portable for academic viva submissions, and natively supported by Python and web frameworks.
   - *Option B:* **PostgreSQL**. Enterprise-grade relational server, but requires running background database services on the host machine.
2. **Dashboard Technology Stack:**
   - *Option A (Recommended):* **Python Flask / Streamlit with HTML5 + Tailwind + Plotly.js / Chart.js**. Directly aligns with the reference project ([MH-Crime-Intelligence](https://github.com/ShraddhaKokane49/MH-Crime-Intelligence)) while integrating seamlessly with Python machine learning pipelines.
   - *Option B:* **React / Next.js frontend with Python FastAPI backend**. Highly responsive, but requires separate Node.js build processes.

---

## 9. Deliverable Summary & Hold Directive

The implementation plan is documented in:
[`reports/5_refined_implementation_plan.md`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/reports/5_refined_implementation_plan.md)

**Phase 1 remains strictly enforced:**
- Zero original files have been altered or overwritten.
- No application or dashboard coding has begun.
- Execution is stopped. Awaiting user approval on this refined plan before initiating Phase 2 (ETL and Schema Creation).
