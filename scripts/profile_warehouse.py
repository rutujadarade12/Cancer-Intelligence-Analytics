"""
Comprehensive Warehouse Data Profiling Script
Cancer Intelligence & Analytics — Phase 3
Generates structural, statistical, distributional, data quality, and analytical readiness profiles.
"""

import sqlite3
import os
import json
import numpy as np
import pandas as pd

DB_PATH = os.path.join("warehouse", "cancer_dw.db")
OUTPUT_JSON_PATH = os.path.join("warehouse", "data_profiling_results.json")

def get_db_connection():
    return sqlite3.connect(DB_PATH)

def structural_profiling(conn):
    cur = conn.cursor()
    tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence' ORDER BY name").fetchall()
    table_names = [t[0] for t in tables]
    
    profile = {}
    for t in table_names:
        df = pd.read_sql_query(f"SELECT * FROM [{t}]", conn)
        col_info = cur.execute(f"PRAGMA table_info([{t}])").fetchall()
        
        columns = {}
        for c in col_info:
            cid, cname, ctype, notnull, dflt_value, pk = c
            col_series = df[cname] if cname in df.columns else pd.Series(dtype=object)
            columns[cname] = {
                "declared_type": ctype,
                "is_primary_key": bool(pk),
                "is_not_null": bool(notnull),
                "default_value": dflt_value,
                "total_count": int(len(col_series)),
                "null_count": int(col_series.isna().sum()),
                "distinct_count": int(col_series.nunique(dropna=True))
            }
        
        profile[t] = {
            "record_count": len(df),
            "column_count": len(col_info),
            "columns": columns
        }
    return profile

def statistical_profiling(conn):
    """Compute 5-number summary, mean, std, IQR for valid continuous numerical columns."""
    stats = {}
    
    numerical_targets = [
        ("Fact_State_Surveillance", ["incident_cases", "cagr_observed", "cagr_projected", "national_share_pct"]),
        ("Fact_Cancer_Incidence", ["incident_cases", "crude_rate", "age_adjusted_rate", "cumulative_risk_1_in_n", "deaths", "mortality_crude_rate"]),
        ("Fact_State_Mortality_Surveillance", ["reported_incidence", "reported_deaths", "mortality_incidence_ratio"]),
        ("Fact_PBCR_Surveillance", ["annual_cases", "crude_rate", "age_adjusted_rate", "cum_risk_1_in_n", "tobacco_share_pct"]),
        ("Fact_Clinical_Stage", ["localized_pct", "locoregional_pct", "distant_metastasis_pct", "unknown_extent_pct", "advanced_stage_pct"]),
        ("Fact_Cancer_Trends_APC", ["apc_percent"]),
        ("Fact_Screening_Programs", ["persons_screened", "cases_diagnosed", "cases_on_treatment", "detection_rate_per_100k", "treatment_retention_rate_pct"]),
        ("Fact_Healthcare_Infrastructure_National", ["facility_count"])
    ]
    
    for table, columns in numerical_targets:
        df = pd.read_sql_query(f"SELECT * FROM [{table}]", conn)
        stats[table] = {}
        for col in columns:
            if col not in df.columns:
                continue
            series = pd.to_numeric(df[col], errors='coerce').dropna()
            if len(series) == 0:
                stats[table][col] = {"status": "EMPTY_OR_NON_NUMERIC"}
                continue
            
            q1 = float(series.quantile(0.25))
            q2 = float(series.quantile(0.50))
            q3 = float(series.quantile(0.75))
            iqr = q3 - q1
            
            stats[table][col] = {
                "count": int(len(series)),
                "mean": round(float(series.mean()), 4),
                "std": round(float(series.std()), 4) if len(series) > 1 else 0.0,
                "min": round(float(series.min()), 4),
                "q1_25pct": round(q1, 4),
                "median_50pct": round(q2, 4),
                "q3_75pct": round(q3, 4),
                "max": round(float(series.max()), 4),
                "iqr": round(iqr, 4),
                "skewness": round(float(series.skew()), 4) if len(series) > 2 else 0.0
            }
    return stats

