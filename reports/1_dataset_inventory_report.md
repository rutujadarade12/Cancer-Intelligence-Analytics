# TASK 1: DATASET INVENTORY REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Sem V CMPN  
**Inspection Date:** October 2026  
**Inspection Mode:** Read-Only Archive Inspection (No modifications, fake data, or overwrites)

---

## 1. Executive Summary & Archive Overview

The original dataset archive is located at:
`Data/Cancer Dataset.zip` (1,440,524 bytes / ~1.44 MB)

Inside this ZIP archive, there are **9 individual files** across 3 file formats (Excel `.xlsx`, Word `.docx`, and Portable Document Format `.pdf`):
1. `Cancer_Data_India_2019_2026_Concise.xlsx` (9,990 bytes)
2. `final excel.xlsx` (28,805 bytes)
3. `final_excel_with_pdf_data (1).xlsx` (73,268 bytes)
4. `final_excel_updated.xlsx` (212,441 bytes)
5. `Dataset 9.xlsx` (94,882 bytes)
6. `Dataset 5.docx` (21,246 bytes)
7. `Dataset 6.docx` (19,097 bytes)
8. `cancer dataset 4.pdf` (724,141 bytes)
9. `dataset 3.pdf` (616,397 bytes)

---

## 2. Granular Inventory of Every File

### File 1: `Cancer_Data_India_2019_2026_Concise.xlsx`
- **Format:** Microsoft Excel OpenXML Spreadsheet (`.xlsx`)
- **File Size:** 9,990 bytes
- **Source Documented:** ICMR-National Cancer Registry Programme (NCRP) & WHO GLOBOCAN Estimates, Parliamentary Data (MOHFW).
- **Sheets & Dimensions:**
  1. `National Cancer Overview`: 6 data rows, 9 columns. Contains national incidence and mortality figures (2019–2026).
  2. `Top Cancers by Organ Site`: 14 data rows, 10 columns. Cancer cases and shares by organ site (Breast, Lung, Oral Cavity, Cervix, etc.).
  3. `State-wise Incidence`: 18 data rows, 8 columns. A subset of Indian states with observed (2019–2022) and projected (2026) cases.
- **Data Types:** String (State/Cancer site), Numeric (Integer case counts, Floating percentages).
- **Missing / Inconsistent Values:** Only covers 18 states/UTs instead of all 36/37 Indian states and UTs.
- **Overlap & Redundancy:** This is an early condensed extract. All its contents exist with full national/state coverage in `final_excel_updated.xlsx` and `Dataset 9.xlsx`.

---

### File 2: `final excel.xlsx`
- **Format:** Microsoft Excel OpenXML Spreadsheet (`.xlsx`)
- **File Size:** 28,805 bytes
- **Source Documented:** Dileep Kumar, Navin Upadhyay, Himanshu Pandey (2026), *"State-wise forecasting of cancer incidence in India using a moderated exponential regression model incorporating healthcare system determinants"*, *International Journal of Community Medicine and Public Health (IJCMPH)*, 13(4):1867-1873.
- **Sheets & Dimensions:** 7 sheets total.
  1. `State-wise Incidence`: 38 data rows (37 States/UTs + All-India Total), 8 columns (`State/UT`, `2019 Observed`, `2020 Observed`, `2021 Observed`, `2022 Observed`, `Predicted 2026`, `Predicted 2030`, `Predicted 2045`).
  2. `Article Details`: 20 rows, 2 columns. Bibliographic and methodology metadata.
  3. `Summary & Findings`: 21 rows, 2 columns. Structured textual abstract and discussion from the paper.
  4. `Healthcare Moderators`: 7 rows, 3 columns. Descriptions of healthcare infrastructure moderators (A to E: Cancer hospitals, oncologists, radiotherapy, hospital beds, public health spending).
  5. `Model & Forecasts`: 9 rows, 2 columns. Mathematical formulation of moderated exponential regression model.
  6. `References`: 12 rows, 2 columns. Reference list from Kumar et al. (2026).
  7. `Full PDF Text`: 7 rows, 2 columns. Raw page-by-page text dump of `dataset 3.pdf`.
- **Data Types:** String/Text, Integer (observed cases), Float (projected cases).
- **Missing / Inconsistent Values:** None in numerical data. Complete 37 States/UTs panel.
- **Overlap & Redundancy:** This is the baseline forecasting dataset. Its entire contents are preserved verbatim in `final_excel_updated.xlsx` (as sheets S4) and `Dataset 9.xlsx`.

---

### File 3: `final_excel_with_pdf_data (1).xlsx`
- **Format:** Microsoft Excel OpenXML Spreadsheet (`.xlsx`)
- **File Size:** 73,268 bytes
- **Sheets & Dimensions:** 26 sheets.
- **Overview:** An intermediate consolidation attempt that added extracted sheets from the NCRP 2020/2022 reports and GLOBOCAN 2024 to the baseline `final excel.xlsx`.
- **Overlap & Redundancy:** Completely superseded by `final_excel_updated.xlsx` and `Dataset 9.xlsx`. Contains duplicate naming `(1)` indicating a working version.

