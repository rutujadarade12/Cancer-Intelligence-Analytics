"""
Automated Backend API Test Suite
Cancer Intelligence & Analytics
Validates application startup, schema integrity, parameterized endpoints, and export services.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "docs_url" in data

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert data["verified_tables"] >= 15

def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["national_cases_2022"] == 1461427.0
    assert data["total_states_covered"] == 37
    assert data["total_cancer_sites"] >= 50
    assert len(data["top_states"]) == 5
    assert len(data["regional_distribution"]) >= 6

def test_geography_endpoints():
    # Test all states
    resp = client.get("/api/geography/states")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) == 37
    
    # Test region filter
    resp_west = client.get("/api/geography/states?region=West")
    assert resp_west.status_code == 200
    west_states = resp_west.json()
    assert len(west_states) == 5
    
    # Test state detail
    resp_detail = client.get(f"/api/geography/states/{states[0]['geo_id']}")
    assert resp_detail.status_code == 200
    detail = resp_detail.json()
    assert "incidence_timeline" in detail
    assert "mortality_surveillance" in detail

def test_cancer_sites_endpoints():
    resp = client.get("/api/cancer-sites")
    assert resp.status_code == 200
    sites = resp.json()
    assert len(sites) >= 70
    
    # Organ systems
    resp_organs = client.get("/api/cancer-sites/organ-systems")
    assert resp_organs.status_code == 200
    assert len(resp_organs.json()) >= 10

def test_trends_endpoints():
    resp_proj = client.get("/api/trends/state-projections")
    assert resp_proj.status_code == 200
    projections = resp_proj.json()
    assert len(projections) >= 200
    
    resp_apc = client.get("/api/trends/apc")
    assert resp_apc.status_code == 200
    apc = resp_apc.json()
    assert len(apc) == 152

    # Significant APC
    resp_sig = client.get("/api/trends/apc?significant_only=true")
    assert resp_sig.status_code == 200
    assert len(resp_sig.json()) == 86

    # PBCR Surveillance
    resp_pbcr = client.get("/api/trends/pbcr-surveillance")
    assert resp_pbcr.status_code == 200
    pbcr = resp_pbcr.json()
    assert len(pbcr) == 64
    assert any(p["gender"] == "Male" for p in pbcr)
    assert any(p["gender"] == "Female" for p in pbcr)

def test_mortality_endpoints():
    resp = client.get("/api/mortality/state-surveillance")
    assert resp.status_code == 200
    mort = resp.json()
    assert len(mort) == 185

    # 2022 specific mortality rows
    resp_2022 = client.get("/api/mortality/state-surveillance?year=2022")
    assert resp_2022.status_code == 200
    mort_2022 = resp_2022.json()
    assert len(mort_2022) == 37
    assert all("reported_incidence" in r and "reported_deaths" in r for r in mort_2022)
    
    resp_sum = client.get("/api/mortality/mir-summary?year=2022")
    assert resp_sum.status_code == 200
    assert "avg_mir" in resp_sum.json()
    assert resp_sum.json()["total_states"] == 37

def test_infrastructure_endpoints():
    resp_nat = client.get("/api/infrastructure/national")
    assert resp_nat.status_code == 200
    assert len(resp_nat.json()) == 7
    
    resp_mh = client.get("/api/infrastructure/maharashtra")
    assert resp_mh.status_code == 200
    assert len(resp_mh.json()) == 15

def test_olap_endpoints():
    # Regional rollups
    resp_reg = client.get("/api/olap/regional-rollups?year=2022")
    assert resp_reg.status_code == 200
    regs = resp_reg.json()
    assert len(regs) == 6
    total_cases = sum(r["total_regional_cases"] for r in regs)
    assert abs(total_cases - 1461427.0) < 1.0
    
    # State pivots
    resp_piv = client.get("/api/olap/state-pivots")
    assert resp_piv.status_code == 200
    assert len(resp_piv.json()) == 37

def test_models_endpoints():
    resp = client.get("/api/models/all")
    assert resp.status_code == 200
    assert "available_algorithms" in resp.json()
    assert "active_forecasting_engine" in resp.json()
    
    resp_reg = client.get("/api/models/regression")
    assert resp_reg.status_code == 200
    assert "models" in resp_reg.json()
    assert "loocv_validation" in resp_reg.json()
    assert "selected_production_model" in resp_reg.json()
    
    resp_dt = client.get("/api/models/decision-tree")
    assert resp_dt.status_code == 200
    assert "evaluation" in resp_dt.json()
    
    resp_nb = client.get("/api/models/naive-bayes")
    assert resp_nb.status_code == 200
    assert "prior_probabilities" in resp_nb.json()
    
    resp_km = client.get("/api/models/kmeans")
    assert resp_km.status_code == 200
    assert "clusters" in resp_km.json()
    
    resp_hc = client.get("/api/models/hierarchical")
    assert resp_hc.status_code == 200
    assert "methodology" in resp_hc.json()
    
    resp_ap = client.get("/api/models/apriori")
    assert resp_ap.status_code == 200
    assert len(resp_ap.json()["top_association_rules"]) > 0

def test_model_evaluation_comparison():
    resp = client.get("/api/models/evaluation/comparison")
    assert resp.status_code == 200
    data = resp.json()
    assert data["selected_model"] == "bayesian_ridge"
    assert "loocv_metrics" in data
    assert "bayesian_ridge" in data["loocv_metrics"]
    assert "gradient_boosting" in data["loocv_metrics"]
    assert "random_forest" in data["loocv_metrics"]
    assert data["evaluation_cohort_size"] == 37
    assert "external_projections_note" in data

def test_prediction_supported_states():
    resp = client.get("/api/models/supported-states")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) == 37
    assert any(s["state_name"] == "Maharashtra" for s in states)

def test_predict_incidence_post_and_get():
    # POST
    payload = {
        "state": "Maharashtra",
        "target_year": 2026,
        "growth_adjustment_pct": 0.0,
        "model_type": "bayesian_ridge"
    }
    resp_post = client.post("/api/models/predict/incidence", json=payload)
    assert resp_post.status_code == 200
    data_post = resp_post.json()
    assert data_post["state_name"] == "Maharashtra"
    assert data_post["geo_id"] == 28
    assert data_post["target_year"] == 2026
    assert data_post["predicted_incident_cases"] > 130000
    assert "confidence_interval_95" in data_post
    ci = data_post["confidence_interval_95"]
    assert ci["lower"] < data_post["predicted_incident_cases"] < ci["upper"]
    assert len(data_post["trajectory"]) >= 8 # 2019..2026
    assert data_post["external_reference"] is not None
    assert data_post["external_reference"]["year"] == 2026

    # GET
    resp_get = client.get("/api/models/predict/incidence?state=Maharashtra&target_year=2026&model_type=bayesian_ridge")
    assert resp_get.status_code == 200
    data_get = resp_get.json()
    assert data_get["predicted_incident_cases"] == data_post["predicted_incident_cases"]

def test_predict_incidence_growth_adjustment():
    baseline_resp = client.post("/api/models/predict/incidence", json={
        "state": "Maharashtra",
        "target_year": 2026,
        "growth_adjustment_pct": 0.0
    }).json()
    
    growth_resp = client.post("/api/models/predict/incidence", json={
        "state": "Maharashtra",
        "target_year": 2026,
        "growth_adjustment_pct": 5.0
    }).json()
    
    assert growth_resp["predicted_incident_cases"] > baseline_resp["predicted_incident_cases"]
    assert growth_resp["growth_adjustment_pct"] == 5.0

def test_predict_incidence_by_geoid():
    resp = client.post("/api/models/predict/incidence", json={
        "state": 28,
        "target_year": 2025
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["state_name"] == "Maharashtra"
    assert data["geo_id"] == 28

def test_predict_incidence_validation_errors():
    # Invalid state
    resp_bad_state = client.post("/api/models/predict/incidence", json={
        "state": "InvalidNonExistentTerritory",
        "target_year": 2026
    })
    assert resp_bad_state.status_code == 404

    # Target year out of range
    resp_bad_year = client.post("/api/models/predict/incidence", json={
        "state": "Maharashtra",
        "target_year": 2060
    })
    assert resp_bad_year.status_code == 422

def test_predict_incidence_tree_model_uncertainty():
    resp = client.post("/api/models/predict/incidence", json={
        "state": "Maharashtra",
        "target_year": 2026,
        "growth_adjustment_pct": 0.0,
        "model_type": "gradient_boosting"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_used"] == "gradient_boosting"
    assert data["validation_summary"]["loocv_mae"] == 4106.42
    ci = data["confidence_interval_95"]
    assert ci["has_valid_interval"] is False
    assert ci["margin_of_error"] is None
    assert "Point Estimator Only" in ci["type"]
    assert "lack a continuous posterior predictive distribution" in ci["methodology_note"]

def test_csv_export():
    resp = client.get("/api/reports/export-csv?table=Fact_State_Surveillance")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "attachment; filename=Fact_State_Surveillance_export.csv" in resp.headers["content-disposition"]
    lines = resp.text.strip().split("\n")
    assert len(lines) == 260 # 1 header + 259 rows

def test_sql_injection_prevention():
    # Attempting to export an unwhitelisted table must return 400
    resp = client.get("/api/reports/export-csv?table=users;DROP TABLE test;")
    assert resp.status_code == 400

def test_assistant_endpoint():
    # Test valid grounded query
    resp = client.post("/api/assistant/query", json={"query": "What are the top cancer burden states?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "top_burden_states"
    assert "Uttar Pradesh" in data["answer"]
    assert "Fact_State_Surveillance" in data["table_sources"]

    # Test clinical guardrail
    resp_clin = client.post("/api/assistant/query", json={"query": "Do I have cancer symptoms?"})
    assert resp_clin.status_code == 200
    data_clin = resp_clin.json()
    assert data_clin["intent"] == "clinical_out_of_scope"
    assert "does NOT offer individual clinical medical diagnoses" in data_clin["answer"]
