import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { MapPin, Search, Filter, Eye, X, ArrowUpDown, Globe2, BarChart2, ShieldAlert, Layers, Map as MapIcon, Grid } from "lucide-react";
import IndiaMapLeaflet from "./charts/IndiaMapLeaflet";
import RegionalDonutChart from "./charts/RegionalDonutChart";

export default function GeographyTab() {
  const [states, setStates] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState(null);
  const [stateDetail, setStateDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sortField, setSortField] = useState("incident_cases");
  const [sortAsc, setSortAsc] = useState(false);
  const [mapMetric, setMapMetric] = useState("incident_cases");
  const [viewMode, setViewMode] = useState("map"); // 'map' | 'grid'

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStates(regionFilter, 2022),
      api.getRegions(2022)
    ])
      .then(([statesRes, regionsRes]) => {
        setStates(statesRes || []);
        setRegions(regionsRes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Geography fetch error:", err);
        setLoading(false);
      });
  }, [regionFilter]);

  const handleStateClick = (geoId) => {
    setSelectedState(geoId);
    setDetailLoading(true);
    api.getStateDetail(geoId)
      .then((res) => {
        setStateDetail(res);
        setDetailLoading(false);
      })
      .catch((err) => {
        console.error("State detail error:", err);
        setDetailLoading(false);
      });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredStates = states
    .filter((st) =>
      st.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.state_code.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getBurdenColorClass = (cases) => {
    if (cases > 100000) return "badge-red";
    if (cases > 50000) return "badge-orange";
    if (cases > 20000) return "badge-blue";
    if (cases > 5000) return "badge-teal";
    return "badge-green";
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={22} color="var(--accent-secondary)" />
            Geographic Burden & State Surveillance
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Epidemiological surveillance across 37 States and Union Territories with conformed regional zones & demographic growth rates.
          </p>
        </div>

        {/* Filter & View Controls */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search state or code..."
              className="form-control"
              style={{ paddingLeft: "32px", width: "190px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="">All 6 Regional Zones</option>
            <option value="Central">Central Zone</option>
            <option value="South">South Zone</option>
            <option value="East">East Zone</option>
            <option value="West">West Zone</option>
            <option value="North">North Zone</option>
            <option value="North East">North East Zone</option>
          </select>

          {/* Toggle between Vector Map and Tile Grid */}
          <div style={{ display: "inline-flex", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: "2px", border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => setViewMode("map")}
              style={{
                background: viewMode === "map" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "map" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                fontSize: "0.775rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer"
              }}
            >
              <MapIcon size={14} /> Choropleth Map
            </button>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                background: viewMode === "grid" ? "var(--accent-primary)" : "transparent",
                color: viewMode === "grid" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                fontSize: "0.775rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer"
              }}
            >
              <Grid size={14} /> Matrix Tiles
            </button>
          </div>
        </div>
      </div>

      {/* Primary Geospatial & Zonal Visualization Grid */}
      <div style={{ display: "grid", gridTemplateColumns: viewMode === "map" ? "1.6fr 1fr" : "1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Interactive India Map / Matrix Grid */}
        {viewMode === "map" ? (
          <div className="card">
            <IndiaMapLeaflet
              states={filteredStates}
              selectedStateId={selectedState}
              onSelectState={handleStateClick}
              selectedMetric={mapMetric}
              onMetricChange={setMapMetric}
            />
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Globe2 size={18} color="var(--accent-primary)" />
                  National Burden Heat Distribution (37 States & UTs)
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Categorized into epidemiological demand tiers: Red &gt;100k, Orange 50k–100k, Blue 20k–50k, Teal 5k–20k, Green &lt;5k.
                </p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "0.7rem" }}>
                <span className="badge badge-red">&gt;100k (Severe)</span>
                <span className="badge badge-orange">50k-100k (High)</span>
                <span className="badge badge-blue">20k-50k (Moderate)</span>
                <span className="badge badge-teal">5k-20k (Low)</span>
                <span className="badge badge-green">&lt;5k (Minimal)</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
              {filteredStates.map((st) => (
                <button
                  key={st.geo_id}
                  onClick={() => handleStateClick(st.geo_id)}
                  style={{
                    background: selectedState === st.geo_id ? "var(--bg-card-hover)" : "var(--bg-secondary)",
                    border: selectedState === st.geo_id ? "2px solid var(--accent-secondary)" : "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 8px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--accent-secondary)" }}>{st.state_code}</span>
                    <span className={`badge ${getBurdenColorClass(st.incident_cases)}`} style={{ fontSize: "0.625rem", padding: "1px 5px" }}>
                      {st.incident_cases > 1000 ? `${(st.incident_cases / 1000).toFixed(0)}k` : st.incident_cases}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.775rem", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {st.state_name}
                  </div>
                  <div style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>
                    {st.region_zone} Zone
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Regional Donut Chart */}
        {viewMode === "map" && (
          <RegionalDonutChart
            regions={regions}
            selectedRegion={regionFilter}
            onSelectRegion={setRegionFilter}
          />
        )}
      </div>

      {/* Regional Zonal Distribution Cards */}
      <div className="grid-3" style={{ marginBottom: "24px" }}>
        {regions.map((rg, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              cursor: "pointer",
              borderLeft: regionFilter === rg.region_zone ? "4px solid var(--accent-secondary)" : "1px solid var(--border-color)",
              background: regionFilter === rg.region_zone ? "var(--bg-card-hover)" : "var(--bg-card)"
            }}
            onClick={() => setRegionFilter(regionFilter === rg.region_zone ? "" : rg.region_zone)}
          >
            <div className="card-header" style={{ marginBottom: "8px" }}>
              <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{rg.region_zone} Zone</span>
              <span className="badge badge-teal">{rg.state_count} States</span>
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "6px" }}>
              {rg.total_regional_cases?.toLocaleString()} <span style={{ fontSize: "0.75rem", fontWeight: "400", color: "var(--text-secondary)" }}>cases</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="prog-container">
                <div
                  className="prog-fill"
                  style={{ width: `${rg.regional_share_pct}%`, background: "var(--accent-secondary)" }}
                />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--accent-secondary)" }}>
                {rg.regional_share_pct}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main State Surveillance Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading state surveillance data...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
              State Epidemiological Surveillance & Projections Matrix (N = {filteredStates.length})
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Click column headers to sort &bull; Click row to inspect</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th onClick={() => handleSort("state_name")} style={{ cursor: "pointer" }}>
                    State / UT <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th>Code</th>
                  <th onClick={() => handleSort("region_zone")} style={{ cursor: "pointer" }}>
                    Region Zone <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("incident_cases")} style={{ cursor: "pointer" }}>
                    2022 Incidence <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("national_share_pct")} style={{ cursor: "pointer" }}>
                    Share % <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("cagr_observed")} style={{ cursor: "pointer" }}>
                    Observed CAGR <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th onClick={() => handleSort("projected_cases_2026")} style={{ cursor: "pointer" }}>
                    2026 Forecast <ArrowUpDown size={12} style={{ display: "inline" }} />
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStates.map((st, idx) => (
                  <tr
                    key={st.geo_id}
                    onClick={() => handleStateClick(st.geo_id)}
                    style={{
                      cursor: "pointer",
                      background: selectedState === st.geo_id ? "var(--bg-card-hover)" : "inherit"
                    }}
                  >
                    <td style={{ color: "var(--text-muted)", fontWeight: "500" }}>{idx + 1}</td>
                    <td style={{ fontWeight: "600" }}>{st.state_name}</td>
                    <td>
                      <span className="badge badge-teal" style={{ fontSize: "0.675rem" }}>{st.state_code}</span>
                    </td>
                    <td>
                      <span className="badge badge-blue">{st.region_zone}</span>
                    </td>
                    <td style={{ fontWeight: "700" }}>
                      {st.incident_cases?.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="prog-container" style={{ width: "60px" }}>
                          <div
                            className="prog-fill"
                            style={{ width: `${Math.min(100, st.national_share_pct * 6)}%`, background: "var(--accent-primary)" }}
                          />
                        </div>
                        <span>{st.national_share_pct?.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td style={{ color: st.cagr_observed > 0.02 ? "var(--accent-danger)" : "var(--accent-secondary)", fontWeight: "600" }}>
                      {st.cagr_observed ? `${(st.cagr_observed * 100).toFixed(2)}%` : "N/A"}
                    </td>
                    <td style={{ color: "var(--accent-primary)", fontWeight: "600" }}>
                      {st.projected_cases_2026?.toLocaleString() || "N/A"}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStateClick(st.geo_id);
                        }}
                      >
                        <Eye size={13} /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-out State Detail Drawer Modal */}
      {selectedState && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "500px",
            maxWidth: "92vw",
            height: "100vh",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-lg)",
            borderLeft: "1px solid var(--border-color)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            animation: "slideIn 0.25s ease"
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>
                  {stateDetail?.state_info?.state_name || "State Detail"}
                </h3>
                <span className="badge badge-teal">
                  {stateDetail?.state_info?.state_code}
                </span>
              </div>
              <p style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                {stateDetail?.state_info?.region_zone} Zone &bull; Capital: {stateDetail?.state_info?.capital}
              </p>
            </div>
            <button
              onClick={() => setSelectedState(null)}
              className="btn btn-outline"
              style={{ padding: "6px" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {detailLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                Loading longitudinal state profile...
              </div>
            ) : stateDetail ? (
              <div>
                {/* Demographic & Growth Metrics Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>2011 Census Pop</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                      {stateDetail.state_info?.population_census_2011?.toLocaleString() || "N/A"}
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Observed CAGR</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-secondary)" }}>
                      {stateDetail.metrics?.cagr_observed ? `${(stateDetail.metrics.cagr_observed * 100).toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>2022 National Share</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-primary)" }}>
                      {stateDetail.metrics?.national_share_2022?.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Projected CAGR</div>
                    <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-warning)" }}>
                      {stateDetail.metrics?.cagr_projected ? `${(stateDetail.metrics.cagr_projected * 100).toFixed(2)}%` : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Longitudinal Trajectory Table */}
                <h4 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <BarChart2 size={16} color="var(--accent-primary)" />
                  Surveillance Time Series (2019–2026)
                </h4>
                <div className="table-responsive" style={{ marginBottom: "20px" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Classification</th>
                        <th>Incident Cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stateDetail.trajectory?.map((pt, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: "600" }}>{pt.year}</td>
                          <td>
                            <span className={`badge ${pt.epoch_category === "Projected" ? "badge-orange" : "badge-teal"}`}>
                              {pt.epoch_category}
                            </span>
                          </td>
                          <td style={{ fontWeight: "700", color: pt.epoch_category === "Projected" ? "var(--accent-primary)" : "var(--text-primary)" }}>
                            {pt.cases?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Methodological Context Box */}
                <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--accent-secondary)", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  <strong>Data Provenance Notice:</strong> Baseline values for 2019–2022 are conformed from ICMR-NCRP State Estimates. Forecast values for 2026 reflect Kumar et al. exponential growth mathematical modeling grounded in population age structure changes.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