---

### File 4: `final_excel_updated.xlsx`
- **Format:** Microsoft Excel OpenXML Spreadsheet (`.xlsx`)
- **File Size:** 212,441 bytes (Largest and most structured workbook)
- **Source Documented:** Explicitly cataloged in the `README` and `Source Documents` sheets:
  - **S1:** ICMR-NCDIR IJMR 2022 Report (*Cancer incidence estimates for 2022 & projection for 2025*).
  - **S2:** ICMR-NCDIR Maharashtra Cancer Factsheet 2021 (*Profile of Cancer and Related Factors - Maharashtra*).
  - **S3:** JCO Global Oncology 2020 Report (*Cancer Statistics, 2020: Report From National Cancer Registry Programme, India*).
  - **S4:** Kumar et al. 2026 (*State-wise forecasting of cancer incidence in India*).
- **Sheets (30 Sheets across 4 Subject Areas):**
  - **Guide & Validation (4 sheets):** `README`, `Source Documents`, `Key Findings (3 PDFs)`, `Cross-Validation`.
  - **State-wise & National Incidence (7 sheets):** `State-wise Incidence` (41 rows, 15 columns with regional classifications, CAGR, and population shares), `India Sites 2022` (56 rows, 19 cols), `India Sites 2020` (56 rows, 14 cols), `India Age-Sex Sites` (57 rows, 10 cols), `India Top10 Sites 2022` (21 rows, 8 cols), `India Trend 2015-2025` (18 rows, 10 cols), `India Age Structure` (21 rows, 7 cols).
  - **Registry & Clinical Surveillance (4 sheets):** `PBCR Incidence Table` (33 rows, 19 cols), `Tobacco-related Cancers` (33 rows, 10 cols), `Cancer Trends (APC)` (153 rows, 8 cols), `Clinical Stage` (15 rows, 11 cols).
  - **Methodology & Maharashtra Focus (7 sheets):** `Method Comparison` (7 rows, 4 cols), `MH PBCR Profile` (11 rows, 17 cols), `MH Childhood Cancer` (9 rows, 13 cols), `MH Sites & Tobacco` (29 rows, 6 cols), `MH Projections` (5 rows, 7 cols), `MH Socio-Health Profile` (17 rows, 7 cols), `MH Health Infrastructure` (15 rows, 5 cols).
  - **Research & Raw Extraction (8 sheets):** `Data Notes`, `Article Details`, `Summary & Findings`, `Healthcare Moderators`, `Model & Forecasts`, `References`, `Source References` (93 rows), `Full PDF Text` (43 rows).
- **Data Types:** High-fidelity alphanumeric codes, strings, integers, floating-point rates (Crude Rate, Age-Adjusted Rate AAR, APC), and percentages.
- **Missing / Inconsistent Values:** Handled with explicit notes (`N/A` where registries lack pediatric breakdowns). Header color coding separates primary empirical counts (blue) from calculated formulas (green).
- **Overlap & Redundancy:** Comprehensive master compilation.

---

### File 5: `Dataset 9.xlsx`
- **Format:** Microsoft Excel OpenXML Spreadsheet (`.xlsx`)
- **File Size:** 94,882 bytes
- **Sheets & Dimensions:** 30 sheets.
- **Distinctive Content:** Contains 5 unique sheets not present in `final_excel_updated.xlsx`:
  1. `GLOBOCAN 2024 by Site`: 35 rows, 11 cols (Incidence & Mortality for 35 primary cancer sites across India).
  2. `GLOBOCAN 2024 Top5 Sites`: 19 rows, 5 cols.
  3. `GLOBOCAN 2024 Summary`: 9 rows, 4 cols.
  4. `GLOBOCAN 2024 ASR`: 56 rows, 4 cols.
  5. `PBCR 2015-2019 (JAMA 2025)`: 59 registry rows, 17 cols.
  6. `India Sites 2024 Est (JAMA)`: 56 site rows, 18 cols.
  7. `Key Indicators 2019-2026`: 77 indicators across burden, mortality, and infrastructure.
  8. `NCRP State Est 2021-2025`: 39 states/UTs official ICMR projections.
- **Overlap & Redundancy:** Shares core sheets with `final_excel_updated.xlsx`, but includes additional WHO GLOBOCAN 2024 and JAMA Network 2025 empirical registry compilations.

---

### File 6: `Dataset 5.docx`
- **Format:** Microsoft Word Document (`.docx`)
- **File Size:** 21,246 bytes
- **Document Structure:** 1 Table with 39 rows and 11 columns.
- **Content:**
  - Table Columns: `State/UT`, `Incidence 2021`, `Incidence 2022`, `Incidence 2023`, `Incidence 2024`, `Incidence 2025`, `Deaths 2021`, `Deaths 2022`, `Deaths 2023`, `Deaths 2024`, `Deaths 2025`.
  - Source: Ministry of Health and Family Welfare (MOHFW), Government of India Parliamentary responses.
