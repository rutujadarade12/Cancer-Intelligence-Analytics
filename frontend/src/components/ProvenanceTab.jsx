import React from "react";
import { Database, ShieldCheck, FileCheck, Layers, BookOpen, AlertTriangle, ArrowRight } from "lucide-react";

export default function ProvenanceTab() {
  const datasets = [
    {
      id: "DS1",
      name: "Dataset 1: State/UT Cancer Incidence Surveillance (2019–2022)",
      source: "MoHFW Lok Sabha Unstarred Question No. 2486 (Answered Aug 2023)",
      provenance: "ICMR-NCRP population-based registry pooling extrapolation across 37 States & UTs",
      grain: "State × Year (2019, 2020, 2021, 2022)",
      measureCode: "ICMR_NCRP_ESTIMATE / PARLIAMENT_MOHFW",
      records: "148 records across 37 geographic entities (2022 National Total: 1,461,427 cases)",
      status: "Verified & Fully Conformed"
    },
    {
      id: "DS2",
      name: "Dataset 2: Site-Specific & Sex-Stratified Projections (2021–2025)",
      source: "MoHFW Rajya Sabha Parliamentary Question Annexure-II (Answered Dec 2021)",
      provenance: "Kumar et al. / ICMR-NCRP exponential model projection based on historical registry trends",
      grain: "Cancer Site × Sex × Projected Year (2021, 2022, 2023, 2024, 2025)",
      measureCode: "KUMAR_EXP_2026",
      records: "19 leading anatomical sites + All-sites summary for Males and Females",
      status: "Conformed to Dim_Cancer_Site"
    },
    {
      id: "DS3",
      name: "Dataset 3: ICMR-NCRP National Cancer Registry Programme Report",
      source: "Mathur et al., JCO Global Oncology (2020) & ICMR-NCRP 2020 Monograph",
      provenance: "Empirical registry data from 28 Population Based Cancer Registries (PBCRs) & 96 HBCRs",
      grain: "Registry / Site × Stage Distribution (I-IV) & Annual Percent Change (APC 2010–2019)",
      measureCode: "PBCR_EMPIRICAL / JCO_2020_HBCR / JCO_2020_APC",
      records: "28 PBCR profiles, 11 organ systems clinical stage breakdown, 108 APC trend lines",
      status: "Multi-year period annotated"
    },
    {
      id: "DS4",
      name: "Dataset 4: WHO / IARC GLOBOCAN 2024 India Factsheet",
      source: "International Agency for Research on Cancer (IARC), World Health Organization (2024)",
      provenance: "Global standard epidemiological benchmark, crude & age-standardized rates (ASR)",
      grain: "National Aggregate × Leading Cancer Sites × Gender",
      measureCode: "GLOBOCAN_2024",
      records: "National incidence (1,413,316 cases), 916,827 deaths, 3,258,000 5-year prevalence",
      status: "International Standard Benchmark"
    },
    {
      id: "DS5",
      name: "Dataset 5: State Mortality & Incidence Surveillance (2022–2023)",
      source: "MoHFW Lok Sabha Question Annexure-III (Answered Dec 2023)",
      provenance: "Parliamentary state-level surveillance table with reported incidence and deaths",
      grain: "State × Year (2022, 2023)",
      measureCode: "PARLIAMENT_MOHFW",
      records: "74 records (37 states × 2 years) with Mortality-to-Incidence Ratio (MIR)",
      status: "Annotated: Unidentified Site Specificity Note Preserved",
      note: "CRITICAL PROVENANCE: National incidence scale (~77K cases) indicates single-site surveillance (ovarian proxy), NOT all-cancer totals. Preserved with explicit cancer_type_note metadata column."
    },
    {
      id: "DS6",
      name: "Dataset 6: Healthcare Infrastructure & Tertiary Oncology Capacity",
      source: "National Health Mission, MoHFW Parliamentary Question & PMSSY Records",
      provenance: "Central Government Tertiary Care Cancer Center (TCCC) and State Cancer Institute (SCI) grants",
      grain: "Center / District × Sanctioned vs Released Capex & Screening Program Metrics",
      measureCode: "PARLIAMENT_MOHFW",
      records: "19 approved National SCIs/TCCCs + 36 Maharashtra District Oncology Profiles",
      status: "Operational Metrics Conformed"
    }
  ];

  const measureTypes = [
    {
      code: "PBCR_EMPIRICAL",
      name: "Population-Based Cancer Registry Empirical Counts",
      description: "Direct patient-level registration and microscopic/histopathological verification from accredited PBCR hospital networks.",
      modeled: "No (0)",
      epoch: "Historical",
      confidence: "Gold Standard (Direct Clinical Registry Observation)"
    },
    {
      code: "ICMR_NCRP_ESTIMATE",
      name: "ICMR-NCRP Registry Pooling National/State Estimates",
      description: "Standardized regional incidence rates pooled across 28 PBCRs and applied to Census population structures.",
      modeled: "No (0, Extrapolated)",
      epoch: "Extrapolated",
      confidence: "National Health Authority Official Estimates"
    },
    {
      code: "KUMAR_EXP_2026",
      name: "Exponential Trend Growth Projections",
      description: "Mathematical models (log-linear and exponential growth) modeling demographic changes and behavioral risk escalation.",
      modeled: "Yes (1)",
      epoch: "Projected",
      confidence: "Parametric Forecast Model"
    },
    {
      code: "GLOBOCAN_2024",
      name: "WHO / IARC Epidemiological Benchmark",
      description: "Harmonized international estimates enabling cross-country comparisons with standardized age weighting (WHO World Standard).",
      modeled: "No (0, Standardized)",
      epoch: "Benchmark",
      confidence: "International Standard Reference"
    },
    {
      code: "PARLIAMENT_MOHFW",
      name: "Ministry of Health & Family Welfare Official Returns",
      description: "Official statistics tabled before Lok Sabha and Rajya Sabha sessions by the Union Health Minister.",
      modeled: "No (0, Official Return)",
      epoch: "Historical / Extrapolated",
      confidence: "Official Government of India Parliamentary Record"
    }
  ];

  const syllabusUnits = [
    {
      unit: "Unit 1: Data Warehousing & Architecture",
      topics: "Multi-tier DW architecture, Star Schema, Fact & Dimension tables, Conformed Dimensions, Grain definitions, Surrogate keys.",
      implementation: "15 conformed tables, 6 core dimensions (Geography, Site, Organ System, Time, Measure Type, Registry), surrogate integer PKs, strict foreign key constraints."
    },
    {
      unit: "Unit 2: ETL Pipeline & Data Preprocessing",
      topics: "Data extraction from heterogeneous formats, cleaning missing/stray values, deduplication, schema normalization, atomic transaction commits.",
      implementation: "Python ETL pipeline with temporary database staging, SHA-256 backup verification, zero silent imputation, 55 automated integrity checks."
    },
    {
      unit: "Unit 3: OLAP Operations & Multidimensional Views",
      topics: "Roll-up, Drill-down, Slice, Dice, Pivot, conformed summary aggregation across dimensional hierarchies.",
      implementation: "5 conformed OLAP views (regional rollups, organ system burden, state pivots, PBCR analytics, infrastructure) queried in real-time."
    },
    {
      unit: "Unit 4: Supervised Learning (Classification & Regression)",
      topics: "Linear & Ridge Regression, Decision Tree induction (ID3/CART), Naive Bayes probabilistic classifier, confusion matrix, precision/recall/F1.",
      implementation: "Incidence forecasting (R²=1.0, MAE=12.99), Decision Tree burden quartile classifier (Depth=3, Acc=62.16%), Naive Bayes tobacco attribution (Acc=88.0%, Recall=100%)."
    },
    {
      unit: "Unit 5: Unsupervised Learning (Clustering)",
      topics: "K-Means partitioning, Silhouette evaluation, Hierarchical Agglomerative clustering (Ward linkage), Dendrogram distance matrix, Cophenetic correlation.",
      implementation: "K-Means (k=4 clusters, Silhouette=0.5218), Hierarchical Agglomerative clustering (Ward linkage, Cophenetic correlation=0.7919)."
    },
    {
      unit: "Unit 6: Association Rule Mining",
      topics: "Apriori algorithm, Market Basket Analysis, Support, Confidence, Lift metric, Itemsets generation.",
      implementation: "State epidemiological profile mining 25 frequent association rules (Max Lift=2.4667) linking high incidence and projected growth with national burden share."
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div className="card" style={{ borderLeft: "4px solid var(--accent-secondary)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{
            background: "rgba(6, 182, 212, 0.15)",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            color: "var(--accent-secondary)"
          }}>
            <Database size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "6px" }}>
              Data Provenance, Lineage & DWM Academic Mapping
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Cancer Intelligence & Analytics adheres to rigorous data warehousing integrity. Every figure in the warehouse originates from verified official health repositories, with full traceability from raw parliamentary annexures to conformed star schema facts.
            </p>
          </div>
        </div>
      </div>

      {/* Non-Clinical Ethical Disclaimer Callout */}
      <div className="alert-box warning">
        <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>Epidemiological & Educational System Notice:</strong>
          <p style={{ marginTop: "4px", fontSize: "0.85rem", lineHeight: "1.45" }}>
            This system is strictly designed for epidemiological research, healthcare resource allocation analysis, and Data Warehousing & Mining (DWM) academic evaluation. It must <strong>never</strong> be utilized as a direct diagnostic clinical tool or an individual patient prognosis calculator.
          </p>
        </div>
      </div>

      {/* Raw Datasets Lineage */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="var(--accent-primary)" />
            Source Repositories & Raw Datasets (Data/ Directory)
          </div>
          <span className="badge badge-teal">6 Verified Data Feeds</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {datasets.map((ds) => (
            <div
              key={ds.id}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "16px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>
                  {ds.name}
                </h3>
                <span className="badge badge-orange">{ds.measureCode}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Primary Source: </span>
                  <span style={{ color: "var(--text-primary)" }}>{ds.source}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Epidemiological Grain: </span>
                  <span style={{ color: "var(--text-primary)" }}>{ds.grain}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Volume & Scope: </span>
                  <span style={{ color: "var(--text-primary)" }}>{ds.records}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Methodology: </span>
                  <span style={{ color: "var(--text-primary)" }}>{ds.provenance}</span>
                </div>
              </div>
              {ds.note && (
                <div style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  background: "rgba(245, 158, 11, 0.1)",
                  borderLeft: "3px solid var(--accent-warning)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.8rem",
                  color: "var(--text-primary)"
                }}>
                  {ds.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dim_Measure_Type Taxonomy */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileCheck size={18} color="var(--accent-secondary)" />
            Dimension: Dim_Measure_Type Conformed Classification
          </div>
          <span className="badge badge-blue">Audit Grade Standards</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "14px" }}>
          In accordance with healthcare surveillance guidelines, empirical clinical counts are rigorously isolated from mathematical forecasts and multi-registry extrapolations.
        </p>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Measure Code</th>
                <th>Classification Name</th>
                <th>Is Modeled?</th>
                <th>Epoch Category</th>
                <th>Epidemiological Methodology</th>
                <th>Assurance Level</th>
              </tr>
            </thead>
            <tbody>
              {measureTypes.map((mt) => (
                <tr key={mt.code}>
                  <td style={{ fontWeight: "700", fontFamily: "var(--mono)" }}>{mt.code}</td>
                  <td>{mt.name}</td>
                  <td>
                    <span className={`badge ${mt.modeled.startsWith("Yes") ? "badge-orange" : "badge-green"}`}>
                      {mt.modeled}
                    </span>
                  </td>
                  <td><span className="badge badge-teal">{mt.epoch}</span></td>
                  <td style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>{mt.description}</td>
                  <td style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-primary)" }}>{mt.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DWM Academic Syllabus Coverage */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <BookOpen size={18} color="var(--accent-info)" />
            Academic Curriculum Alignment: Data Warehousing & Data Mining (Sem V CMPN)
          </div>
          <span className="badge badge-green">100% Syllabus Coverage</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
          {syllabusUnits.map((u, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "16px"
              }}
            >
              <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--accent-info)", marginBottom: "6px" }}>
                {u.unit}
              </h4>
              <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                <strong>Key Concepts:</strong> {u.topics}
              </p>
              <div style={{
                fontSize: "0.85rem",
                color: "var(--text-primary)",
                background: "var(--bg-card)",
                padding: "10px",
                borderRadius: "var(--radius-sm)",
                borderLeft: "3px solid var(--accent-primary)"
              }}>
                <strong>Implemented Deliverable:</strong> {u.implementation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety & Integrity Architecture */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ShieldCheck size={18} color="var(--accent-success)" />
            ETL Safety & Database Transaction Commit Guarantees
          </div>
          <span className="badge badge-green">55/55 Verification Checks Passed</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", fontSize: "0.85rem" }}>
          <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <h5 style={{ fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)" }}>Zero Silent Imputation</h5>
            <p style={{ color: "var(--text-secondary)" }}>
              No arbitrary mean-filling or synthetic record invention. Historical and projected rows preserve explicit provenance flags.
            </p>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <h5 style={{ fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)" }}>Atomic Staging Replacement</h5>
            <p style={{ color: "var(--text-secondary)" }}>
              Rebuilds execute strictly in `cancer_dw_TEMP.db`. Database replacement occurs only after all 55 critical schema checks pass.
            </p>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <h5 style={{ fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)" }}>Non-Destructive Backups</h5>
            <p style={{ color: "var(--text-secondary)" }}>
              Timestamped SQLite snapshots are archived prior to any ETL phase. Original archives and previous backups are permanently preserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
