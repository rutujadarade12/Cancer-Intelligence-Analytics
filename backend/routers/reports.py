from fastapi import APIRouter, Depends, Query, Response, HTTPException
import sqlite3
import csv
import io
import os
from backend.database import get_db
from backend.config import REPORTS_DIR

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/list")
def list_available_reports():
    if not os.path.exists(REPORTS_DIR):
        return []
    reports = []
    for f in sorted(os.listdir(REPORTS_DIR)):
        if f.endswith(".md"):
            filepath = os.path.join(REPORTS_DIR, f)
            reports.append({
                "filename": f,
                "size_bytes": os.path.getsize(filepath),
                "modified": os.path.getmtime(filepath)
            })
    return reports

@router.get("/export-csv")
def export_table_csv(
    table: str = Query("Fact_State_Surveillance", description="Target warehouse table to export"),
    db: sqlite3.Connection = Depends(get_db)
):
    # Safety: strict whitelist of exportable tables and views to prevent SQL injection
    ALLOWED_OBJECTS = [
        "Dim_Geography", "Dim_Cancer_Site", "Dim_Organ_System", "Dim_Time",
        "Dim_Measure_Type", "Dim_Registry", "Fact_State_Surveillance",
        "Fact_Cancer_Incidence", "Fact_State_Mortality_Surveillance",
        "Fact_PBCR_Surveillance", "Fact_Clinical_Stage", "Fact_Cancer_Trends_APC",
        "Fact_Screening_Programs", "Fact_Healthcare_Infrastructure_National",
        "Fact_Maharashtra_Infrastructure", "vw_star_state_incidence",
        "vw_star_cancer_sites", "vw_state_mortality_ratios", "vw_olap_regional_rollups",
        "vw_olap_organ_system_burden", "vw_olap_state_pivots", "vw_olap_pbcr_analytics"
    ]
    if table not in ALLOWED_OBJECTS:
        raise HTTPException(status_code=400, detail=f"Table or view '{table}' is not permitted for export.")
        
    cur = db.cursor()
    cur.execute(f"SELECT * FROM [{table}]")
    rows = cur.fetchall()
    
    col_names = [description[0] for description in cur.description]
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(col_names)
    for row in rows:
        writer.writerow(list(row))
        
    csv_content = output.getvalue()
    filename = f"{table}_export.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
