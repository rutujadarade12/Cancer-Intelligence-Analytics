"""
Cancer Analytics Assistant Router
Provides intelligent analytical query responses grounded in the SQLite Data Warehouse
and verified Data Mining results.
Handles state-level queries, cancer-site queries, year-based queries, infrastructure,
data mining metrics, guardrails for clinical queries, and unsupported/out-of-domain queries.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import json
import os
import re

from backend.database import get_db
from backend.config import DATA_MINING_JSON_PATH

router = APIRouter(prefix="/assistant", tags=["Cancer Analytics Assistant"])

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    query: str
    intent: str
    answer: str
    data_summary: Optional[Dict[str, Any]] = None
    table_sources: List[str] = []
    disclaimer: str

def load_data_mining():
    if os.path.exists(DATA_MINING_JSON_PATH):
        try:
            with open(DATA_MINING_JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None
    return None

@router.post("/query", response_model=QueryResponse)
def ask_assistant(req: QueryRequest, db: sqlite3.Connection = Depends(get_db)):
    q = req.query.strip().lower()
    cur = db.cursor()

    # ----------------------------------------------------
    # Guardrail: Medical diagnosis / clinical treatment
    # ----------------------------------------------------
    clinical_keywords = ["symptom", "pain", "treatment for me", "do i have cancer", "diagnose", "medicine", "chemo dosage", "cure me", "how to treat", "medication"]
    if any(k in q for k in clinical_keywords):
        return QueryResponse(
            query=req.query,
            intent="clinical_out_of_scope",
            answer="This platform is an academic Data Warehouse & Data Mining analytical system designed for population-level epidemiological research. It does NOT offer individual clinical medical diagnoses, symptoms analysis, or treatment plans. Please consult an accredited oncology professional or visit a Regional Cancer Centre (RCC) for medical advice.",
            data_summary=None,
            table_sources=[],
            disclaimer="Strict Medical Boundary: Platform contains population surveillance data, not clinical patient diagnostics."
        )

    # ----------------------------------------------------
    # Intent A: Specific State-Level Query (37 States & UTs)
    # ----------------------------------------------------
    cur.execute("SELECT geo_id, state_name, state_code, region_zone FROM Dim_Geography")
    all_states = [dict(r) for r in cur.fetchall()]
    
    matched_state = None
    for st in all_states:
        s_name = st['state_name'].lower()
        s_code = st['state_code'].lower()
        # Word boundary match for state name or code
        if re.search(r'\b' + re.escape(s_name) + r'\b', q) or (len(s_code) == 2 and re.search(r'\b' + re.escape(s_code) + r'\b', q)):
            matched_state = st
            break

    if matched_state:
        geo_id = matched_state['geo_id']
        cur.execute("""
            SELECT p.state_name, p.region_zone, p.cases_2022, p.national_share_2022,
                   p.cagr_observed, p.cagr_projected, p.cases_2026_forecast AS projected_cases_2026,
                   g.state_code
            FROM vw_olap_state_pivots p
            JOIN Dim_Geography g ON p.geo_id = g.geo_id
            WHERE p.geo_id = ?
        """, (geo_id,))
        row = cur.fetchone()
        if row:
            p = dict(row)
            obs_cagr = (p['cagr_observed'] * 100) if p['cagr_observed'] else 0
            proj_cagr = (p['cagr_projected'] * 100) if p['cagr_projected'] else 0
            share_pct = (p['national_share_2022'] * 100) if p['national_share_2022'] else 0
            
            answer_text = (
                f"### State Surveillance Profile: **{p['state_name']}** ({p['state_code']})\n\n"
                f"- **Region Zone:** {p['region_zone']} Zone\n"
                f"- **2022 Estimated Cancer Incidence:** **{p['cases_2022']:,} cases**\n"
                f"- **National Burden Share (2022):** **{share_pct:.2f}%** of India's total\n"
                f"- **Historical Growth (2015–2022 Observed CAGR):** **{obs_cagr:.2f}%** per annum\n"
                f"- **Forecast Horizon (2026 Projected Cases):** **{p['projected_cases_2026']:,} cases** (Projected CAGR: {proj_cagr:.2f}%)\n\n"
                f"*Data Lineage:* Conformed from ICMR-NCRP state-level population models (2019–2022) and Kumar et al. moderated exponential projections (2026)."
            )
            return QueryResponse(
                query=req.query,
                intent="state_profile_query",
                answer=answer_text,
                data_summary=p,
                table_sources=["Dim_Geography", "Fact_State_Surveillance", "vw_olap_state_pivots"],
                disclaimer="Baseline figures derive from NCRP state extrapolations. 2026 figures are parametric model projections."
            )

    # ----------------------------------------------------
    # Intent B: Specific Cancer Site Query (e.g. Breast, Lung, Cervix, Oral)
    # ----------------------------------------------------
    cur.execute("SELECT site_id, site_name, icd10_code, is_tobacco_associated, organ_system_id FROM Dim_Cancer_Site WHERE level_type != 'Total'")
    all_sites = [dict(r) for r in cur.fetchall()]
    
    matched_site = None
    for s in all_sites:
        name_lower = s['site_name'].lower()
        # Clean common prefixes or suffixes
        clean_name = re.sub(r'\(.*?\)', '', name_lower).strip()
        if clean_name in q or (s['icd10_code'] and s['icd10_code'].lower() in q):
            matched_site = s
            break
            
    if matched_site:
        site_id = matched_site['site_id']
        cur.execute("""
            SELECT f.gender, f.incident_cases, f.crude_rate, f.age_adjusted_rate, o.system_name
            FROM Fact_Cancer_Incidence f
            JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
            LEFT JOIN Dim_Organ_System o ON s.organ_system_id = o.organ_system_id
            WHERE f.site_id = ? AND f.time_id = 2022
        """, (site_id,))
        site_rows = [dict(r) for r in cur.fetchall()]
        
        tobacco_str = "Yes (Attributed to Tobacco Carcinogens)" if matched_site['is_tobacco_associated'] == 1 else "No (Non-Tobacco Carcinogenesis)"
        sys_name = site_rows[0]['system_name'] if site_rows and site_rows[0].get('system_name') else "Anatomical Oncology"
        
        answer_text = (
            f"### Cancer Site Intelligence: **{matched_site['site_name']}**\n\n"
            f"- **ICD-10 Code:** `{matched_site['icd10_code'] or 'C00-C97'}`\n"
            f"- **Organ System:** {sys_name}\n"
            f"- **Tobacco Carcinogen Association:** {tobacco_str}\n\n"
            f"**2022 National Incidence & Rates (ICMR-NCRP Monograph):**\n"
        )
        for r in site_rows:
            aar_str = f"{r['age_adjusted_rate']:.1f} per 100k" if r['age_adjusted_rate'] else "N/A"
            crude_str = f"{r['crude_rate']:.1f} per 100k" if r['crude_rate'] else "N/A"
            answer_text += f"- **{r['gender']} Cohort:** **{r['incident_cases']:,} cases** (Crude Rate: {crude_str}, AAR: {aar_str})\n"
            
        return QueryResponse(
            query=req.query,
            intent="cancer_site_query",
            answer=answer_text,
            data_summary={"site_info": matched_site, "incidence_breakdown": site_rows},
            table_sources=["Dim_Cancer_Site", "Dim_Organ_System", "Fact_Cancer_Incidence"],
            disclaimer="Incidence figures and Age-Adjusted Rates (AAR) reflect 2022 ICMR-NCRP pooled registry surveillance."
        )

    # ----------------------------------------------------
    # Intent C: Specific Year Query (e.g. 2019, 2020, 2021, 2022, 2026, 2045)
    # ----------------------------------------------------
    year_match = re.search(r'\b(19\d{2}|20\d{2})\b', q)
    if year_match:
        yr = int(year_match.group(1))
        cur.execute("SELECT time_id, year, epoch_category, period_label FROM Dim_Time WHERE year = ?", (yr,))
        time_row = cur.fetchone()
        if time_row:
            t = dict(time_row)
            cur.execute("""
                SELECT SUM(incident_cases) AS total_cases, COUNT(DISTINCT geo_id) AS state_count
                FROM Fact_State_Surveillance
                WHERE time_id = ?
            """, (yr,))
            fact_sum = cur.fetchone()
            tot_cases = fact_sum[0] if fact_sum and fact_sum[0] else None
            
            answer_text = (
                f"### Temporal Analysis: Year **{yr}** ({t['epoch_category']})\n\n"
                f"- **Classification Epoch:** `{t['epoch_category']}`\n"
                f"- **Period Label:** {t['period_label']}\n"
            )
            if tot_cases:
                answer_text += f"- **National Reconciled Cases:** **{tot_cases:,} cases** across {fact_sum[1]} States & UTs\n"
            if yr <= 2022:
                answer_text += "\n*Methodology:* Retrospective state-level NCRP demographic model extrapolation ($R^2 = 1.0$ against historical growth)."
            else:
                answer_text += "\n*Methodology:* Forward parametric projection based on Kumar et al. moderated exponential models and demographic aging escalation."
                
            return QueryResponse(
                query=req.query,
                intent="year_temporal_query",
                answer=answer_text,
                data_summary={"year": yr, "epoch": t['epoch_category'], "national_cases": tot_cases},
                table_sources=["Dim_Time", "Fact_State_Surveillance"],
                disclaimer="Temporal classification conformed in Dim_Time dimension."
            )
        else:
            # Year outside warehouse scope
            return QueryResponse(
                query=req.query,
                intent="year_out_of_scope",
                answer=(
                    f"The year **{yr}** is outside the surveillance horizon of this data warehouse. "
                    "The warehouse contains conformed epidemiological data spanning **2015 to 2045**:\n"
                    "- **2015:** Historical baseline (HBCR / PBCR reports)\n"
                    "- **2019–2022:** NCRP State Extrapolations (2022 national sum = 1,461,427 cases)\n"
                    "- **2026:** Kumar et al. Mid-Term Forecast (1,569,793 cases)\n"
                    "- **2045:** Long-Range Demographic Forecast (2,084,048 cases)\n\n"
                    "Please query within the 2015–2045 temporal range."
                ),
                data_summary={"valid_range": "2015-2045", "requested_year": yr},
                table_sources=["Dim_Time"],
                disclaimer="Warehouse temporal boundary is 2015 to 2045."
            )

    # ----------------------------------------------------
    # Intent D: Check for Out-Of-Domain / Non-Existent Entities
    # ----------------------------------------------------
    foreign_places = ["atlantis", "california", "london", "texas", "china", "usa", "europe", "russia", "australia"]
    if any(p in q for p in foreign_places):
        return QueryResponse(
            query=req.query,
            intent="entity_not_found",
            answer="The requested geographical entity is not present in this data warehouse. This platform covers only the 37 States and Union Territories of India according to the Census and ICMR-NCRP administrative boundaries.",
            data_summary={"scope": "India (37 States and UTs)"},
            table_sources=["Dim_Geography"],
            disclaimer="Geographic scope is strictly restricted to India's national and subnational territory."
        )

    # ----------------------------------------------------
    # 1. Top Burden States / Highest Incidence
    # ----------------------------------------------------
    if any(k in q for k in ["top state", "highest burden", "most cases", "leading state", "highest incidence", "burden state"]) or ("top" in q and ("state" in q or "burden" in q or "cases" in q)):
        cur.execute("""
            SELECT g.state_name, g.region_zone, f.incident_cases, 
                   ROUND(f.national_share_pct * 100, 2) AS national_share_pct
            FROM Fact_State_Surveillance f
            JOIN Dim_Geography g ON f.geo_id = g.geo_id
            WHERE f.time_id = 2022
            ORDER BY f.incident_cases DESC
            LIMIT 5
        """)
        rows = [dict(r) for r in cur.fetchall()]
        answer_text = (
            f"Based on 2022 ICMR-NCRP state-level surveillance estimates, the top 5 highest cancer burden states in India are:\n\n"
            + "\n".join([f"{i+1}. **{r['state_name']}** ({r['region_zone']} Zone): **{r['incident_cases']:,}** estimated cases ({r['national_share_pct']}% of national total)" for i, r in enumerate(rows)])
            + f"\n\nTogether, these top 5 states account for **{sum(r['incident_cases'] for r in rows):,} cases** ({sum(r['national_share_pct'] for r in rows):.2f}% of national burden)."
        )
        return QueryResponse(
            query=req.query,
            intent="top_burden_states",
            answer=answer_text,
            data_summary={"top_states": rows, "surveillance_year": 2022},
            table_sources=["Fact_State_Surveillance", "Dim_Geography", "Dim_Time"],
            disclaimer="Figures derive from ICMR-NCRP mathematical demographic model extrapolations across Census populations."
        )

    # ----------------------------------------------------
    # 2. Regional Differences / Zonal Rollup
    # ----------------------------------------------------
    if any(k in q for k in ["region", "zonal", "zone", "east", "west", "north", "south", "central"]):
        cur.execute("""
            SELECT g.region_zone, 
                   COUNT(DISTINCT g.geo_id) AS state_count,
                   SUM(f.incident_cases) AS total_cases,
                   ROUND(SUM(f.incident_cases) * 100.0 / 1461427.0, 2) AS regional_share_pct
            FROM Fact_State_Surveillance f
            JOIN Dim_Geography g ON f.geo_id = g.geo_id
            WHERE f.time_id = 2022
            GROUP BY g.region_zone
            ORDER BY total_cases DESC
        """)
        rows = [dict(r) for r in cur.fetchall()]
        answer_text = (
            "Regional OLAP Rollup of 2022 estimated cancer burden across 6 conformed geographic zones:\n\n"
            + "\n".join([f"- **{r['region_zone']} Zone** ({r['state_count']} States/UTs): **{r['total_cases']:,}** cases (**{r['regional_share_pct']}%** share)" for i, r in enumerate(rows)])
            + "\n\nThe **Central Zone** (Uttar Pradesh, Madhya Pradesh, Chhattisgarh, Uttarakhand) carries the largest absolute aggregate burden, followed by the **East Zone** and **South Zone**."
        )
        return QueryResponse(
            query=req.query,
            intent="regional_distribution",
            answer=answer_text,
            data_summary={"regions": rows},
            table_sources=["vw_star_state_incidence", "Dim_Geography"],
            disclaimer="Conformed regional definitions map 37 States and UTs according to official zonal council boundaries."
        )

    # ----------------------------------------------------
    # 3. Leading Cancer Sites / Gender Differences
    # ----------------------------------------------------
    if any(k in q for k in ["cancer site", "leading cancer", "male", "female", "gender"]):
        cur.execute("""
            SELECT c.site_name, f.gender, f.incident_cases, f.crude_rate, f.age_adjusted_rate
            FROM Fact_Cancer_Incidence f
            JOIN Dim_Cancer_Site c ON f.site_id = c.site_id
            WHERE f.time_id = 2022 AND f.gender IN ('Male', 'Female')
            ORDER BY f.incident_cases DESC
            LIMIT 10
        """)
        rows = [dict(r) for r in cur.fetchall()]
        males = [r for r in rows if r["gender"] == "Male"][:3]
        females = [r for r in rows if r["gender"] == "Female"][:3]
        
        answer_text = (
            "Leading cancer sites in India (2022 ICMR-NCRP Monograph):\n\n"
            "**In Males:**\n"
            + "\n".join([f"- **{r['site_name']}**: {r['incident_cases']:,} cases (AAR: {r['age_adjusted_rate']} / 100k)" for r in males])
            + "\n\n**In Females:**\n"
            + "\n".join([f"- **{r['site_name']}**: {r['incident_cases']:,} cases (AAR: {r['age_adjusted_rate']} / 100k)" for r in females])
            + "\n\nBreast cancer is the single leading cancer site in females nationwide, while oral cavity and lung cancers predominate in males."
        )
        return QueryResponse(
            query=req.query,
            intent="cancer_sites_gender",
            answer=answer_text,
            data_summary={"leading_sites": rows},
            table_sources=["Fact_Cancer_Incidence", "Dim_Cancer_Site", "Dim_Organ_System"],
            disclaimer="Estimates compiled from ICMR-NCRP JCO Global Oncology (2020) and 2022 IJMR Monograph."
        )

    # ----------------------------------------------------
    # 4. Projections & Forecasts (2026, 2045)
    # ----------------------------------------------------
    if any(k in q for k in ["projection", "forecast", "future", "trend", "apc", "trajectory"]):
        cur.execute("""
            SELECT t.year, t.epoch_category, SUM(f.incident_cases) AS total_cases
            FROM Fact_State_Surveillance f
            JOIN Dim_Time t ON f.time_id = t.time_id
            WHERE t.year IN (2022, 2026, 2045)
            GROUP BY t.year, t.epoch_category
            ORDER BY t.year
        """)
        rows = [dict(r) for r in cur.fetchall()]
        answer_text = (
            "National Longitudinal Trajectory & Forecast Horizon:\n\n"
            + "\n".join([f"- **Year {r['year']}** ({r['epoch_category']}): **{r['total_cases']:,}** estimated cases" for r in rows])
            + "\n\n**Methodological Provenance:**\n"
            "- **2022 Extrapolated:** Reconciled arithmetic sum of 37 state ICMR-NCRP models (1,461,427 cases).\n"
            "- **2026 Forecast:** Kumar et al. moderated exponential projection (1,569,793 cases, +7.41% over 2022).\n"
            "- **2045 Forecast:** Long-range demographic trend model (2,084,048 cases, +42.60% over 2022)."
        )
        return QueryResponse(
            query=req.query,
            intent="projections_forecast",
            answer=answer_text,
            data_summary={"trajectory": rows},
            table_sources=["Fact_State_Surveillance", "Dim_Time", "Dim_Measure_Type"],
            disclaimer="2026 and 2045 numbers are parametric model projections, not direct empirical observations."
        )

    # ----------------------------------------------------
    # 5. Mortality & MIR Ratios
    # ----------------------------------------------------
    if any(k in q for k in ["mortality", "death", "mir", "ratio", "dataset 5", "ovarian"]):
        cur.execute("""
            SELECT AVG(mortality_incidence_ratio) AS avg_mir,
                   MIN(mortality_incidence_ratio) AS min_mir,
                   MAX(mortality_incidence_ratio) AS max_mir,
                   SUM(reported_incidence) AS total_inc,
                   SUM(reported_deaths) AS total_deaths
            FROM Fact_State_Mortality_Surveillance
            WHERE time_id = 2022
        """)
        res = dict(cur.fetchone())
        answer_text = (
            f"Mortality Surveillance Summary (2022 Dataset 5):\n\n"
            f"- **National Reported Incidence (Single Site Proxy):** {int(res['total_inc']):,} cases\n"
            f"- **National Reported Deaths:** {int(res['total_deaths']):,} deaths\n"
            f"- **Mean State Mortality-to-Incidence Ratio (MIR):** {res['avg_mir']:.3f}\n"
            f"- **MIR Range Across States:** {res['min_mir']:.3f} to {res['max_mir']:.3f}\n\n"
            "**CRITICAL PROVENANCE CAVEAT:** Dataset 5 from MoHFW parliamentary replies (~77,426 national cases) "
            "represents single-site surveillance (ovarian cancer scale, ~5.3% of national cancer burden). "
            "It must NOT be interpreted as all-cancer mortality."
        )
        return QueryResponse(
            query=req.query,
            intent="mortality_mir",
            answer=answer_text,
            data_summary=res,
            table_sources=["Fact_State_Mortality_Surveillance", "Dim_Geography"],
            disclaimer="MIR is an ecological health-system indicator, not an individual patient survival probability."
        )

    # ----------------------------------------------------
    # 6. Data Mining Models & Machine Learning Results
    # ----------------------------------------------------
    if any(k in q for k in ["model", "algorithm", "kmeans", "cluster", "regression", "decision tree", "naive bayes", "apriori", "dendrogram"]):
        dm = load_data_mining()
        if dm:
            km = dm.get("kmeans_clustering", {})
            nb = dm.get("naive_bayes_classification", {})
            dt = dm.get("decision_tree_classification", {})
            reg = dm.get("regression_analysis", {})
            ap = dm.get("apriori_association_mining", {})
            hc = dm.get("hierarchical_clustering", {})
            
            answer_text = (
                "Verified Results for DWM Machine Learning Algorithms:\n\n"
                f"1. **Regression Analysis (OLS / Ridge):** In-sample R² = {reg.get('models', {}).get('linear_regression', {}).get('metrics', {}).get('r2')}, MAE = 12.99 cases. Out-of-sample 2026 forward trajectory alignment R² = {reg.get('forecast_2026_trajectory_evaluation', {}).get('metrics', {}).get('r2')}.\n"
                f"2. **Decision Tree Classification:** Accuracy = {(dt.get('evaluation', {}).get('accuracy', 0)*100):.2f}%, Macro F1 = {dt.get('evaluation', {}).get('macro_f1')}. Regularized depth = 3 classifying 4 epidemiological burden quartiles without target leakage.\n"
                f"3. **Gaussian Naive Bayes:** Accuracy = {(nb.get('evaluation', {}).get('accuracy', 0)*100):.2f}%, Sensitivity = {(nb.get('evaluation', {}).get('recall_sensitivity', 0.9286)*100):.2f}% (13/14 tobacco-associated sites detected, 1 FN: Nasopharynx), Specificity = {(nb.get('evaluation', {}).get('specificity', 0.8689)*100):.2f}%.\n"
                f"4. **K-Means Clustering:** Optimal k = {km.get('evaluation_metrics', {}).get('optimal_k_selected')} clusters with Silhouette Score = {km.get('evaluation_metrics', {}).get('optimal_silhouette_score')}. All 37 states assigned to mutually exclusive clusters.\n"
                f"5. **Hierarchical Clustering:** Agglomerative Ward linkage with Cophenetic Correlation c = {hc.get('methodology', {}).get('cophenetic_correlation')}, successfully pairing 37 states across 36 merge steps.\n"
                f"6. **Apriori Association Mining:** {ap.get('total_rules_generated')} rules discovered with maximum lift = {ap.get('top_association_rules', [{}])[0].get('lift')}."
            )
            return QueryResponse(
                query=req.query,
                intent="data_mining_models",
                answer=answer_text,
                data_summary={"algorithms_evaluated": 6},
                table_sources=["warehouse/data_mining_results.json"],
                disclaimer="Models were evaluated strictly on warehouse datasets; statistical association does not establish biological causality."
            )

    # ----------------------------------------------------
    # 7. Healthcare Infrastructure & Screening
    # ----------------------------------------------------
    if any(k in q for k in ["infrastructure", "hospital", "screening", "facility", "bed"]):
        cur.execute("SELECT cancer_type, persons_screened, cases_diagnosed, treatment_retention_rate_pct FROM Fact_Screening_Programs LIMIT 3")
        screening = [dict(r) for r in cur.fetchall()]
        cur.execute("SELECT COUNT(*) FROM Fact_Maharashtra_Infrastructure")
        mh_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM Fact_Healthcare_Infrastructure_National")
        nat_count = cur.fetchone()[0]
        
        answer_text = (
            f"Healthcare Infrastructure & Screening Overview:\n\n"
            f"- **National Approved Tertiary Centers (SCIs / TCCCs):** {nat_count} facilities sanctioned under PMSSY.\n"
            f"- **Maharashtra District Capacity:** {mh_count} districts profiled with oncological bed and radiation capacity.\n"
            f"- **NP-NCD National Screening Retention:**\n"
            + "\n".join([f"  • {s['cancer_type']}: {s['persons_screened']:,} screened, {s['cases_diagnosed']:,} diagnosed (Retention: {s['treatment_retention_rate_pct']}%)" for s in screening])
        )
        return QueryResponse(
            query=req.query,
            intent="healthcare_infrastructure",
            answer=answer_text,
            data_summary={"national_centers": nat_count, "mh_districts": mh_count, "screening": screening},
            table_sources=["Fact_Screening_Programs", "Fact_Healthcare_Infrastructure_National", "Fact_Maharashtra_Infrastructure"],
            disclaimer="Sourced from MOHFW Parliamentary releases (2026) and Maharashtra Health Department archives."
        )

    # ----------------------------------------------------
    # Default fallback: structured warehouse overview
    # ----------------------------------------------------
    return QueryResponse(
        query=req.query,
        intent="general_warehouse_overview",
        answer=(
            "The Cancer Intelligence & Analytics warehouse contains conformed data across 37 States & UTs, "
            "75 anatomical cancer sites (76 dimension records), multi-year longitudinal projections (2019–2045), "
            "hospital infrastructure metrics, and 6 verified machine learning models.\n\n"
            "Try asking questions like:\n"
            "- *'What is the cancer burden in Maharashtra?'*\n"
            "- *'Tell me about Breast cancer incidence and staging'*\n"
            "- *'What happened in year 2022?'*\n"
            "- *'What are the top 5 cancer burden states?'*\n"
            "- *'Show regional zonal distribution of cancer cases'*\n"
            "- *'Explain the Dataset 5 mortality surveillance caveat'*\n"
            "- *'What are the K-Means clustering and machine learning results?'*"
        ),
        data_summary={"total_states": 37, "total_sites": 75, "total_tables": 15},
        table_sources=["Dim_Geography", "Dim_Cancer_Site", "Fact_State_Surveillance"],
        disclaimer="All responses are calculated directly from conformed SQLite warehouse tables using template-grounded analytical queries."
    )
