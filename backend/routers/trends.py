from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Dict, Any
import sqlite3
from backend.database import get_db

router = APIRouter(prefix="/trends", tags=["Longitudinal Trends & Projections"])

@router.get("/state-projections")
def get_state_projections(
    state_id: Optional[int] = Query(None, description="Filter by state geo_id"),
    region: Optional[str] = Query(None, description="Filter by region zone"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT g.geo_id, g.state_name, g.region_zone, t.year, t.epoch_category,
               m.measure_code, m.is_modeled, f.incident_cases,
               f.cagr_observed, f.cagr_projected,
               ROUND(f.national_share_pct * 100, 2) AS national_share_pct
        FROM Fact_State_Surveillance f
        JOIN Dim_Geography g ON f.geo_id = g.geo_id
        JOIN Dim_Time t ON f.time_id = t.time_id
        JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id
        WHERE 1=1
    """
    params = []
    if state_id:
        query += " AND g.geo_id = ?"
        params.append(state_id)
    if region:
        query += " AND g.region_zone = ?"
        params.append(region)
        
    query += " ORDER BY g.state_name, t.year"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/apc")
def get_apc_trends(
    direction: Optional[str] = Query(None, description="Increase or Decrease"),
    significant_only: Optional[bool] = Query(False, description="Filter statistically significant only"),
    site: Optional[str] = Query(None, description="Filter by cancer site"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT fact_trend_id, cancer_site, gender, registry_name, region,
               apc_percent, is_statistically_significant, direction, source_measure_code
        FROM Fact_Cancer_Trends_APC
        WHERE 1=1
    """
    params = []
    if direction:
        query += " AND direction = ?"
        params.append(direction)
    if significant_only:
        query += " AND is_statistically_significant = 1"
    if site:
        query += " AND cancer_site LIKE ?"
        params.append(f"%{site}%")
        
    query += " ORDER BY apc_percent DESC"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/pbcr-surveillance")
def get_pbcr_surveillance(
    region: Optional[str] = Query(None, description="Filter by PBCR region"),
    gender: Optional[str] = Query(None, description="Male or Female"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT p.fact_pbcr_id, r.registry_name, r.region, p.time_period, p.gender,
               p.annual_cases, p.crude_rate, p.age_adjusted_rate, p.cum_risk_1_in_n,
               p.tobacco_share_pct, p.time_period_note
        FROM Fact_PBCR_Surveillance p
        JOIN Dim_Registry r ON p.registry_id = r.registry_id
        WHERE 1=1
    """
    params = []
    if region:
        query += " AND r.region = ?"
        params.append(region)
    if gender:
        query += " AND p.gender = ?"
        params.append(gender)
    query += " ORDER BY p.annual_cases DESC"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]
