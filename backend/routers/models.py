from fastapi import APIRouter, HTTPException, Query
import json
import os
from typing import Optional, Union

from backend.config import DATA_MINING_JSON_PATH
from backend.schemas import (
    IncidencePredictionRequest,
    IncidencePredictionResponse,
    ModelBenchmarkResponse
)
from backend.services.incidence_predictor import get_incidence_predictor

router = APIRouter(prefix="/models", tags=["Data Mining Models"])

def load_models_data():
    if not os.path.exists(DATA_MINING_JSON_PATH):
        raise HTTPException(status_code=500, detail="Data mining results file not found.")
    with open(DATA_MINING_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/all")
def get_all_models_summary():
    data = load_models_data()
    return {
        "timestamp": data.get("timestamp"),
        "syllabus_coverage": data.get("syllabus_coverage"),
        "available_algorithms": [
            "regression_analysis",
            "decision_tree_classification",
            "naive_bayes_classification",
            "kmeans_clustering",
            "hierarchical_clustering",
            "apriori_association_mining"
        ],
        "active_forecasting_engine": {
            "primary_model": "bayesian_ridge",
            "supported_models": [
                "bayesian_ridge",
                "linear_regression",
                "ridge_regression",
                "gradient_boosting",
                "random_forest"
            ],
            "endpoints": [
                "POST /api/models/predict/incidence",
                "GET /api/models/predict/incidence",
                "GET /api/models/evaluation/comparison"
            ]
        }
    }

@router.get("/regression")
def get_regression_model():
    data = load_models_data()
    return data.get("regression_analysis", {})

@router.get("/decision-tree")
def get_decision_tree_model():
    data = load_models_data()
    return data.get("decision_tree_classification", {})

@router.get("/naive-bayes")
def get_naive_bayes_model():
    data = load_models_data()
    return data.get("naive_bayes_classification", {})

@router.get("/kmeans")
def get_kmeans_model():
    data = load_models_data()
    return data.get("kmeans_clustering", {})

@router.get("/hierarchical")
def get_hierarchical_model():
    data = load_models_data()
    return data.get("hierarchical_clustering", {})

@router.get("/apriori")
def get_apriori_model():
    data = load_models_data()
    return data.get("apriori_association_mining", {})

# ====================================================================
# LIVE INCIDENCE PREDICTION ENGINE & COMPARATIVE BENCHMARKS
# ====================================================================

@router.get("/evaluation/comparison", response_model=ModelBenchmarkResponse)
def get_model_evaluation_comparison():
    """
    Returns comparative evaluation of all 5 candidate models evaluated via
    Leave-One-Out Cross-Validation (LOOCV) and in-sample metrics.
    """
    predictor = get_incidence_predictor()
    return predictor.get_model_benchmarks()

@router.get("/supported-states")
def get_prediction_supported_states():
    """Returns the list of 37 States & UTs available for dynamic forecasting."""
    predictor = get_incidence_predictor()
    return predictor.get_supported_states()

@router.post("/predict/incidence", response_model=IncidencePredictionResponse)
def predict_state_incidence_post(req: IncidencePredictionRequest):
    """
    Executes real-time dynamic cancer incidence forecasting.
    Accepts state (name or geo_id), target year (2019-2045), growth adjustment %, and model type.
    """
    predictor = get_incidence_predictor()
    try:
        result = predictor.predict(
            state=req.state,
            target_year=req.target_year,
            growth_adjustment_pct=req.growth_adjustment_pct or 0.0,
            model_type=req.model_type or "bayesian_ridge"
        )
        return result
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e).strip("'\""))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction computation error: {str(e)}")

@router.get("/predict/incidence", response_model=IncidencePredictionResponse)
def predict_state_incidence_get(
    state: str = Query(..., description="State name (e.g. 'Maharashtra') or geo_id (e.g. '27')"),
    target_year: int = Query(2026, ge=2019, le=2045, description="Forecast target year"),
    growth_adjustment_pct: float = Query(0.0, ge=-50.0, le=50.0, description="Growth adjustment % (-50 to +50)"),
    model_type: str = Query("bayesian_ridge", description="Model: bayesian_ridge, linear_regression, ridge_regression, gradient_boosting, random_forest")
):
    """
    GET interface for dynamic incidence forecasting.
    """
    predictor = get_incidence_predictor()
    try:
        result = predictor.predict(
            state=state,
            target_year=target_year,
            growth_adjustment_pct=growth_adjustment_pct,
            model_type=model_type
        )
        return result
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e).strip("'\""))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction computation error: {str(e)}")
