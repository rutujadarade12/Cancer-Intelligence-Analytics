from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Dict, Any
import sqlite3
from backend.database import get_db

router = APIRouter(prefix="/infrastructure", tags=["Healthcare Infrastructure"])

@router.get("/national")
def get_national_infrastructure(db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT infra_id, indicator_name, facility_count, reporting_source
        FROM Fact_Healthcare_Infrastructure_National
        ORDER BY facility_count DESC
    """)
    return [dict(r) for r in cur.fetchall()]

@router.get("/maharashtra")
def get_maharashtra_infrastructure(
    category: Optional[str] = Query(None, description="Filter by infrastructure category"),
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    query = """
        SELECT mh_infra_id, category, facility_name, facility_count_or_type, source_note
        FROM Fact_Maharashtra_Infrastructure
        WHERE 1=1
    """
    params = []
    if category:
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY category, facility_name"
    cur.execute(query, params)
    return [dict(r) for r in cur.fetchall()]

@router.get("/screening")
def get_screening_data(db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT screening_id, cancer_type, persons_screened, cases_diagnosed,
               cases_on_treatment, detection_rate_per_100k, treatment_retention_rate_pct
        FROM Fact_Screening_Programs
        ORDER BY persons_screened DESC
    """)
    return [dict(r) for r in cur.fetchall()]
