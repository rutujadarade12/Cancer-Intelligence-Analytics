import React, { useState, useEffect } from "react";
import { Download, FileText, Database, Table, CheckCircle2, ExternalLink, HardDrive, AlertCircle } from "lucide-react";
import { api } from "../services/api";

export default function ExportsTab() {
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState("");

  const tables = [
    { name: "Dim_Geography", type: "Dimension", rows: 37, desc: "States, UTs, zones, capitals and Census population" },
    { name: "Dim_Cancer_Site", type: "Dimension", rows: 76, desc: "75 ICD-10 anatomical cancer sites + 1 all-sites aggregate benchmark" },
    { name: "Dim_Organ_System", type: "Dimension", rows: 11, desc: "Physiological organ systems and clinical hierarchies" },
    { name: "Dim_Time", type: "Dimension", rows: 11, desc: "Temporal registry years, projections, and conformed epochs" },
    { name: "Dim_Measure_Type", type: "Dimension", rows: 5, desc: "Standardized taxonomy (empirical, extrapolated, modeled)" },
    { name: "Dim_Registry", type: "Dimension", rows: 32, desc: "32 Population-Based Cancer Registries (PBCRs)" },
    { name: "Fact_State_Surveillance", type: "Fact", rows: 259, desc: "Historical & projected state cancer incidence (2019-2025)" },
    { name: "Fact_Cancer_Incidence", type: "Fact", rows: 190, desc: "Site-specific cancer counts across males and females" },
    { name: "Fact_State_Mortality_Surveillance", type: "Fact", rows: 185, desc: "State-level cancer mortality and MIR metrics (2021-2025)" },
    { name: "Fact_PBCR_Surveillance", type: "Fact", rows: 64, desc: "Empirical registry annual cases, crude rates & ASRs (Male & Female)" },
    { name: "Fact_Clinical_Stage", type: "Fact", rows: 11, desc: "Clinical presentation stages I to IV across organ sites" },
    { name: "Fact_Cancer_Trends_APC", type: "Fact", rows: 108, desc: "Annual Percent Change (APC) trends across PBCRs (2010-2019)" },
    { name: "Fact_Screening_Programs", type: "Fact", rows: 37, desc: "Oral, breast, and cervical community screening metrics" },
    { name: "Fact_Healthcare_Infrastructure_National", type: "Fact", rows: 19, desc: "Sanctioned Tertiary Care Cancer Centers & SCIs" },
    { name: "Fact_Maharashtra_Infrastructure", type: "Fact", rows: 36, desc: "District-level oncological radiotherapy and bed capacity" }
  ];

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await api.getReportsList();
        setReports(Array.isArray(data) ? data : (data.reports || []));
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoadingReports(false);
      }
    }
    loadReports();
  }, []);

  const handleDownloadTable = (tableName) => {
    const url = api.getExportUrl(tableName);
    window.open(url, "_blank");
    setDownloadSuccess(`Export initiated for ${tableName}.csv`);
    setTimeout(() => setDownloadSuccess(""), 4000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div className="card" style={{ borderLeft: "4px solid var(--accent-primary)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{
            background: "rgba(249, 115, 22, 0.15)",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            color: "var(--accent-primary)"
          }}>
            <Download size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "6px" }}>
              Data Warehouse Exports & Audit Documentation
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Download complete conformed star schema datasets in standard CSV format for external validation, or review the complete technical documentation archive generated across all project lifecycle phases.
            </p>
          </div>
        </div>
      </div>

      {/* Download Alert Notification */}
      {downloadSuccess && (
        <div className="alert-box" style={{ background: "rgba(16, 185, 129, 0.1)", borderLeftColor: "var(--accent-success)" }}>
          <CheckCircle2 size={20} color="var(--accent-success)" />
          <span style={{ color: "var(--accent-success)", fontWeight: "600" }}>{downloadSuccess}</span>
        </div>
      )}

      {/* Warehouse Tables Export Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Database size={18} color="var(--accent-primary)" />
            Conformed Data Warehouse Tables (15 SQLite Entities)
          </div>
          <span className="badge badge-teal">Live Database Extracts</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
          Clicking any table triggers an automated CSV export directly from the conformed SQLite data warehouse (<code>warehouse/cancer_dw.db</code>).
        </p>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Table Name</th>
                <th>Classification</th>
                <th>Grain & Description</th>
                <th>Records</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((tbl) => (
                <tr key={tbl.name}>
                  <td style={{ fontWeight: "700", fontFamily: "var(--mono)" }}>{tbl.name}</td>
                  <td>
                    <span className={`badge ${tbl.type === "Fact" ? "badge-orange" : "badge-blue"}`}>
                      {tbl.type}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{tbl.desc}</td>
                  <td style={{ fontWeight: "600" }}>{tbl.rows.toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => handleDownloadTable(tbl.name)}
                    >
                      <Download size={14} />
                      Export CSV
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Reports Archive */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} color="var(--accent-secondary)" />
            Technical Documentation & Audit Reports Archive (reports/ Directory)
          </div>
          <span className="badge badge-blue">{reports.length} Verified Reports</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
          Every phase of the project lifecycle produces an immutable Markdown report detailing schema design, mathematical validation checks, algorithm performance, and architectural decisions.
        </p>

        {loadingReports ? (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
            Loading reports directory...
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "14px" }}>
            {reports.map((rep, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <FileText size={16} color="var(--accent-secondary)" />
                    <span style={{ fontWeight: "600", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      {rep.filename}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", display: "flex", gap: "12px" }}>
                    <span>Size: {(rep.size_bytes / 1024).toFixed(1)} KB</span>
                    <span>Updated: {new Date(rep.modified * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ marginTop: "12px" }}>
                  <span className="badge badge-teal" style={{ fontSize: "0.7rem" }}>Verified Audit Record</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup & Persistence Info */}
      <div className="card" style={{ background: "var(--bg-secondary)" }}>
        <div className="card-header">
          <div className="card-title">
            <HardDrive size={18} color="var(--accent-success)" />
            Data Persistence & Backup Security
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", fontSize: "0.85rem" }}>
          <div>
            <h4 style={{ fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>Primary Warehouse File</h4>
            <code style={{ fontSize: "0.8rem", color: "var(--accent-primary)" }}>warehouse/cancer_dw.db</code>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Contains 15 conformed tables, 8 OLAP analytical views, and indexes on all foreign key dimensions.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>Immutable Historical Snapshots</h4>
            <code style={{ fontSize: "0.8rem", color: "var(--accent-secondary)" }}>warehouse/cancer_dw_backup_*.db</code>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Timestamped SQLite backups preserved before each major data warehouse transformation step.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>Data Mining Models Artifact</h4>
            <code style={{ fontSize: "0.8rem", color: "var(--accent-success)" }}>warehouse/data_mining_results.json</code>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              Stores precomputed metrics, tree splits, cluster centroids, and Apriori association rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