def distribution_profiling(conn):
    dist = {}
    
    # 1. State-level incidence distribution (2022 NCRP)
    df_state_2022 = pd.read_sql_query("""
        SELECT g.state_name, g.region_zone, f.incident_cases, f.national_share_pct
        FROM Fact_State_Surveillance f
        JOIN Dim_Geography g ON f.geo_id = g.geo_id
        WHERE f.time_id = 2022
        ORDER BY f.incident_cases DESC
    """, conn)
    dist["top_10_states_2022"] = df_state_2022.head(10).to_dict(orient="records")
    dist["bottom_5_states_2022"] = df_state_2022.tail(5).to_dict(orient="records")
    dist["regional_share_2022"] = df_state_2022.groupby("region_zone")["incident_cases"].sum().to_dict()
    
    # 2. Cancer Site distribution (Top sites 2022, Male vs Female)
    df_site_m = pd.read_sql_query("""
        SELECT s.site_name, f.incident_cases, f.crude_rate, f.age_adjusted_rate
        FROM Fact_Cancer_Incidence f
        JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
        WHERE f.time_id = 2022 AND f.gender = 'Male'
        ORDER BY f.incident_cases DESC LIMIT 5
    """, conn)
    df_site_f = pd.read_sql_query("""
        SELECT s.site_name, f.incident_cases, f.crude_rate, f.age_adjusted_rate
        FROM Fact_Cancer_Incidence f
        JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
        WHERE f.time_id = 2022 AND f.gender = 'Female'
        ORDER BY f.incident_cases DESC LIMIT 5
    """, conn)
    dist["top_5_male_sites_2022"] = df_site_m.to_dict(orient="records")
    dist["top_5_female_sites_2022"] = df_site_f.to_dict(orient="records")
    
    # 3. Organ System Distribution (GLOBOCAN 2024)
    df_organ = pd.read_sql_query("""
        SELECT o.system_name, SUM(f.incident_cases) as total_cases, SUM(f.deaths) as total_deaths
        FROM Fact_Cancer_Incidence f
        JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
        JOIN Dim_Organ_System o ON s.organ_system_id = o.organ_system_id
        WHERE f.time_id = 2024
        GROUP BY o.system_name
        ORDER BY total_cases DESC
    """, conn)
    dist["organ_systems_2024"] = df_organ.to_dict(orient="records")

    # 4. Temporal progression (National totals by year)
    df_temporal = pd.read_sql_query("""
        SELECT t.year, t.epoch_category, m.measure_code, SUM(f.incident_cases) as total_cases
        FROM Fact_State_Surveillance f
        JOIN Dim_Time t ON f.time_id = t.time_id
        JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id
        GROUP BY t.year, t.epoch_category, m.measure_code
        ORDER BY t.year
    """, conn)
    dist["temporal_state_progression"] = df_temporal.to_dict(orient="records")

    # 5. Registry Longitudinal APC distribution
    df_apc = pd.read_sql_query("""
        SELECT direction, COUNT(*) as count, AVG(apc_percent) as avg_apc, MIN(apc_percent) as min_apc, MAX(apc_percent) as max_apc
        FROM Fact_Cancer_Trends_APC
        GROUP BY direction
    """, conn)
    dist["apc_direction_summary"] = df_apc.to_dict(orient="records")
    
    return dist

def data_quality_profiling(conn):
    dq = {}
    cur = conn.cursor()
    
    # Outliers in State Incidence via 1.5*IQR rule
    df_state = pd.read_sql_query("SELECT incident_cases, geo_id FROM Fact_State_Surveillance WHERE time_id=2022", conn)
    q1 = df_state['incident_cases'].quantile(0.25)
    q3 = df_state['incident_cases'].quantile(0.75)
    iqr = q3 - q1
    upper_bound = q3 + 1.5 * iqr
    outlier_geos = df_state[df_state['incident_cases'] > upper_bound]
    
    outlier_names = []
    for _, row in outlier_geos.iterrows():
        name = cur.execute("SELECT state_name FROM Dim_Geography WHERE geo_id=?", (int(row['geo_id']),)).fetchone()[0]
        outlier_names.append({"state": name, "cases": float(row['incident_cases']), "threshold": round(upper_bound, 1)})
    
    dq["state_incidence_outliers_2022"] = {
        "upper_bound_iqr": round(upper_bound, 2),
        "outlier_count": len(outlier_names),
        "outliers": outlier_names,
        "justification": "Epidemiologically genuine high-population states (Uttar Pradesh, Maharashtra, West Bengal, Bihar, Tamil Nadu). Not data entry errors."
    }
    
    # Small number MIR artifacts
    df_mir = pd.read_sql_query("""
        SELECT g.state_name, m.time_id, m.reported_incidence, m.reported_deaths, m.mortality_incidence_ratio
        FROM Fact_State_Mortality_Surveillance m
        JOIN Dim_Geography g ON m.geo_id = g.geo_id
        WHERE m.reported_incidence < 10 OR m.mortality_incidence_ratio >= 0.8
    """, conn)
    dq["mir_small_number_artifacts"] = df_mir.to_dict(orient="records")
    
    # Incompatible unit checks
    dq["incompatible_units_safeguards"] = [
        {"fields": ["incident_cases", "crude_rate", "age_adjusted_rate"], "rule": "Never sum counts and rates directly."},
        {"fields": ["cagr_observed", "cagr_projected"], "rule": "Percentages; evaluate with median or weighted average, not unweighted sum."},
        {"fields": ["mortality_incidence_ratio"], "rule": "Ratio of deaths to incidence in single unidentified cancer cohort; not survival percentage."}
    ]
    
    return dq

