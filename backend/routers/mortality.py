from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Dict, Any
import sqlite3
from backend.database import get_db

router = APIRouter(prefix="/mortality", tags=["Mortality & MIR Analytics"])

@router.get("/state-surveillance")
def get_state_mortality_surveillance(
    year: Optional[int] = Query(None, description="Filter by year (2021 to 2025)"),
    state_id: Optional[int] = Query(None, description="Filter by state geo_id"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT m.fact_mort_id, g.geo_id, g.state_name, g.state_code, g.region_zone,
               t.year, m.reported_incidence, m.reported_deaths, m.mortality_incidence_ratio,
               m.cancer_type_note, mt.measure_code, mt.measure_name
        FROM Fact_State_Mortality_Surveillance m
        JOIN Dim_Geography g ON m.geo_id = g.geo_id
        JOIN Dim_Time t ON m.time_id = t.time_id
        JOIN Dim_Measure_Type mt ON m.measure_type_id = mt.measure_type_id
        WHERE 1=1
    """
    params = []
    if year:
        query += " AND t.year = ?"
        params.append(year)
    if state_id:
        query += " AND g.geo_id = ?"
        params.append(state_id)
        
    query += " ORDER BY m.reported_incidence DESC"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/mir-summary")
def get_mir_summary(
    year: Optional[int] = Query(2022, description="Surveillance year"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    cur.execute("""
        SELECT 
            COUNT(*) AS total_states,
            ROUND(AVG(mortality_incidence_ratio), 4) AS avg_mir,
            ROUND(MIN(mortality_incidence_ratio), 4) AS min_mir,
            ROUND(MAX(mortality_incidence_ratio), 4) AS max_mir,
            SUM(reported_incidence) AS total_cohort_incidence,
            SUM(reported_deaths) AS total_cohort_deaths
        FROM Fact_State_Mortality_Surveillance
        WHERE time_id = ?
    """, (year,))
    row = dict(cur.fetchone())
    row["caveat"] = "Dataset 5 numbers represent an unspecified anatomical cancer site (~77K cases nationally). MIR is mortality-to-incidence ratio, NOT clinical survival percentage."
    return row
