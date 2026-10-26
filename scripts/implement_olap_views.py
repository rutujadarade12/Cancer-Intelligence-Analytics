"""
OLAP Analytical Views & Verification Script
Cancer Intelligence & Analytics — Phase 4
Implements and tests conformed OLAP views for Roll-up, Drill-down, Slice, Dice, and Pivot.
"""

import sqlite3
import os
import json
import pandas as pd

DB_PATH = os.path.join("warehouse", "cancer_dw.db")

def create_olap_views(conn):
    cur = conn.cursor()
    print("Creating conformed OLAP views...")
    
    cur.executescript("""
    -- 1. Regional Roll-up View (State -> Region Roll-up)
    DROP VIEW IF EXISTS vw_olap_regional_rollups;
    CREATE VIEW vw_olap_regional_rollups AS
    SELECT 
        g.region_zone,
        t.year,
        t.epoch_category,
        m.measure_code,
        COUNT(DISTINCT g.geo_id) AS state_count,
        ROUND(SUM(f.incident_cases), 1) AS total_regional_cases,
        ROUND(AVG(f.incident_cases), 1) AS avg_state_cases,
        ROUND(MIN(f.incident_cases), 1) AS min_state_cases,
        ROUND(MAX(f.incident_cases), 1) AS max_state_cases,
        ROUND(SUM(f.national_share_pct) * 100, 2) AS regional_share_pct
    FROM Fact_State_Surveillance f
    JOIN Dim_Geography g ON f.geo_id = g.geo_id
    JOIN Dim_Time t ON f.time_id = t.time_id
    JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id
    GROUP BY g.region_zone, t.year, t.epoch_category, m.measure_code;

    -- 2. Organ System Roll-up View (Site -> Organ System Roll-up)
    DROP VIEW IF EXISTS vw_olap_organ_system_burden;
    CREATE VIEW vw_olap_organ_system_burden AS
    SELECT 
        o.system_name,
        f.time_id AS year,
        f.gender,
        m.measure_code,
        COUNT(DISTINCT s.site_id) AS site_count,
        ROUND(SUM(f.incident_cases), 1) AS total_system_cases,
        ROUND(SUM(f.deaths), 1) AS total_system_deaths,
        ROUND(AVG(f.crude_rate), 2) AS avg_crude_rate,
        ROUND(AVG(f.age_adjusted_rate), 2) AS avg_age_adjusted_rate
    FROM Fact_Cancer_Incidence f
    JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
    JOIN Dim_Organ_System o ON s.organ_system_id = o.organ_system_id
    JOIN Dim_Measure_Type m ON f.measure_type_id = m.measure_type_id
    GROUP BY o.system_name, f.time_id, f.gender, m.measure_code;

    -- 3. State Multi-Period Pivot View (Pivot Operation)
    DROP VIEW IF EXISTS vw_olap_state_pivots;
    CREATE VIEW vw_olap_state_pivots AS
    SELECT 
        g.geo_id,
        g.state_name,
        g.state_code,
        g.region_zone,
        MAX(CASE WHEN f.time_id = 2019 THEN f.incident_cases END) AS cases_2019,
        MAX(CASE WHEN f.time_id = 2020 THEN f.incident_cases END) AS cases_2020,
        MAX(CASE WHEN f.time_id = 2021 THEN f.incident_cases END) AS cases_2021,
        MAX(CASE WHEN f.time_id = 2022 THEN f.incident_cases END) AS cases_2022,
        MAX(CASE WHEN f.time_id = 2026 THEN f.incident_cases END) AS cases_2026_forecast,
        MAX(CASE WHEN f.time_id = 2030 THEN f.incident_cases END) AS cases_2030_forecast,
        MAX(CASE WHEN f.time_id = 2045 THEN f.incident_cases END) AS cases_2045_forecast,
        MAX(f.cagr_observed) AS cagr_observed,
        MAX(f.cagr_projected) AS cagr_projected,
        MAX(CASE WHEN f.time_id = 2022 THEN f.national_share_pct END) AS national_share_2022
    FROM Dim_Geography g
    JOIN Fact_State_Surveillance f ON g.geo_id = f.geo_id
    GROUP BY g.geo_id, g.state_name, g.state_code, g.region_zone;

    -- 4. Registry Longitudinal Trend and Tobacco Attribution View
    DROP VIEW IF EXISTS vw_olap_pbcr_analytics;
    CREATE VIEW vw_olap_pbcr_analytics AS
    SELECT 
        r.registry_id,
        r.registry_name,
        r.region,
        p.time_period,
        p.gender,
        p.annual_cases,
        p.crude_rate,
        p.age_adjusted_rate,
        p.cum_risk_1_in_n,
        p.tobacco_share_pct,
        p.time_period_note
    FROM Fact_PBCR_Surveillance p
    JOIN Dim_Registry r ON p.registry_id = r.registry_id;

    -- 5. Infrastructure Consolidation View
    DROP VIEW IF EXISTS vw_olap_infrastructure_national;
    CREATE VIEW vw_olap_infrastructure_national AS
    SELECT 
        infra_id,
        indicator_name,
        facility_count,
        reporting_source
    FROM Fact_Healthcare_Infrastructure_National;
    """)
    conn.commit()
    print("All conformed OLAP views created successfully.")

