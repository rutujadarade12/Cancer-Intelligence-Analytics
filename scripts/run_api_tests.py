"""
API Endpoint Test Runner
Cancer Intelligence & Analytics — Phase 6
Executes all API tests against FastAPI app using TestClient and reports results.
"""

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from backend.tests.test_api import (
    test_root,
    test_health_check,
    test_dashboard_summary,
    test_geography_endpoints,
    test_cancer_sites_endpoints,
    test_trends_endpoints,
    test_mortality_endpoints,
    test_infrastructure_endpoints,
    test_olap_endpoints,
    test_models_endpoints,
    test_prediction_supported_states,
    test_predict_incidence_post_and_get,
    test_predict_incidence_growth_adjustment,
    test_predict_incidence_by_geoid,
    test_predict_incidence_validation_errors,
    test_predict_incidence_tree_model_uncertainty,
    test_csv_export,
    test_sql_injection_prevention,
    test_assistant_endpoint
)

def run_tests():
    tests = [
        ("Root Endpoint", test_root),
        ("Health Check", test_health_check),
        ("Dashboard Summary (KPIs & Regional)", test_dashboard_summary),
        ("Geography & State Endpoints", test_geography_endpoints),
        ("Cancer Sites & Organ Systems", test_cancer_sites_endpoints),
        ("Trends, APC & PBCR Endpoints", test_trends_endpoints),
        ("Mortality & MIR Analytics", test_mortality_endpoints),
        ("Infrastructure (National & MH)", test_infrastructure_endpoints),
        ("OLAP Rollup, Slice & Pivots", test_olap_endpoints),
        ("Data Mining Models Endpoints", test_models_endpoints),
        ("Prediction Engine Supported States (37 States)", test_prediction_supported_states),
        ("Dynamic Incidence Forecasting (Bayesian Ridge & CI)", test_predict_incidence_post_and_get),
        ("Growth Adjustment Scenario Compounding (+5.0%)", test_predict_incidence_growth_adjustment),
        ("Incidence Forecasting by Geo ID (Geo ID 28)", test_predict_incidence_by_geoid),
        ("Incidence Forecasting Error Validation (404/422)", test_predict_incidence_validation_errors),
        ("Tree Model Uncertainty Guard (Point Estimator Only)", test_predict_incidence_tree_model_uncertainty),
        ("CSV Data Export Service", test_csv_export),
        ("SQL Injection Prevention Guard", test_sql_injection_prevention),
        ("Cancer Analytics Assistant Query & Guardrails", test_assistant_endpoint)
    ]
    
    print("\n=== Running FastAPI Backend Integration Tests ===")
    passed = 0
    failed = 0
    
    for name, fn in tests:
        try:
            fn()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name} — Error: {str(e)}")
            failed += 1
            
    print(f"\n=== BACKEND TEST SUMMARY: {passed}/{len(tests)} PASSED | {failed} FAILED ===")
    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_tests()
