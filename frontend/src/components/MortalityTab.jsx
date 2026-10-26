import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { HeartPulse, AlertTriangle, ShieldCheck, AlertCircle, RefreshCw, ArrowUpDown, Search, BarChart2 } from "lucide-react";
import ScatterPlot from "./charts/ScatterPlot";

export default function MortalityTab() {
  const [mortalityData, setMortalityData] = useState([]);
  const [mirSummary, setMirSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2022);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("reported_deaths");
  const [sortAsc, setSortAsc] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [mortResult, mirResult] = await Promise.allSettled([
      api.getStateMortality(selectedYear),
      api.getMirSummary(selectedYear)
    ]);

    let errors = [];

    if (mortResult.status === "fulfilled" && Array.isArray(mortResult.value)) {
      setMortalityData(mortResult.value);
    } else {
      setMortalityData([]);
      if (mortResult.status === "rejected") {
        errors.push(`Mortality Data: ${mortResult.reason?.message || "Request failed"}`);
      }
    }

    if (mirResult.status === "fulfilled" && mirResult.value && typeof mirResult.value === "object") {
      setMirSummary(mirResult.value);
    } else {
      setMirSummary(null);
      if (mirResult.status === "rejected") {
        errors.push(`MIR Summary: ${mirResult.reason?.message || "Request failed"}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(" | "));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredMortality = mortalityData
    .filter((m) =>
      m.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.region_zone && m.region_zone.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const zoneColors = {
    Central: "#F97316",
    South: "#06B6D4",
    East: "#3B82F6",
    West: "#10B981",
    North: "#8B5CF6",
    "North East": "#EC4899"
  };

  return (
    <div>
      {/* Strict Unassigned Cancer Site Disclaimer */}
      <div className="alert-box warning" style={{ marginBottom: "20px" }}>
        <AlertTriangle size={24} color="var(--accent-warning)" style={{ flexShrink: 0 }} />
        <div>
          <strong>Epidemiological Notice on Dataset 5 Surveillance:</strong> The figures below originate from Ministry of Health and Family Welfare (MOHFW) Parliamentary replies (2021–2025). The source table presents state-wise cancer incidence and mortality without specifying an anatomical cancer site. The national scale (~77,426 cases in 2022) is roughly 5.3% of the all-cancer total (1.46M) and aligns closely with single-organ estimates (e.g., ovarian cancer proxy). <strong>These numbers must NOT be treated as all-cancer mortality.</strong>
        </div>
      </div>

      <div className="card-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <HeartPulse size={22} color="var(--accent-secondary)" />
            Mortality Surveillance & Mortality-to-Incidence Ratios (MIR)
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            State-by-state mortality reporting and computed MIR ratios across 37 States and Union Territories.
          </p>
        </div>

        {/* Year Selector & Search */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search state..."
              className="form-control"
              style={{ paddingLeft: "30px", width: "160px", fontSize: "0.8rem" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>Year:</span>
            <select
              className="form-control"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2021, 2022, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-box" style={{ background: "rgba(239, 68, 68, 0.1)", borderLeftColor: "var(--accent-danger)", marginBottom: "20px" }}>
          <AlertCircle size={20} color="var(--accent-danger)" />
          <div style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-primary)" }}>
            <strong>Network or Query Notice:</strong> {error}. Ensure backend is running at <code>http://127.0.0.1:8000</code>.
          </div>
          <button className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }} onClick={loadData}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* MIR KPI Cards */}
      {mirSummary && (
        <div className="kpi-grid">
          <div className="kpi-card teal">
            <div className="kpi-title">Average Cohort MIR</div>
            <div className="kpi-value">{((mirSummary.avg_mir || 0) * 100).toFixed(2)}%</div>
            <div className="kpi-subtitle">Mean Deaths per Incidence Case</div>
          </div>

          <div className="kpi-card blue">
            <div className="kpi-title">Total Cohort Incidence</div>
            <div className="kpi-value">{mirSummary.total_cohort_incidence?.toLocaleString() || "—"}</div>
            <div className="kpi-subtitle">Dataset 5 National Cases ({selectedYear})</div>
          </div>

          <div className="kpi-card orange">
            <div className="kpi-title">Total Cohort Deaths</div>
            <div className="kpi-value">{mirSummary.total_cohort_deaths?.toLocaleString() || "—"}</div>
            <div className="kpi-subtitle">Dataset 5 National Deaths ({selectedYear})</div>
          </div>

          <div className="kpi-card green">
            <div className="kpi-title">MIR Range (Excl. Ladakh)</div>
            <div className="kpi-value">50.0% – 58.0%</div>
            <div className="kpi-subtitle">Ladakh = 100% (Small Number: 1/1)</div>
          </div>
        </div>
      )}

      {/* Mortality vs Incidence 2D Scatter Plot */}
      {!loading && filteredMortality.length > 0 && (
        <ScatterPlot
          data={filteredMortality}
          xKey="reported_incidence"
          yKey="reported_deaths"
          labelKey="state_name"
          sizeKey="mortality_incidence_ratio"
          colorKey="region_zone"
          colorMap={zoneColors}
          xLabel="Reported Incidence (Cases)"
          yLabel="Reported Deaths"
          xFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString()}
          yFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString()}
          title={`Mortality vs Incidence Correlation Matrix (${selectedYear})`}
          subtitle="Evaluating health system lethality (MIR) across states. Point radius indicates computed Mortality-to-Incidence Ratio (MIR)."
          badgeText="Single-Site Cohort (DS5)"
        />
      )}

      {/* Mortality Surveillance Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          Loading mortality surveillance...
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <HeartPulse size={18} color="var(--accent-primary)" />
              State-Wise Reported Incidence, Deaths & MIR ({selectedYear})
            </span>
            <span className="badge badge-teal">{filteredMortality.length} States Displayed</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("state_name")} style={{ cursor: "pointer" }}>
                    State / UT <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("region_zone")} style={{ cursor: "pointer" }}>
                    Region Zone <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("reported_incidence")} style={{ cursor: "pointer" }}>
                    Reported Incidence <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("reported_deaths")} style={{ cursor: "pointer" }}>
                    Reported Deaths <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("mortality_incidence_ratio")} style={{ cursor: "pointer" }}>
                    Mortality-to-Incidence Ratio (MIR) <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th>Data Lineage Tag</th>
                </tr>
              </thead>
              <tbody>
                {filteredMortality.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No mortality surveillance records match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredMortality.map((m) => (
                    <tr key={m.fact_mort_id}>
                      <td style={{ fontWeight: "600" }}>{m.state_name}</td>
                      <td><span className="badge badge-gray">{m.region_zone}</span></td>
                      <td style={{ fontWeight: "700" }}>{m.reported_incidence?.toLocaleString()}</td>
                      <td style={{ fontWeight: "600", color: "var(--accent-danger)" }}>{m.reported_deaths?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${m.mortality_incidence_ratio >= 0.8 ? 'badge-red' : 'badge-teal'}`}>
                          {m.mortality_incidence_ratio != null ? `${(m.mortality_incidence_ratio * 100).toFixed(2)}%` : "N/A"}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>PARLIAMENT_MOHFW (Single-Site Cohort)</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
