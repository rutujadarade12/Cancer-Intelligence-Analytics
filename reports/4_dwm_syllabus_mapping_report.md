# TASK 4: DWM SYLLABUS-TO-FEATURE MAPPING REPORT
**Project:** Cancer Intelligence and Analytics  
**Course:** Data Warehousing and Data Mining (DWM) — Professional Elective, Sem V CMPN  
**Syllabus Reference:** Autonomous DWM Academic Administration Plan (AAP 2026–27)  
**Inspection Date:** October 2026  
**Status:** Pedagogical & Technical Mapping (Phase 1 Inspection Only)

---

## 1. Course Context & Alignment Objective

The course **Data Warehousing & Mining (PECE02T / PECE02P)** covers 6 modules:
- **Module 1:** Introduction to Data Warehouse and ETL Process, Dimensional Modeling, OLAP Operations.
- **Module 2:** Introduction to Data Lakes, Architecture, Comparison with Data Warehouses.
- **Module 3:** Data Exploration, Preprocessing, The KDD Process, Visualization.
- **Module 4:** Classification (Decision Trees, Naïve Bayes) and Regression (Simple & Multiple Linear Regression).
- **Module 5:** Clustering (Partition-based: K-Means; Hierarchical: Agglomerative).
- **Module 6:** Frequent Pattern Mining and Association Rules (Apriori, FP-Growth concepts).

This report strictly evaluates which DWM concepts are **naturally supported** by our inspected cancer datasets, how they will be implemented, and explicitly flags which algorithms are inappropriate so that no technique is artificially forced onto unsuitable data.

---

## 2. Topic-by-Topic Syllabus Feature Mapping Table

| DWM Syllabus Topic | Module & CO | Supported by Dataset? | Proposed Project Feature & Technical Decision |
| :--- | :---: | :---: | :--- |
| **Data Warehouse & Data Mart** | Mod 1 (CO1, CO2) | **YES** | Multi-tier analytical storage: Central Cancer Intelligence Warehouse with specialized domain Data Marts: (1) State Surveillance Mart, (2) Organ Site & Epidemiology Mart, (3) Registry & Clinical Stage Mart, (4) Healthcare Infrastructure Mart. |
| **Star Schema vs. Snowflake Schema** | Mod 1 (CO2) | **YES** | Designed dimensional models: A central **Star Schema** centered on `Fact_Cancer_Incidence` connected to `Dim_Geography`, `Dim_Time`, and `Dim_Cancer_Site`. A normalized **Snowflake Schema** decomposing `Dim_Cancer_Site` into `Dim_Organ_System` and `Dim_ICD_Classification` to demonstrate dimensional normalization. |
| **ETL (Extract, Transform, Load)** | Mod 1 (CO2) | **YES** | Python-based automated ETL pipeline: Ingestion from disparate files (Excel, Word tables), transformation (de-duplication, string cleaning, rate computation, schema harmonization), and loading into structured warehouse tables (SQLite / Parquet warehouse). |
| **OLAP Operations** | Mod 1 (CO1) | **YES** | Interactive multi-dimensional OLAP engine on the dashboard: <br>• **Roll-up:** Aggregate district/PBCR registries $\rightarrow$ State $\rightarrow$ Geographical Zone (North/South/West/East/NE/Central) $\rightarrow$ All-India.<br>• **Drill-down:** National cancer total $\rightarrow$ Specific organ sites (Breast, Lung, Oral Cavity) $\rightarrow$ Sub-sites.<br>• **Slice:** Filter incidence specifically for Female breast cancer in 2024.<br>• **Dice:** Compare Lung vs. Oral cancer across Maharashtra and Uttar Pradesh for 2020–2025.<br>• **Pivot:** Transpose Cancer Sites along rows and Years (2019–2026) along columns. |
| **Data Lake Concepts** | Mod 2 (CO1, CO2) | **YES** | Documenting the two-tier Data Architecture: Storing raw, unstructured/semi-structured source files (raw PDF text extracts, research paper metadata, raw JSON/CSV) in a **Raw Data Lake Zone**, feeding into the structured **Curated Warehouse Zone**. |
| **KDD Process** | Mod 3 (CO1, CO3) | **YES** | Full documented 5-stage Knowledge Discovery in Databases pipeline: (1) Data Selection, (2) Preprocessing/Cleaning, (3) Transformation/Reduction, (4) Data Mining, (5) Pattern Interpretation & Evaluation. |
| **Data Preprocessing** | Mod 3 (CO3) | **YES** | Handling string numbers with commas, handling sparse registry cells, standardizing state naming variants, Min-Max feature scaling and Z-score standardization for machine learning models. |
| **Data Integration & Transformation** | Mod 3 (CO3) | **YES** | Merging state-wise epidemiological counts with demographic population census data, calculating Crude Incidence Rates, Age-Adjusted Rates (AAR), and Mortality-to-Incidence Ratios (MIR). |
| **Exploratory Data Analysis (EDA)** | Mod 3 (CO3) | **YES** | Statistical summary of distributions (mean, median, interquartile range, standard deviation, skewness across states and cancer organ sites). |
| **Visualization** | Mod 3 (CO3) | **YES** | Interactive charts matching WHO GLOBOCAN & MH-Crime-Intelligence style: Choropleth state heatmap of India, time-series projection line charts, demographic population pyramids, and site share bar charts. |
| **Linear Regression** | Mod 4 (CO3, CO4) | **YES** | **Simple Linear Regression:** Time-series trend modeling of cancer incidence over years (2019–2026).<br>**Multiple Linear Regression:** Predicting state cancer incidence based on population, urbanization percentage, and healthcare infrastructure moderators (hospitals, oncologists, beds) as validated in Kumar et al. (2026). |
| **Decision Tree** | Mod 4 (CO1, CO4) | **YES** | Decision Tree Classifier predicting **Cancer Burden Risk Tier** (High / Moderate / Low) or **Epidemiological Risk Dominance** (Tobacco-dominant vs. Non-tobacco vs. Hormone-related) using demographic, urbanization, and geographic predictors. Generates interpretable IF-THEN clinical policy rules. |
| **Naive Bayes** | Mod 4 (CO1, CO4) | **YES** | Probabilistic Naive Bayes classification to categorize Indian states and registries into Risk Profiles based on categorical attributes (Zonal Region, Urban/Rural Dominance, Tobacco Share Category). |
| **K-Means Clustering** | Mod 5 (CO3, CO4) | **YES** | Unsupervised clustering of Indian States / Registries into homogeneous healthcare action clusters based on: Incidence Rate, Mortality Ratio, Tobacco-attributable cancer share, and Healthcare Moderator density. Determines optimal $k$ using the **Elbow Method** and **Silhouette Score**. |
| **Hierarchical Clustering** | Mod 5 (CO3, CO4) | **YES** | Agglomerative Hierarchical Clustering with **Dendrogram visualization** showing natural epidemiological clustering of cancer sites and state profiles using Ward’s linkage and Euclidean distance. |
| **Association Rule Mining** | Mod 6 (CO1, CO3, CO5) | **YES (Carefully Framed)** | Co-occurrence and pattern mining across multi-site cancer profiles, risk factors, and registry characteristics (e.g., $\{High\,Tobacco\,Share, Urban\} \Rightarrow \{High\,Oral\,Cancer\}$ or co-occurring secondary cancer sites). Discovers rules using Support, Confidence, and Lift. |
| **Model Evaluation** | Mod 6 (CO5) | **YES** | Rigorous evaluation metrics: $R^2$, RMSE, and MAE for Regression; Accuracy, Precision, Recall, F1-Score, and Confusion Matrix for Classification; Silhouette Coefficient and Davies-Bouldin index for Clustering. |

