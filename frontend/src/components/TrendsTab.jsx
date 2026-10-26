import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Activity, AlertCircle, RefreshCw, Search, Calendar, Database } from "lucide-react";
import TrajectoryLineChart from "./charts/TrajectoryLineChart";

export default function TrendsTab() {
  const [activeSubTab, setActiveSubTab] = useState("trajectory"); // "trajectory", "apc", "pbcr"
  const [projections, setProjections] = useState([]);
  const [apcTrends, setApcTrends] = useState([]);
  const [pbcrData, setPbcrData] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [significantOnly, setSignificantOnly] = useState(false);
  const [siteSearch, setSiteSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [projRes, apcRes, pbcrRes] = await Promise.allSettled([
      api.getStateProjections(),
      api.getApcTrends(directionFilter, significantOnly, siteSearch),
      api.getPbcrSurveillance()
    ]);

    if (projRes.status === "fulfilled" && Array.isArray(projRes.value)) {
      setProjections(projRes.value);
    }
    if (apcRes.status === "fulfilled" && Array.isArray(apcRes.value)) {
      setApcTrends(apcRes.value);
    }
    if (pbcrRes.status === "fulfilled" && Array.isArray(pbcrRes.value)) {
      setPbcrData(pbcrRes.value);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [directionFilter, significantOnly, siteSearch]);

  // Extract unique state names for trajectory filter
  const stateNames = Array.from(new Set(projections.map((p) => p.state_name))).sort();

  // National trajectory aggregation
  const nationalTrajectory = [
    { year: 2019, cases: 1358415, epoch: "Extrapolated", type: "ICMR-NCRP State Model", growth: "Base" },
    { year: 2020, cases: 1392179, epoch: "Extrapolated", type: "ICMR-NCRP State Model", growth: "+2.48%" },
    { year: 2021, cases: 1426447, epoch: "Extrapolated", type: "ICMR-NCRP State Model", growth: "+2.46%" },
    { year: 2022, cases: 1461427, epoch: "Extrapolated", type: "Reconciled State Sum", growth: "+2.45%" },
    { year: 2026, cases: 1569793, epoch: "Projected", type: "Kumar Moderated Exp", growth: "+7.41% (from '22)" },
    { year: 2045, cases: 2084048, epoch: "Projected", type: "Demographic Trend Model", growth: "+42.60% (from '22)" }
  ];

  // Filtered trajectory for selected state
  const stateFilteredProj = selectedState
    ? projections.filter((p) => p.state_name === selectedState)
    : [];

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={22} color="var(--accent-secondary)" />
            Longitudinal Trends & Forecast Projections
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Multi-year national trajectory (2019–2045), Joinpoint Annual Percent Change (APC %) regression, and empirical PBCR surveillance benchmarks.
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "4px" }}>
          <button
            onClick={() => setActiveSubTab("trajectory")}
            className="btn"
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              background: activeSubTab === "trajectory" ? "var(--accent-primary)" : "transparent",
              color: activeSubTab === "trajectory" ? "#FFFFFF" : "var(--text-secondary)",
              borderRadius: "var(--radius-sm)"
            }}
          >
            <Calendar size={14} /> Trajectory (2019–2045)
          </button>
          <button
            onClick={() => setActiveSubTab("apc")}
            className="btn"
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              background: activeSubTab === "apc" ? "var(--accent-primary)" : "transparent",
              color: activeSubTab === "apc" ? "#FFFFFF" : "var(--text-secondary)",
              borderRadius: "var(--radius-sm)"
            }}
          >
            <Activity size={14} /> Joinpoint APC Trends
          </button>
          <button
            onClick={() => setActiveSubTab("pbcr")}
            className="btn"
            style={{
              padding: "6px 12px",
              fontSize: "0.8rem",
              background: activeSubTab === "pbcr" ? "var(--accent-primary)" : "transparent",
              color: activeSubTab === "pbcr" ? "#FFFFFF" : "var(--text-secondary)",
              borderRadius: "var(--radius-sm)"
            }}
          >
            <Database size={14} /> PBCR Surveillance
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card teal">
          <div className="kpi-title">2022 Baseline Burden</div>
          <div className="kpi-value">1,461,427</div>
          <div className="kpi-subtitle">Reconciled Sum across 37 States/UTs</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-title">2026 Forecast Horizon</div>
          <div className="kpi-value">1,569,793</div>
          <div className="kpi-subtitle">+7.41% growth (Kumar Moderated Exponential)</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-title">2045 Long-Range Horizon</div>
          <div className="kpi-value">2,084,048</div>
          <div className="kpi-subtitle">+42.60% demographic aging escalation</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-title">PBCRs Monitored</div>
          <div className="kpi-value">28 Registries</div>
          <div className="kpi-subtitle">64 Verified Sex-Stratified lines</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading longitudinal trend facts...</div>
      ) : (
        <>
          {/* SUBTAB 1: Multi-Year Trajectory */}
          {activeSubTab === "trajectory" && (
            <div>
              <div className="alert-box info" style={{ marginBottom: "20px" }}>
                <TrendingUp size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Temporal Epoch Conformance (Dim_Time):</strong> Years 2019–2022 are conformed as <em>Extrapolated</em> (ICMR-NCRP state-level population models). Years 2026 and 2045 are classified as <em>Projected</em> (Kumar et al. moderated exponential models). The 2022 national figure (1,461,427) is an arithmetic sum of state estimates.
                </div>
              </div>

              {/* Interactive Trajectory SVG Line Chart */}
              <TrajectoryLineChart
                nationalData={nationalTrajectory}
                stateData={stateFilteredProj.map(r => ({ year: r.year, cases: r.incident_cases, epoch: r.epoch_category }))}
                stateName={selectedState}
                title={selectedState ? `${selectedState} & National Trajectory Forecast` : "National Cancer Trajectory Curve (2019–2045)"}
              />

              {/* National Trajectory Table */}
              <div className="card" style={{ marginBottom: "24px" }}>
                <div className="card-header">
                  <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                    National Cancer Burden Progression (2019–2045)
                  </h3>
                  <span className="badge badge-teal">All-India Conformed Trajectory</span>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Temporal Year</th>
                        <th>Epoch Classification</th>
                        <th>Estimation Methodology</th>
                        <th>National Burden (Cases)</th>
                        <th>Growth Momentum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nationalTrajectory.map((t, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: "700", fontSize: "0.95rem" }}>{t.year}</td>
                          <td>
                            <span className={`badge ${t.epoch === "Projected" ? "badge-orange" : "badge-teal"}`}>
                              {t.epoch}
                            </span>
                          </td>
                          <td>{t.type}</td>
                          <td style={{ fontWeight: "700", color: t.epoch === "Projected" ? "var(--accent-primary)" : "var(--text-primary)" }}>
                            {t.cases.toLocaleString()}
                          </td>
                          <td><span className="badge badge-gray">{t.growth}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* State-Level Trajectory Drilldown */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                      State-Level Longitudinal Trajectory Viewer
                    </h3>
                    <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                      Select any of the 37 states/UTs to inspect its multi-year projection curve and growth momentum.
                    </p>
                  </div>

                  <select
                    className="form-control"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    style={{ minWidth: "220px" }}
                  >
                    <option value="">Select a State to Inspect...</option>
                    {stateNames.map((st, i) => (
                      <option key={i} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {selectedState ? (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Year</th>
                          <th>State Name</th>
                          <th>Region Zone</th>
                          <th>Epoch Category</th>
                          <th>Incident Cases</th>
                          <th>National Share %</th>
                          <th>Observed CAGR</th>
                          <th>Projected CAGR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateFilteredProj.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: "600" }}>{row.year}</td>
                            <td>{row.state_name}</td>
                            <td><span className="badge badge-gray">{row.region_zone}</span></td>
                            <td>
                              <span className={`badge ${row.epoch_category === "Projected" ? "badge-orange" : "badge-teal"}`}>
                                {row.epoch_category}
                              </span>
                            </td>
                            <td style={{ fontWeight: "700" }}>{row.incident_cases?.toLocaleString()}</td>
                            <td>{row.national_share_pct}%</td>
                            <td>{row.cagr_observed ? `${(row.cagr_observed * 100).toFixed(2)}%` : "—"}</td>
                            <td>{row.cagr_projected ? `${(row.cagr_projected * 100).toFixed(2)}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>
                    Please select a state from the dropdown above to view its historical and projected trajectory.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 2: Joinpoint APC Trends */}
          {activeSubTab === "apc" && (
            <div>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                    Joinpoint Annual Percent Change (APC %) Trends (Fact_Cancer_Trends_APC)
                  </h3>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                    {apcTrends.length} Verified APC Trend lines from PBCR surveillance. Footnote/stray rows cleanly eliminated.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "10px" }} />
                    <input
                      type="text"
                      placeholder="Search site..."
                      className="form-control"
                      style={{ paddingLeft: "30px", width: "160px", fontSize: "0.8rem" }}
                      value={siteSearch}
                      onChange={(e) => setSiteSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-control"
                    value={directionFilter}
                    onChange={(e) => setDirectionFilter(e.target.value)}
                    style={{ fontSize: "0.8rem" }}
                  >
                    <option value="">All Directions</option>
                    <option value="Increase">Increasing Only</option>
                    <option value="Decrease">Decreasing Only</option>
                    <option value="No change">Stable / No Change</option>
                  </select>

                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-primary)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={significantOnly}
                      onChange={(e) => setSignificantOnly(e.target.checked)}
                    />
                    p &lt; 0.05 Only
                  </label>
                </div>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Cancer Site</th>
                        <th>Cohort Gender</th>
                        <th>PBCR Registry</th>
                        <th>Region</th>
                        <th>APC (%)</th>
                        <th>Direction</th>
                        <th>Statistical Significance</th>
                        <th>Source Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apcTrends.map((t) => (
                        <tr key={t.fact_trend_id}>
                          <td style={{ fontWeight: "600" }}>{t.cancer_site}</td>
                          <td><span className={`badge ${t.gender === "Male" ? "badge-blue" : "badge-teal"}`}>{t.gender}</span></td>
                          <td>{t.registry_name}</td>
                          <td><span className="badge badge-gray">{t.region}</span></td>
                          <td style={{ fontWeight: "700" }}>
                            {t.apc_percent > 0 ? `+${t.apc_percent}%` : `${t.apc_percent}%`}
                          </td>
                          <td>
                            {t.direction === "Increase" && (
                              <span className="badge badge-red" style={{ display: "inline-flex", gap: "4px" }}>
                                <ArrowUpRight size={13} /> Increasing
                              </span>
                            )}
                            {t.direction === "Decrease" && (
                              <span className="badge badge-green" style={{ display: "inline-flex", gap: "4px" }}>
                                <ArrowDownRight size={13} /> Decreasing
                              </span>
                            )}
                            {t.direction === "No change" && (
                              <span className="badge badge-gray" style={{ display: "inline-flex", gap: "4px" }}>
                                <Minus size={13} /> Stable
                              </span>
                            )}
                          </td>
                          <td>
                            {t.is_statistically_significant === 1 ? (
                              <span className="badge badge-teal">p &lt; 0.05 (Sig)</span>
                            ) : (
                              <span className="badge badge-gray">Not Sig</span>
                            )}
                          </td>
                          <td><code>{t.source_measure_code || "JCO_2020_APC"}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: Empirical PBCR Registry Surveillance */}
          {activeSubTab === "pbcr" && (
            <div>
              <div className="card-header" style={{ marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                    Empirical Registry Surveillance (Pooled 2012–2016 Benchmark)
                  </h3>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                    64 Verified Empirical Records across 28 PBCRs for both Male & Female cohorts.
                  </p>
                </div>
                <span className="badge badge-teal">Dataset 3 / Mathur et al. (2020)</span>
              </div>

              <div className="card">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Registry Name</th>
                        <th>Region</th>
                        <th>Gender</th>
                        <th>Time Period</th>
                        <th>Annual Incident Cases</th>
                        <th>Crude Rate</th>
                        <th>AAR / 100k</th>
                        <th>Cumulative Risk (1 in N)</th>
                        <th>Tobacco Share %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pbcrData.map((p) => (
                        <tr key={p.fact_pbcr_id}>
                          <td style={{ fontWeight: "600" }}>{p.registry_name}</td>
                          <td><span className="badge badge-gray">{p.region}</span></td>
                          <td><span className={`badge ${p.gender === "Male" ? "badge-blue" : "badge-teal"}`}>{p.gender}</span></td>
                          <td><code>{p.time_period}</code></td>
                          <td style={{ fontWeight: "700" }}>{p.annual_cases?.toLocaleString()}</td>
                          <td>{p.crude_rate ?? "N/A"}</td>
                          <td><span className="badge badge-orange">{p.age_adjusted_rate ?? "N/A"}</span></td>
                          <td>{p.cum_risk_1_in_n ? `1 in ${p.cum_risk_1_in_n}` : "—"}</td>
                          <td>{p.tobacco_share_pct ? `${p.tobacco_share_pct}%` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
