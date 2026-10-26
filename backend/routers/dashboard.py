from fastapi import APIRouter, Depends
import sqlite3
from backend.database import get_db
from backend.schemas import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    
    # 1. 2022 national sum
    cur.execute("""
        SELECT SUM(incident_cases) 
        FROM Fact_State_Surveillance 
        WHERE time_id = 2022 AND measure_type_id = (SELECT measure_type_id FROM Dim_Measure_Type WHERE measure_code = 'ICMR_NCRP_ESTIMATE')
    """)
    nat_2022 = float(cur.fetchone()[0] or 0.0)
    
    # 2. Counts
    total_states = cur.execute("SELECT COUNT(*) FROM Dim_Geography").fetchone()[0]
    total_sites = cur.execute("SELECT COUNT(*) FROM Dim_Cancer_Site WHERE level_type != 'Total'").fetchone()[0]
    total_registries = cur.execute("SELECT COUNT(*) FROM Dim_Registry").fetchone()[0]
    
    # 3. Forecasts
    cur.execute("SELECT SUM(incident_cases) FROM Fact_State_Surveillance WHERE time_id = 2026")
    nat_2026 = float(cur.fetchone()[0] or 0.0)
    
    cur.execute("SELECT SUM(incident_cases) FROM Fact_State_Surveillance WHERE time_id = 2045")
    nat_2045 = float(cur.fetchone()[0] or 0.0)
    
    # 4. Top 5 States 2022
    cur.execute("""
        SELECT g.state_name, g.region_zone, f.incident_cases, ROUND(f.national_share_pct * 100, 2) AS national_share_pct
        FROM Fact_State_Surveillance f
        JOIN Dim_Geography g ON f.geo_id = g.geo_id
        WHERE f.time_id = 2022
        ORDER BY f.incident_cases DESC LIMIT 5
    """)
    top_states = [dict(r) for r in cur.fetchall()]
    
    # 5. Leading sites male (2022)
    cur.execute("""
        SELECT s.site_name, f.incident_cases, f.crude_rate, f.age_adjusted_rate
        FROM Fact_Cancer_Incidence f
        JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
        WHERE f.time_id = 2022 AND f.gender = 'Male' AND s.site_name != 'All sites'
        ORDER BY f.incident_cases DESC LIMIT 5
    """)
    leading_male = [dict(r) for r in cur.fetchall()]
    
    # 6. Leading sites female (2022)
    cur.execute("""
        SELECT s.site_name, f.incident_cases, f.crude_rate, f.age_adjusted_rate
        FROM Fact_Cancer_Incidence f
        JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
        WHERE f.time_id = 2022 AND f.gender = 'Female' AND s.site_name != 'All sites'
        ORDER BY f.incident_cases DESC LIMIT 5
    """)
    leading_female = [dict(r) for r in cur.fetchall()]
    
    # 7. Regional distribution (2022)
    cur.execute("""
        SELECT region_zone, total_regional_cases, regional_share_pct, state_count
        FROM vw_olap_regional_rollups
        WHERE year = 2022
        ORDER BY total_regional_cases DESC
    """)
    regional_dist = [dict(r) for r in cur.fetchall()]
    
    provenance_notes = [
        "2019-2022 state figures are ICMR-NCRP model demographic extrapolations.",
        "2026, 2030, and 2045 figures are Kumar et al. (2026) moderated exponential forecasts.",
        "2022 national sum (1,461,427) is an arithmetic sum reconciliation across 37 state estimates.",
        "Dataset 5 mortality figures represent a single unspecified anatomical cohort (~77K cases) and must not be treated as all-cancer mortality."
    ]
    
    return DashboardSummaryResponse(
        national_cases_2022=nat_2022,
        total_states_covered=total_states,
        total_cancer_sites=total_sites,
        total_registries=total_registries,
        national_projected_2026=nat_2026,
        national_projected_2045=nat_2045,
        top_states=top_states,
        leading_sites_male=leading_male,
        leading_sites_female=leading_female,
        regional_distribution=regional_dist,
        data_provenance_notes=provenance_notes
    )
