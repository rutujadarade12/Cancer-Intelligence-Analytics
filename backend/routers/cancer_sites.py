from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
import sqlite3
from backend.database import get_db

router = APIRouter(prefix="/cancer-sites", tags=["Cancer Sites"])

@router.get("")
def get_cancer_sites(
    organ_system: Optional[str] = Query(None, description="Filter by organ system"),
    tobacco_only: Optional[bool] = Query(False, description="Filter only tobacco-associated cancers"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT s.site_id, s.site_name, s.icd10_code, s.level_type, s.parent_group,
               s.is_tobacco_associated, o.system_name AS organ_system_name
        FROM Dim_Cancer_Site s
        LEFT JOIN Dim_Organ_System o ON s.organ_system_id = o.organ_system_id
        WHERE 1=1
    """
    params = []
    if organ_system:
        query += " AND o.system_name = ?"
        params.append(organ_system)
    if tobacco_only:
        query += " AND s.is_tobacco_associated = 1"
        
    query += " ORDER BY s.site_name"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/organ-systems")
def get_organ_systems(db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT o.organ_system_id, o.system_name, COUNT(s.site_id) AS site_count
        FROM Dim_Organ_System o
        LEFT JOIN Dim_Cancer_Site s ON o.organ_system_id = s.organ_system_id
        GROUP BY o.organ_system_id, o.system_name
        ORDER BY site_count DESC
    """)
    return [dict(r) for r in cur.fetchall()]

@router.get("/burden")
def get_site_burden(
    year: Optional[int] = Query(2022, description="Surveillance year (e.g. 2022, 2024)"),
    gender: Optional[str] = Query(None, description="Male, Female, Both"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT s.site_id, s.site_name, o.system_name, f.gender, f.incident_cases,
               f.crude_rate, f.age_adjusted_rate, f.cumulative_risk_1_in_n,
               f.deaths, f.mortality_crude_rate, m.measure_code
        FROM Fact_Cancer_Incidence f
        JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
        LEFT JOIN Dim_Organ_System o ON s.organ_system_id = o.organ_system_id
        JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id
        WHERE f.time_id = ?
    """
    params = [year]
    if gender:
        query += " AND f.gender = ?"
        params.append(gender)
    query += " ORDER BY f.incident_cases DESC"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/clinical-stages")
def get_clinical_stage_distribution(db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT fact_stage_id, source_name, source_measure_code, cancer_site, gender,
               localized_pct, locoregional_pct, distant_metastasis_pct,
               unknown_extent_pct, advanced_stage_pct
        FROM Fact_Clinical_Stage
        ORDER BY cancer_site, gender
    """)
    return [dict(r) for r in cur.fetchall()]