def analytical_readiness_profiling():
    """Document readiness and methodological justification for each DWM syllabus task."""
    return {
        "regression": {
            "candidate_task": "State-level cancer incidence trend & forecast evaluation",
            "available_observations": "37 states x 7 time points (259 records in Fact_State_Surveillance)",
            "target_variable": "incident_cases",
            "feature_availability": ["state population proxy (rank/historic)", "baseline 2019 cases", "observed CAGR", "geographic region"],
            "data_limitations": "2019-2022 are model estimates; 2026-2045 are exponential forecasts. True ground-truth annual censuses do not exist for all 37 states.",
            "justification": "FEASIBLE as an econometric trend regression comparing Linear Regression vs Ridge vs Polynomial on state historical baseline to validate forecast trajectories. Must document that targets are model estimates.",
            "evaluation_metrics": ["MAE", "RMSE", "R2"]
        },
        "decision_tree": {
            "candidate_task": "State cancer burden categorization (Low, Moderate, High, Severe)",
            "available_observations": "37 states (cross-sectional 2022 panel)",
            "target_variable": "burden_tier (discretized by quartiles of 2022 incidence: Q1 < 5,800, Q2 5,800-24,000, Q3 24,000-72,000, Q4 > 72,000)",
            "feature_availability": ["observed CAGR", "mortality burden proxy", "region zone", "infrastructure tiers"],
            "data_limitations": "Small sample size (N=37). Risk of overfitting if tree depth > 3. Leave-One-Out or Stratified K-Fold (k=4) required.",
            "justification": "FEASIBLE with strict depth control (max_depth=3) and transparent quartile thresholds. Report confusion matrix, precision, recall.",
            "evaluation_metrics": ["Accuracy", "Macro F1-Score", "Confusion Matrix"]
        },
        "naive_bayes": {
            "candidate_task": "Probabilistic classification of cancer sites by primary risk attribution (Tobacco-Associated vs Non-Tobacco)",
            "available_observations": "76 cancer sites in Dim_Cancer_Site or 28 registries in Fact_PBCR_Surveillance",
            "target_variable": "is_tobacco_associated (Binary: 1 or 0)",
            "feature_availability": ["organ_system_id", "gender prevalence ratio", "age_adjusted_rate_tier"],
            "data_limitations": "Aggregated site statistics, not individual patient histories. GaussianNB or CategoricalNB appropriate.",
            "justification": "FEASIBLE for classifying site tobacco association based on epidemiological rate profiles. Document that this classifies cancer anatomical types, not individual patients.",
            "evaluation_metrics": ["Accuracy", "ROC-AUC", "F1-Score"]
        },
        "kmeans_clustering": {
            "candidate_task": "Multivariate epidemiological profiling of 37 Indian States/UTs",
            "available_observations": "37 states",
            "features": ["2022 incident cases (normalized)", "observed CAGR", "projected CAGR", "mortality-to-incidence ratio"],
            "data_limitations": "Outliers (UP, MH) skew unscaled data; StandardScaler mandatory. Optimal k evaluated via Silhouette Analysis and Elbow Method (k=3 to 5).",
            "justification": "HIGHLY FEASIBLE and clinically meaningful for identifying homogeneous healthcare burden clusters.",
            "evaluation_metrics": ["Silhouette Score", "Inertia (Elbow)"]
        },
        "hierarchical_clustering": {
            "candidate_task": "Agglomerative hierarchical clustering with Dendrogram across 37 States and 32 Registries",
            "available_observations": "37 states (state surveillance panel) and 28 registries (PBCR tobacco & rate vectors)",
            "features": ["standardized incidence, growth rates, and regional vectors"],
            "distance_linkage": "Euclidean distance with Ward linkage",
            "justification": "HIGHLY FEASIBLE. Produces a clear, readable dendrogram illustrating state and regional epidemiological clusters without overwhelming label clutter.",
            "evaluation_metrics": ["Cophenetic Correlation Coefficient"]
        },
        "apriori_association_mining": {
            "candidate_task": "Market-Basket / Co-occurrence Mining of High-Risk Cancer Epidemiological Attributes",
            "available_observations": "37 states or 76 sites discretized into categorical itemsets",
            "transaction_definition": "States represented as baskets of categorical healthcare attributes (e.g., {'High_Incidence', 'High_Observed_Growth', 'High_Mortality_Ratio', 'Region_NorthEast', 'High_Tobacco_Burden'})",
            "data_limitations": "Must discretize continuous metrics using statistically defensible quartile/median thresholds. Never fabricate fake transactions.",
            "justification": "FEASIBLE under defensible quantile discretization. Report Support, Confidence, and Lift.",
            "evaluation_metrics": ["Support", "Confidence", "Lift"]
        }
    }

def main():
    conn = get_db_connection()
    try:
        profile = {
            "structural_profiling": structural_profiling(conn),
            "statistical_profiling": statistical_profiling(conn),
            "distribution_profiling": distribution_profiling(conn),
            "data_quality_profiling": data_quality_profiling(conn),
            "analytical_readiness": analytical_readiness_profiling()
        }
        
        with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(profile, f, indent=2)
            
        print("Data profiling completed successfully. Artifact written to:", OUTPUT_JSON_PATH)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
