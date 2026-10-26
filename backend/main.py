"""
FastAPI Application Entry Point
Cancer Intelligence & Analytics
Course: Data Warehousing and Data Mining (DWM) — Sem V CMPN
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import PROJECT_NAME, PROJECT_VERSION, API_PREFIX
from backend.routers import (
    health,
    dashboard,
    geography,
    cancer_sites,
    trends,
    mortality,
    infrastructure,
    olap,
    models,
    reports,
    assistant
)

app = FastAPI(
    title=PROJECT_NAME,
    version=PROJECT_VERSION,
    description="RESTful analytical API service for Cancer Intelligence & Analytics DWM academic platform.",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
    openapi_url=f"{API_PREFIX}/openapi.json"
)

# Enable CORS for frontend applications (Vite default: 5173, Next/React: 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(geography.router, prefix=API_PREFIX)
app.include_router(cancer_sites.router, prefix=API_PREFIX)
app.include_router(trends.router, prefix=API_PREFIX)
app.include_router(mortality.router, prefix=API_PREFIX)
app.include_router(infrastructure.router, prefix=API_PREFIX)
app.include_router(olap.router, prefix=API_PREFIX)
app.include_router(models.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(assistant.router, prefix=API_PREFIX)

@app.get("/")
def root():
    return {
        "message": f"Welcome to the {PROJECT_NAME}",
        "version": PROJECT_VERSION,
        "docs_url": f"{API_PREFIX}/docs",
        "health_check": f"{API_PREFIX}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
