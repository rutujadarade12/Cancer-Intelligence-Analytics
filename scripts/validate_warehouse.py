#!/usr/bin/env python3
"""
Standalone Warehouse Validation Suite
Cancer Intelligence & Analytics — Phase 2.1
Validates warehouse/cancer_dw.db against expected schema, counts, grain uniqueness, and integrity rules.
Exit code: 0 = all critical checks PASS; 1 = one or more FAIL.
"""

import sqlite3
import sys
import os
import json

DB_PATH = os.path.join("warehouse", "cancer_dw.db")
VALIDATION_JSON_PATH = os.path.join("warehouse", "validation_results.json")

# National total specification (ICMR-NCRP / Parliament 2022 national estimate)
EXPECTED_NATIONAL_TOTAL_2022 = 1461427

# Documented numeric tolerance:
# In epidemiological demographic modeling, minor float rounding differences in aggregated tables
# must not exceed +/- 1.0 case. We mandate a strict absolute tolerance of 1.0 case.
NATIONAL_TOTAL_TOLERANCE_CASES = 1.0

EXPECTED_TABLES = [
    "Dim_Geography", "Dim_Cancer_Site", "Dim_Organ_System", "Dim_Time",
    "Dim_Measure_Type", "Dim_Registry",
    "Fact_State_Surveillance", "Fact_Cancer_Incidence",
    "Fact_State_Mortality_Surveillance", "Fact_PBCR_Surveillance",
    "Fact_Clinical_Stage", "Fact_Cancer_Trends_APC", "Fact_Screening_Programs",
    "Fact_Healthcare_Infrastructure_National", "Fact_Maharashtra_Infrastructure"
]

EXPECTED_VIEWS = [
    "vw_star_state_incidence", "vw_star_cancer_sites", "vw_state_mortality_ratios"
]

EXPECTED_MIN_COUNTS = {
    "Dim_Geography": 35,
    "Dim_Cancer_Site": 50,
    "Dim_Measure_Type": 5,
    "Dim_Time": 11,
    "Fact_State_Surveillance": 200,
    "Fact_Cancer_Incidence": 100,
    "Fact_State_Mortality_Surveillance": 150,
    "Fact_PBCR_Surveillance": 20,
    "Fact_Cancer_Trends_APC": 100,
}

EXPECTED_EPOCH_LABELS = {
    2022: "Extrapolated",
    2024: "Benchmark",
    2026: "Projected",
    2030: "Projected",
    2045: "Projected",
}

EXPECTED_MEASURE_CODES = [
    "PBCR_EMPIRICAL", "ICMR_NCRP_ESTIMATE", "KUMAR_EXP_2026", "GLOBOCAN_2024", "PARLIAMENT_MOHFW"
]

