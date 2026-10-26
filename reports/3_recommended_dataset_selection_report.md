# TASK 3: RECOMMENDED DATASET SELECTION REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Inspection Date:** October 2026  
**Status:** Strategy & Architecture Recommendations (Phase 1 Inspection Only)

---

## 1. Primary Dataset Recommendation

### **Recommended Primary Core: `final_excel_updated.xlsx`**
After conducting a full structural and cell-level audit of all 9 files, **`final_excel_updated.xlsx` is unequivocally recommended as the Primary Dataset** for the Cancer Intelligence and Analytics Data Warehouse.

### **Why `final_excel_updated.xlsx` is the Best Choice:**
1. **Highest Structural Maturity & Breadth:** It contains 30 carefully structured sheets combining empirical observational records, peer-reviewed regression model forecasts, and official ICMR/NCRP registry bulletins.
2. **Built-in Cross-Validation & Metadata:** It features a documented `README`, bibliographic references for all source studies (`Source Documents`), and a dedicated `Cross-Validation` audit sheet reconciling state totals against national estimates.
3. **Comprehensive Geographic Granularity:** It provides a 37-entity state and union territory panel with regional zones (North, South, East, West, North-East, Central), urban/rural demographic splits, and compound annual growth rates (CAGR).
4. **Multi-Dimensional Analytical Scope:** It supports multi-dimensional analysis across Time (2012 to 2045), Geography (National, State, PBCR registry district), Demographics (Age groups, Gender), and Etiology (35+ Primary Organ Cancer Sites, Tobacco-attributable fractions).

---

## 2. Integrated Auxiliary Datasets (What to Combine)

To enrich the Data Warehouse beyond general state incidence, the following files should be extracted and ingested into specialized Data Marts:

### 1. `Dataset 9.xlsx` (Selected Specialized Sheets Only)
- **Sheets to Ingest:**
  - `GLOBOCAN 2024 by Site`: Adds the authoritative WHO global benchmark for 35 cancer sites, including mortality counts and cumulative lifetime risk.
  - `PBCR 2015-2019 (JAMA 2025)`: Adds recent district-level registry data published in JAMA Oncology, giving high-resolution local surveillance.
  - `Key Indicators 2019-2026`: Adds 77 benchmark health indicators for high-level KPI cards on the dashboard.
- **Why Merge:** These sheets expand the warehouse schema without introducing duplicate rows because they cover distinct dimensions (WHO Global Standard & District Registries).

### 2. `Dataset 6.docx` (Screening & Infrastructure Mart)
- **Tables to Ingest:**
  - `Table 1`: Approved State Cancer Institutes (19) and Tertiary Care Cancer Centres (20).
  - `Table 2`: National NP-NCD Screening figures (Oral: 347M, Breast: 162M, Cervical: 114M) and diagnosis/treatment conversion rates.
  - `Table 3 & 4`: Specialized national estimates for Childhood Cancer and Breast Cancer (2021–2025).
- **Why Merge:** This connects cancer surveillance directly to healthcare capacity and early detection infrastructure, which is a major analytical objective of the project.

### 3. `Dataset 5.docx` (Mortality Ratio Mart)
- **Table to Ingest:** State-wise annual incidence and mortality table (2021–2025).
- **Why Merge:** Allows computing the **Mortality-to-Incidence Ratio (MIR)** per state over time, an internationally recognized proxy for healthcare system efficacy and survival rates.

---

## 3. Files to Remain Separate or Keep as Documentation

1. **`cancer dataset 4.pdf` & `dataset 3.pdf`:**
   - **Recommendation:** Keep as **Documentation and Metadata Reference**.
   - **Reason:** Both documents are already 100% extracted, transcribed, and structured inside `Dataset 9.xlsx` and `final_excel_updated.xlsx`. Extracting them again from PDF binaries would introduce PDF-parsing errors and unnecessary complexity.
2. **`Dataset 6.docx` (Narrative Sections & Explanatory Text):**
   - Keep the policy text and scheme descriptions as descriptive metadata rather than loading them as tabular facts.

---

## 4. Redundant / Superseded Files (Safe to Exclude from ETL)

The following files represent earlier drafts and intermediate working copies. They should remain in the original archive for archival integrity but **must be excluded from the ETL data pipeline**:
- `final excel.xlsx` (superseded by `final_excel_updated.xlsx`)
- `final_excel_with_pdf_data (1).xlsx` (redundant intermediate draft)
- `Cancer_Data_India_2019_2026_Concise.xlsx` (18-state truncated subset)

---

## 5. Cleaning and Transformation Roadmap (Planned for Phase 2)

When user approval is granted for Phase 2, the following ETL pipeline steps are planned:

```
[Raw Excel / DOCX Extracted Tables]
                 │
                 ▼
      [Step 1: Ingestion & Filter]
      - Select final_excel_updated.xlsx + Dataset 9.xlsx (GLOBOCAN/JAMA) + DOCX tables
      - Discard 3 duplicate/draft workbooks
                 │
                 ▼
     [Step 2: String & Type Cleaning]
      - Remove commas from Word strings ('1,279' -> 1279)
      - Cast numeric types (int64 for cases, float64 for rates/percentages)
      - Standardize null representations (replace blank / 'NA' with standard NaN / null)
                 │
                 ▼
  [Step 3: Geographic & Key Standardization]
      - Build unified Dim_State table (State_ID, State_Name, ISO, Zone/Region)
      - Harmonize naming ('Jammu & Kashmir' vs 'Jammu and Kashmir', merge UT variants)
                 │
                 ▼
   [Step 4: Dimensional Warehouse Schema]
      - Populate Fact Tables (Fact_Cancer_Incidence, Fact_Registry_Surveillance, Fact_Infrastructure)
      - Populate Dimension Tables (Dim_State, Dim_Time, Dim_Cancer_Site, Dim_Demographics)
```