- **Data Types:** Strings formatted with comma separators (e.g. `'1,279'`).
- **Nature of File:** Standalone state-wise annual cancer incidence and mortality surveillance table.

---

### File 7: `Dataset 6.docx`
- **Format:** Microsoft Word Document (`.docx`)
- **File Size:** 19,097 bytes
- **Document Structure:** 9 Paragraphs and 7 Structured Tables.
- **Content:**
  - **Table 1:** Approved Tertiary Cancer Care Centers & State Cancer Institutes under MOHFW (Count: 19 SCIs, 20 TCCCs).
  - **Table 2:** National Non-Communicable Diseases (NP-NCD) Screening counts (Oral cancer: 347M screened; Breast cancer: 162M screened; Cervical cancer: 114M screened).
  - **Table 3:** Childhood Cancer National Estimates (2021–2025 new cases and deaths).
  - **Table 4:** Breast Cancer National Projections (2021–2025 new cases and deaths).
  - **Table 5:** State-wise Breast Cancer Cases and Deaths (10 High-Burden States: Maharashtra, UP, West Bengal, Tamil Nadu, Bihar, etc.).
  - **Table 6:** All-India Total Cancer Burden (2021: 1.426M cases, 789K deaths; 2025: 1.569M cases, 868K deaths).
  - **Table 7:** Metadata table of Parliamentary health datasets.
- **Nature of File:** Official healthcare screening, specialized organ-site surveillance (breast and childhood), and national oncology infrastructure data.

---

### File 8: `cancer dataset 4.pdf`
- **Format:** Portable Document Format (`.pdf`)
- **File Size:** 724,141 bytes
- **Pages:** 2 Pages.
- **Source:** International Agency for Research on Cancer (IARC) / World Health Organization (WHO) — **GLOBOCAN 2024 India Factsheet**.
- **Content:**
  - Page 1: Statistics at a glance (2024) for India. Population (1.45 Billion), New Cases (1,562,581), Cancer Deaths (901,828), 5-Year Prevalent Cases (3,324,140). Age-Standardized Incidence Rate (104.1/100k) and Mortality Rate (60.4/100k). Top 5 frequent cancers by sex (Males: Lip/oral cavity, Lung, Colorectum, Stomach, Prostate; Females: Breast, Cervix uteri, Lip/oral cavity, Ovary, Colorectum).
  - Page 2: Age-standardized rates breakdown and 35 individual site tables.
- **Nature of File:** Official international global benchmark dataset for India. (Transcribed in `Dataset 9.xlsx` sheets `GLOBOCAN 2024 Summary`, `GLOBOCAN 2024 Top5 Sites`, and `GLOBOCAN 2024 by Site`).

---

### File 9: `dataset 3.pdf`
- **Format:** Portable Document Format (`.pdf`)
- **File Size:** 616,397 bytes
- **Pages:** 7 Pages.
- **Source:** *International Journal of Community Medicine and Public Health (IJCMPH)*, Vol 13, Issue 4, April 2026.
- **Title:** *"State-wise forecasting of cancer incidence in India using a moderated exponential regression model incorporating healthcare system determinants"*.
- **Authors:** Dileep Kumar, Navin Upadhyay, Himanshu Pandey.
- **Content:** Full peer-reviewed research paper explaining the exponential forecasting mathematical model, the healthcare moderator indexes (A: Hospitals, B: Oncologists, C: Radiotherapy, D: Beds, E: Public health spend), and tabular forecasts for 37 States/UTs for 2019–2022, 2026, 2030, and 2045.
- **Nature of File:** Primary methodology and research paper document. Fully digitized into `final excel.xlsx`, `final_excel_updated.xlsx`, and `Dataset 9.xlsx`.

---

## 3. Summary Matrix of Archive Files

| File Name | Format | Primary Scope | Rows / Pages | Integration Status |
| :--- | :---: | :--- | :---: | :--- |
| `Cancer_Data_India_2019_2026_Concise.xlsx` | `.xlsx` | Preliminary summary (18 states) | 3 sheets | Subset / Redundant |
| `final excel.xlsx` | `.xlsx` | Kumar et al. (2026) forecasts | 7 sheets | Baseline model file |
| `final_excel_with_pdf_data (1).xlsx` | `.xlsx` | Intermediate merged draft | 26 sheets | Superseded |
| `final_excel_updated.xlsx` | `.xlsx` | Master integrated research database | 30 sheets | **Primary Recommended Base** |
| `Dataset 9.xlsx` | `.xlsx` | GLOBOCAN 2024 + JAMA registry data | 30 sheets | **Primary Complementary Base** |
| `Dataset 5.docx` | `.docx` | State-wise incidence & mortality (2021-2025) | 39 rows | Valuable integration source |
| `Dataset 6.docx` | `.docx` | Screening, infra, breast & child cancer | 7 tables | Specialized topic mart |
| `cancer dataset 4.pdf` | `.pdf` | WHO GLOBOCAN 2024 Factsheet | 2 pages | Source documentation (digitized) |
| `dataset 3.pdf` | `.pdf` | Research paper by Kumar et al. (2026) | 7 pages | Source documentation (digitized) |