---

## 3. Important Technical Decisions Explained in Simple Terms

1. **Why use both Star Schema and Snowflake Schema?**
   - In a **Star Schema**, all dimension tables directly touch the central fact table. It is fast to query and easy for dashboards.
   - In a **Snowflake Schema**, complex dimensions are split into sub-tables (normalized), saving space and avoiding duplicate category names. In our project, we use Star Schema as the primary warehouse structure, and provide a normalized Snowflake diagram for the organ site hierarchy to demonstrate both syllabus concepts clearly to the examiner.
2. **Why Regression fits this dataset naturally:**
   - The dataset contains historical records (2019–2022) and forecasted years (2026, 2030, 2045) alongside healthcare moderators (hospitals, beds, doctors). Linear and Multiple Regression can be demonstrated mathematically with real epidemiological parameters.
3. **How Association Rule Mining will be adapted:**
   - Association rule mining usually looks at "market baskets" (items bought together in a supermarket). Because public cancer registries report aggregate statistics rather than individual patient shopping baskets, we will formulate association baskets by binned risk factors and high-prevalence cancer profiles across Indian states and demographic strata (e.g., `{Tobacco use > 35%, Urban > 60%} -> {High Head & Neck Cancer}`). This avoids generating artificial fake patient records while still demonstrating the Apriori algorithm authentically.

---

## 4. Phase 1 Verification Summary

All 4 reports are saved in the project's [`reports/`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/reports) directory:
1. [`1_dataset_inventory_report.md`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/reports/1_dataset_inventory_report.md)
2. [`2_data_quality_report.md`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/reports/2_data_quality_report.md)
3. [`3_recommended_dataset_selection_report.md`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/reports/3_recommended_dataset_selection_report.md)
4. [`4_dwm_syllabus_mapping_report.md`](file:///c:/Users/ACER/OneDrive/Desktop/Cancer-Intelligence-Analytics/reports/4_dwm_syllabus_mapping_report.md)

No original files were modified, no fake data was generated, and dashboard coding has not been started, adhering strictly to the **Phase 1: Inspection Only** mandate.