def test_olap_operations(conn):
    results = {}
    print("\n--- Testing OLAP Operations ---")
    
    # 1. Roll-up Test: Regional sums for 2022 must reconcile to 1,461,427
    df_rollup = pd.read_sql_query("SELECT region_zone, total_regional_cases, regional_share_pct FROM vw_olap_regional_rollups WHERE year=2022 ORDER BY total_regional_cases DESC", conn)
    rollup_sum = float(df_rollup['total_regional_cases'].sum())
    expected = 1461427.0
    results["rollup_reconciliation_2022"] = {
        "calculated_sum": rollup_sum,
        "expected": expected,
        "status": "PASS" if abs(rollup_sum - expected) < 1.0 else "FAIL",
        "regional_breakdown": df_rollup.to_dict(orient="records")
    }
    print(f"  [ROLL-UP] Regional 2022 sum = {rollup_sum:,.1f} vs Expected {expected:,.1f} -> {results['rollup_reconciliation_2022']['status']}")

    # 2. Drill-down Test: Drilling from West Zone to its individual constituent states
    df_drilldown = pd.read_sql_query("""
        SELECT state_name, incident_cases, national_share_pct 
        FROM vw_star_state_incidence 
        WHERE region_zone = 'West' AND year = 2022 
        ORDER BY incident_cases DESC
    """, conn)
    results["drilldown_west_zone_2022"] = {
        "record_count": len(df_drilldown),
        "states": df_drilldown.to_dict(orient="records"),
        "status": "PASS" if len(df_drilldown) == 5 else "FAIL"
    }
    print(f"  [DRILL-DOWN] West Zone states drilled = {len(df_drilldown)} states (Expected 5) -> {results['drilldown_west_zone_2022']['status']}")

    # 3. Slice Test: Slicing by time_id = 2022 AND gender = 'Female' in Fact_Cancer_Incidence
    df_slice = pd.read_sql_query("""
        SELECT s.site_name, f.incident_cases, f.crude_rate, f.age_adjusted_rate
        FROM Fact_Cancer_Incidence f
        JOIN Dim_Cancer_Site s ON f.site_id = s.site_id
        WHERE f.time_id = 2022 AND f.gender = 'Female'
        ORDER BY f.incident_cases DESC
    """, conn)
    
    # Separate All sites aggregate row and top specific anatomical site
    all_sites_row = df_slice[df_slice['site_name'].str.lower() == 'all sites']
    specific_sites = df_slice[df_slice['site_name'].str.lower() != 'all sites']
    top_specific = specific_sites.iloc[0] if len(specific_sites) > 0 else None

    results["slice_female_2022"] = {
        "record_count": len(df_slice),
        "total_female_all_sites": float(all_sites_row.iloc[0]['incident_cases']) if len(all_sites_row) > 0 else 0,
        "top_anatomical_site": str(top_specific['site_name']) if top_specific is not None else None,
        "top_anatomical_cases": float(top_specific['incident_cases']) if top_specific is not None else 0,
        "status": "PASS" if top_specific is not None and top_specific['site_name'] == "Breast" else "FAIL"
    }
    print(f"  [SLICE] Female 2022: Total={results['slice_female_2022']['total_female_all_sites']:,.0f}, Top Site={results['slice_female_2022']['top_anatomical_site']} ({results['slice_female_2022']['top_anatomical_cases']:,.0f} cases) -> {results['slice_female_2022']['status']}")

    # 4. Dice Test: Dicing by region IN ('North', 'East') AND year IN (2020, 2022)
    df_dice = pd.read_sql_query("""
        SELECT region_zone, year, SUM(incident_cases) as dice_cases, COUNT(DISTINCT state_name) as state_count
        FROM vw_star_state_incidence
        WHERE region_zone IN ('North', 'East') AND year IN (2020, 2022)
        GROUP BY region_zone, year
        ORDER BY region_zone, year
    """, conn)
    results["dice_north_east_2020_2022"] = {
        "groups": len(df_dice),
        "data": df_dice.to_dict(orient="records"),
        "status": "PASS" if len(df_dice) == 4 else "FAIL"
    }
    print(f"  [DICE] North & East in (2020, 2022) cell count = {len(df_dice)} cells (Expected 4) -> {results['dice_north_east_2020_2022']['status']}")

    # 5. Pivot Test: Verify 37 states pivoted across 7 time columns
    df_pivot = pd.read_sql_query("SELECT state_name, cases_2019, cases_2020, cases_2021, cases_2022, cases_2026_forecast FROM vw_olap_state_pivots ORDER BY cases_2022 DESC", conn)
    results["pivot_37_states"] = {
        "row_count": len(df_pivot),
        "null_2022_count": int(df_pivot['cases_2022'].isna().sum()),
        "status": "PASS" if len(df_pivot) == 37 and df_pivot['cases_2022'].isna().sum() == 0 else "FAIL"
    }
    print(f"  [PIVOT] 37 states pivoted across time columns = {len(df_pivot)} rows, 0 nulls in 2022 -> {results['pivot_37_states']['status']}")

    return results

def main():
    conn = sqlite3.connect(DB_PATH)
    try:
        create_olap_views(conn)
        test_results = test_olap_operations(conn)
        
        output_file = os.path.join("warehouse", "olap_test_results.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(test_results, f, indent=2)
        print("\nOLAP verification completed successfully. Artifact saved to:", output_file)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
