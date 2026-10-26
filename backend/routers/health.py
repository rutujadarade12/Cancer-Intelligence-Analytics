from fastapi import APIRouter, Depends
import sqlite3
from backend.database import get_db
from backend.config import PROJECT_NAME, PROJECT_VERSION
from backend.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("", response_model=HealthResponse)
def health_check(db: sqlite3.Connection = Depends(get_db)):
    try:
        cur = db.cursor()
        cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'")
        table_count = cur.fetchone()[0]
        return HealthResponse(
            status="healthy",
            database_connected=True,
            version=PROJECT_VERSION,
            project=PROJECT_NAME,
            verified_tables=table_count
        )
    except Exception as e:
        return HealthResponse(
            status=f"unhealthy: {str(e)}",
            database_connected=False,
            version=PROJECT_VERSION,
            project=PROJECT_NAME,
            verified_tables=0
        )
