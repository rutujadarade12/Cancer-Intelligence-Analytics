from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
import sqlite3
from backend.database import get_db

router = APIRouter(prefix="/geography", tags=["Geography & States"])

@router.get("/states")
def get_all_states(
    region: Optional[str] = Query(None, description="Filter by geographical region zone"),
    year: Optional[int] = Query(2022, description="Year for state metrics (e.g., 2019, 2020, 2021, 2022, 2026)"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    params = [year]
    query = """
        SELECT g.geo_id, g.state_name, g.state_code, g.region_zone, g.country,
               f.incident_cases, f.cagr_observed, f.cagr_projected,
               ROUND(f.national_share_pct * 100, 2) AS national_share_pct,
               t.epoch_category, m.measure_code
        FROM Dim_Geography g
        LEFT JOIN Fact_State_Surveillance f ON g.geo_id = f.geo_id AND f.time_id = ?
        LEFT JOIN Dim_Time t ON f.time_id = t.time_id
        LEFT JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id
    """
    if region:
        query += " WHERE g.region_zone = ?"
        params.append(region)
        
    query += " ORDER BY f.incident_cases DESC"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/regions")
def get_regional_summary(
    year: Optional[int] = Query(2022, description="Surveillance year"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    cur.execute("""
        SELECT region_zone, year, epoch_category, measure_code, state_count,
               total_regional_cases, avg_state_cases, min_state_cases, max_state_cases,
               regional_share_pct
        FROM vw_olap_regional_rollups
        WHERE year = ?
        ORDER BY total_regional_cases DESC
    """, (year,))
    return [dict(r) for r in cur.fetchall()]

@router.get("/states/{geo_id}")
def get_state_detail(geo_id: int, db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT * FROM Dim_Geography WHERE geo_id = ?", (geo_id,))
    state = cur.fetchone()
    if not state:
        raise HTTPException(status_code=404, detail=f"State with geo_id {geo_id} not found")
        
    cur.execute("""
        SELECT t.year, t.epoch_category, m.measure_code, f.incident_cases,
               f.cagr_observed, f.cagr_projected, ROUND(f.national_share_pct * 100, 2) AS national_share_pct
        FROM Fact_State_Surveillance f
        JOIN Dim_Time t ON f.time_id = t.time_id
        JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id
        WHERE f.geo_id = ?
        ORDER BY t.year
    """, (geo_id,))
    timeline = [dict(r) for r in cur.fetchall()]
    
    cur.execute("""
        SELECT year, reported_incidence, reported_deaths, mortality_incidence_ratio, cancer_type_note
        FROM vw_state_mortality_ratios
        WHERE state_name = ?
        ORDER BY year
    """, (state["state_name"],))
    mortality = [dict(r) for r in cur.fetchall()]
    
    result = dict(state)
    result["incidence_timeline"] = timeline
    result["mortality_surveillance"] = mortality
    return result
