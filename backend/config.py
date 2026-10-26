import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DB_PATH = os.getenv("CANCER_DW_PATH", str(BASE_DIR / "warehouse" / "cancer_dw.db"))
DATA_MINING_JSON_PATH = os.getenv("DATA_MINING_JSON_PATH", str(BASE_DIR / "warehouse" / "data_mining_results.json"))
VALIDATION_JSON_PATH = os.getenv("VALIDATION_JSON_PATH", str(BASE_DIR / "warehouse" / "validation_results.json"))
REPORTS_DIR = os.getenv("REPORTS_DIR", str(BASE_DIR / "reports"))

API_PREFIX = "/api"
PROJECT_NAME = "Cancer Intelligence & Analytics API"
PROJECT_VERSION = "2.1.0"
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1")
