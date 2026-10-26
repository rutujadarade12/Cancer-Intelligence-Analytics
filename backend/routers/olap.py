from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
import sqlite3
from backend.database import get_db

router = APIRouter(prefix="/olap", tags=["OLAP Analytics"])

@router.get("/regional-rollups")
def get_olap_regional_rollups(
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

@router.get("/organ-system-burden")
def get_olap_organ_system_burden(
    year: Optional[int] = Query(2022, description="Surveillance year"),
    gender: Optional[str] = Query(None, description="Male, Female, Both"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT system_name, year, gender, measure_code, site_count,
               total_system_cases, total_system_deaths, avg_crude_rate, avg_age_adjusted_rate
        FROM vw_olap_organ_system_burden
        WHERE year = ?
    """
    params = [year]
    if gender:
        query += " AND gender = ?"
        params.append(gender)
    query += " ORDER BY total_system_cases DESC"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/state-pivots")
def get_olap_state_pivots(
    region: Optional[str] = Query(None, description="Filter by region zone"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT geo_id, state_name, state_code, region_zone,
               cases_2019, cases_2020, cases_2021, cases_2022,
               cases_2026_forecast, cases_2030_forecast, cases_2045_forecast,
               cagr_observed, cagr_projected,
               ROUND(national_share_2022 * 100, 2) AS national_share_2022
        FROM vw_olap_state_pivots
        WHERE 1=1
    """
    params = []
    if region:
        query += " AND region_zone = ?"
        params.append(region)
    query += " ORDER BY cases_2022 DESC"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/slice-dice")
def execute_slice_dice(
    regions: Optional[str] = Query(None, description="Comma-separated region zones, e.g. North,East"),
    years: Optional[str] = Query(None, description="Comma-separated years, e.g. 2020,2022"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT g.region_zone, t.year,
               COUNT(DISTINCT g.geo_id) AS state_count,
               ROUND(SUM(f.incident_cases), 1) AS subcube_cases
        FROM Fact_State_Surveillance f
        JOIN Dim_Geography g ON f.geo_id = g.geo_id
        JOIN Dim_Time t ON f.time_id = t.time_id
        WHERE 1=1
    """
    params = []
    if regions:
        region_list = [r.strip() for r in regions.split(",") if r.strip()]
        if region_list:
            placeholders = ",".join("?" for _ in region_list)
            query += f" AND g.region_zone IN ({placeholders})"
            params.extend(region_list)
            
    if years:
        year_list = []
        for y in years.split(","):
            try:
                year_list.append(int(y.strip()))
            except ValueError:
                pass
        if year_list:
            placeholders = ",".join("?" for _ in year_list)
            query += f" AND t.year IN ({placeholders})"
            params.extend(year_list)
            
    query += " GROUP BY g.region_zone, t.year ORDER BY g.region_zone, t.year"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]