def check(label, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    print(f"  [{status}] {label}" + (f" — {detail}" if detail else ""))
    return bool(passed)

def main():
    results = []
    print("\n=== Cancer Intelligence Warehouse Validation Suite ===")
    print(f"DB Path: {os.path.abspath(DB_PATH)}\n")

    # Check DB file exists
    if not os.path.exists(DB_PATH):
        print(f"[FAIL] DB file not found: {DB_PATH}")
        sys.exit(1)
    
    print(f"Database file size: {os.path.getsize(DB_PATH):,} bytes\n")
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    
    # ---------------------------------------------------------
    # CHECK 1: Schema Objects (Tables and Views exist)
    # ---------------------------------------------------------
    print("--- CHECK 1: Schema Tables and Views existence ---")
    cur.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY type, name")
    found = {r[0]: r[1] for r in cur.fetchall()}
    
    for t in EXPECTED_TABLES:
        results.append(check(f"Table {t} exists", t in found, f"type={found.get(t, 'MISSING')}"))
    for v in EXPECTED_VIEWS:
        results.append(check(f"View {v} exists", v in found))
    
    # ---------------------------------------------------------
    # CHECK 2: Minimum Row Counts
    # ---------------------------------------------------------
    print("\n--- CHECK 2: Minimum row counts ---")
    for table, min_count in EXPECTED_MIN_COUNTS.items():
        cur.execute(f"SELECT COUNT(*) FROM [{table}]")
        cnt = cur.fetchone()[0]
        results.append(check(f"{table} row count >= {min_count}", cnt >= min_count, f"actual={cnt}"))
    
    # ---------------------------------------------------------
    # CHECK 3: Epoch Label Corrections
    # ---------------------------------------------------------
    print("\n--- CHECK 3: Epoch label classifications in Dim_Time ---")
    for year, expected_epoch in EXPECTED_EPOCH_LABELS.items():
        cur.execute("SELECT epoch_category FROM Dim_Time WHERE time_id = ?", (year,))
        row = cur.fetchone()
        actual = row[0] if row else "NOT FOUND"
        results.append(check(f"Dim_Time year={year} epoch='{expected_epoch}'", actual == expected_epoch, f"actual='{actual}'"))
    
    # ---------------------------------------------------------
    # CHECK 4: Conformed Measure Codes
    # ---------------------------------------------------------
    print("\n--- CHECK 4: Measure codes in Dim_Measure_Type ---")
    cur.execute("SELECT measure_code FROM Dim_Measure_Type")
    present_codes = {r[0] for r in cur.fetchall()}
    for code in EXPECTED_MEASURE_CODES:
        results.append(check(f"Measure code {code}", code in present_codes))
    
    # ---------------------------------------------------------
    # CHECK 5: Stray Footnote Filtering
    # ---------------------------------------------------------
    print("\n--- CHECK 5: Stray footnote rows in Fact_Cancer_Trends_APC ---")
    cur.execute("SELECT COUNT(*) FROM Fact_Cancer_Trends_APC WHERE LOWER(cancer_site) LIKE 'source:%'")
    stray = cur.fetchone()[0]
    results.append(check("No stray footnote rows in Fact_Cancer_Trends_APC", stray == 0, f"stray_count={stray}"))
    
    # ---------------------------------------------------------
    # CHECK 6: Referential Integrity (Foreign Keys)
    # ---------------------------------------------------------
    print("\n--- CHECK 6: Referential integrity across foreign keys ---")
    cur.execute("SELECT COUNT(*) FROM Fact_State_Surveillance WHERE geo_id NOT IN (SELECT geo_id FROM Dim_Geography)")
    orphan1 = cur.fetchone()[0]
    results.append(check("Fact_State_Surveillance geo_id FK valid", orphan1 == 0, f"orphans={orphan1}"))
    
    cur.execute("SELECT COUNT(*) FROM Fact_Cancer_Incidence WHERE site_id NOT IN (SELECT site_id FROM Dim_Cancer_Site)")
    orphan2 = cur.fetchone()[0]
    results.append(check("Fact_Cancer_Incidence site_id FK valid", orphan2 == 0, f"orphans={orphan2}"))
    
    cur.execute("SELECT COUNT(*) FROM Fact_State_Mortality_Surveillance WHERE geo_id NOT IN (SELECT geo_id FROM Dim_Geography)")
    orphan3 = cur.fetchone()[0]
    results.append(check("Fact_State_Mortality_Surveillance geo_id FK valid", orphan3 == 0, f"orphans={orphan3}"))
    
    cur.execute("SELECT COUNT(*) FROM Fact_State_Surveillance WHERE time_id NOT IN (SELECT time_id FROM Dim_Time)")
    orphan4 = cur.fetchone()[0]
    results.append(check("Fact_State_Surveillance time_id FK valid", orphan4 == 0, f"orphans={orphan4}"))
    
    cur.execute("SELECT COUNT(*) FROM Fact_State_Surveillance WHERE measure_type_id NOT IN (SELECT measure_type_id FROM Dim_Measure_Type)")
    orphan5 = cur.fetchone()[0]
    results.append(check("Fact_State_Surveillance measure_type_id FK valid", orphan5 == 0, f"orphans={orphan5}"))

    # ---------------------------------------------------------
    # CHECK 7: Numeric Integrity (Negative Values)
    # ---------------------------------------------------------
    print("\n--- CHECK 7: Numeric boundary (non-negative values) ---")
    cur.execute("SELECT COUNT(*) FROM Fact_State_Surveillance WHERE incident_cases < 0")
    neg1 = cur.fetchone()[0]
    results.append(check("No negative incident_cases in Fact_State_Surveillance", neg1 == 0, f"count={neg1}"))
    
    cur.execute("SELECT COUNT(*) FROM Fact_State_Mortality_Surveillance WHERE reported_incidence < 0 OR reported_deaths < 0")
    neg2 = cur.fetchone()[0]
    results.append(check("No negative values in Fact_State_Mortality_Surveillance", neg2 == 0, f"count={neg2}"))
    
    # ---------------------------------------------------------
    # CHECK 8: Completeness (NULL Values in Required Fields)
    # ---------------------------------------------------------
    print("\n--- CHECK 8: NULL checks in required metric columns ---")
    cur.execute("SELECT COUNT(*) FROM Fact_State_Surveillance WHERE incident_cases IS NULL")
    null1 = cur.fetchone()[0]
    results.append(check("No NULL incident_cases in Fact_State_Surveillance", null1 == 0, f"count={null1}"))
    
    cur.execute("SELECT COUNT(*) FROM Fact_State_Mortality_Surveillance WHERE reported_incidence IS NULL OR reported_deaths IS NULL")
    null2 = cur.fetchone()[0]
    results.append(check("No NULL incidence/deaths in Fact_State_Mortality_Surveillance", null2 == 0, f"count={null2}"))
    
    # ---------------------------------------------------------
    # CHECK 9: Epidemiological Ratios (MIR Boundaries)
    # ---------------------------------------------------------
    print("\n--- CHECK 9: Mortality-to-Incidence Ratio (MIR) domain bounds [0.0, 1.5] ---")
    cur.execute("SELECT COUNT(*) FROM Fact_State_Mortality_Surveillance WHERE mortality_incidence_ratio < 0.0 OR mortality_incidence_ratio > 1.5")
    invalid_mir = cur.fetchone()[0]
    results.append(check("All MIR values in [0.0, 1.5]", invalid_mir == 0, f"violations={invalid_mir}"))
    
    # ---------------------------------------------------------
    # CHECK 10: Percentage Bounds [0, 100]
    # ---------------------------------------------------------
    print("\n--- CHECK 10: Percentage bounds [0, 100] in Clinical Stage facts ---")
    cur.execute("SELECT COUNT(*) FROM Fact_Clinical_Stage WHERE advanced_stage_pct < 0 OR advanced_stage_pct > 100")
    invalid_stage = cur.fetchone()[0]
    results.append(check("Clinical stage pct in [0, 100]", invalid_stage == 0, f"violations={invalid_stage}"))
    
    # ---------------------------------------------------------
    # CHECK 11: National Total Sum Validation (PASS/FAIL with Tolerance)
    # ---------------------------------------------------------
    print("\n--- CHECK 11: National 2022 state incidence sum validation ---")
    cur.execute("""
        SELECT SUM(incident_cases), COUNT(*) 
        FROM Fact_State_Surveillance 
        WHERE time_id = 2022 
          AND measure_type_id = (SELECT measure_type_id FROM Dim_Measure_Type WHERE measure_code = 'ICMR_NCRP_ESTIMATE')
    """)
    s2022_row = cur.fetchone()
    s2022 = float(s2022_row[0]) if s2022_row[0] is not None else 0.0
    state_count_2022 = s2022_row[1]
    
    abs_diff = abs(s2022 - EXPECTED_NATIONAL_TOTAL_2022)
    pct_diff = (abs_diff / EXPECTED_NATIONAL_TOTAL_2022) * 100.0 if EXPECTED_NATIONAL_TOTAL_2022 else 0.0
    national_sum_passed = (abs_diff <= NATIONAL_TOTAL_TOLERANCE_CASES) and (state_count_2022 == 37)
    results.append(check(
        f"2022 state incidence sum == expected national total ({EXPECTED_NATIONAL_TOTAL_2022:,}) within tolerance (±{NATIONAL_TOTAL_TOLERANCE_CASES:.1f})",
        national_sum_passed,
        f"calculated_sum={s2022:,.1f}, state_rows={state_count_2022}, abs_diff={abs_diff:.4f}, pct_err={pct_diff:.4f}%"
    ))
    
    # ---------------------------------------------------------
    # CHECK 12: Fact_Cancer_Incidence Grain Uniqueness (Duplicate Check)
    # Grain: site_id, time_id, measure_type_id, gender
    # ---------------------------------------------------------
    print("\n--- CHECK 12: Fact_Cancer_Incidence grain uniqueness (no duplicate records) ---")
    cur.execute("""
        SELECT site_id, time_id, measure_type_id, gender, COUNT(*)
        FROM Fact_Cancer_Incidence
        GROUP BY site_id, time_id, measure_type_id, gender
        HAVING COUNT(*) > 1
    """)
    dups_incidence = cur.fetchall()
    dup_group_count = len(dups_incidence)
    results.append(check(
        "Fact_Cancer_Incidence grain uniqueness (site_id, time_id, measure_type_id, gender)",
        dup_group_count == 0,
        f"duplicate_groups={dup_group_count}"
    ))

    # ---------------------------------------------------------
    # CHECK 13: Provenance and Note Columns
    # ---------------------------------------------------------
    print("\n--- CHECK 13: Data provenance and documentation attributes ---")
    cur.execute("PRAGMA table_info(Fact_State_Mortality_Surveillance)")
    mort_cols = {r[1] for r in cur.fetchall()}
    results.append(check("Fact_State_Mortality_Surveillance has cancer_type_note column", "cancer_type_note" in mort_cols))

    cur.execute("PRAGMA table_info(Fact_Clinical_Stage)")
    cs_cols = {r[1] for r in cur.fetchall()}
    results.append(check("Fact_Clinical_Stage has source_measure_code", "source_measure_code" in cs_cols))
    
    cur.execute("PRAGMA table_info(Fact_Cancer_Trends_APC)")
    apc_cols = {r[1] for r in cur.fetchall()}
    results.append(check("Fact_Cancer_Trends_APC has source_measure_code", "source_measure_code" in apc_cols))
    
    cur.execute("PRAGMA table_info(Fact_PBCR_Surveillance)")
    pbcr_cols = {r[1] for r in cur.fetchall()}
    results.append(check("Fact_PBCR_Surveillance has time_period_note", "time_period_note" in pbcr_cols))
    
    # ---------------------------------------------------------
    # SUMMARY & JSON ARTIFACT GENERATION
    # ---------------------------------------------------------
    con.close()
    
    total = len(results)
    passed = sum(1 for r in results if r)
    failed = total - passed
    
    val_json = {
        "validation_timestamp": "2026-10-20",
        "total_checks_executed": total,
        "total_checks_passed": passed,
        "total_checks_failed": failed,
        "overall_status": "PASS" if failed == 0 else "FAIL",
        "national_total_validation_2022": {
            "calculated_sum": s2022,
            "expected_sum": EXPECTED_NATIONAL_TOTAL_2022,
            "tolerance_cases": NATIONAL_TOTAL_TOLERANCE_CASES,
            "absolute_difference": abs_diff,
            "percentage_error": round(pct_diff, 6),
            "state_rows_evaluated": state_count_2022,
            "status": "PASS" if national_sum_passed else "FAIL"
        },
        "duplicate_grain_validation": {
            "target_table": "Fact_Cancer_Incidence",
            "grain": ["site_id", "time_id", "measure_type_id", "gender"],
            "duplicate_groups_found": dup_group_count,
            "status": "PASS" if dup_group_count == 0 else "FAIL"
        },
        "referential_integrity": {
            "orphan_state_surveillance_geos": orphan1,
            "orphan_cancer_incidence_sites": orphan2,
            "orphan_state_mortality_geos": orphan3,
            "orphan_state_surveillance_times": orphan4,
            "orphan_state_surveillance_measures": orphan5,
            "status": "PASS" if (orphan1 + orphan2 + orphan3 + orphan4 + orphan5) == 0 else "FAIL"
        },
        "negative_values": {
            "negative_state_cases": neg1,
            "negative_mortality": neg2,
            "status": "PASS" if (neg1 + neg2) == 0 else "FAIL"
        },
        "null_required_fields": {
            "null_state_cases": null1,
            "null_mortality_fields": null2,
            "status": "PASS" if (null1 + null2) == 0 else "FAIL"
        },
        "domain_boundaries": {
            "invalid_mirs": invalid_mir,
            "invalid_stages": invalid_stage,
            "status": "PASS" if (invalid_mir + invalid_stage) == 0 else "FAIL"
        },
        "stray_footnote_rows": {
            "stray_count": stray,
            "status": "PASS" if stray == 0 else "FAIL"
        }
    }
    
    with open(VALIDATION_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(val_json, f, indent=2)
    
    print(f"\n=== SUMMARY: {passed}/{total} checks PASSED | {failed} FAILED ===")
    
    if failed > 0:
        print(f"VALIDATION RESULT: FAIL — {failed} checks failed.")
        sys.exit(1)
    else:
        print(f"VALIDATION RESULT: PASS — All {passed}/{total} checks passed.")
        sys.exit(0)

if __name__ == "__main__":
    main()
