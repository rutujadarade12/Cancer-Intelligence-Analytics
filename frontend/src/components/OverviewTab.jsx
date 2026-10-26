import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { Users, MapPin, Dna, Activity, ShieldAlert, TrendingUp } from "lucide-react";

export default function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardSummary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Loading Overview Analytics...</div>;
  }

  if (!data) {
    return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Unable to connect to warehouse API. Please ensure backend is running at http://127.0.0.1:8000.</div>;
  }

  return (
    <div>
      {/* Provenance Alert Box */}
      <div className="alert-box">
        <ShieldAlert size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <div>
          <strong>Epidemiological Provenance Notice:</strong> The 2022 national incidence estimate of <strong>1,461,427 cases</strong> represents an arithmetic sum reconciliation across 37 ICMR-NCRP state-level model demographic extrapolations. Projections for 2026 and 2045 derive from Kumar et al. (2026) moderated exponential models.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card orange">
          <div className="kpi-title">National Incidence (2022)</div>
          <div className="kpi-value">{data.national_cases_2022?.toLocaleString()}</div>
          <div className="kpi-subtitle">ICMR-NCRP 37-State Model Extrapolations</div>
        </div>

        <div className="kpi-card teal">
          <div className="kpi-title">Geographic Coverage</div>
          <div className="kpi-value">{data.total_states_covered} States & UTs</div>
          <div className="kpi-subtitle">6 Conformed Regional Zones</div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-title">2026 Forecast Burden</div>
          <div className="kpi-value">{data.national_projected_2026?.toLocaleString()}</div>
          <div className="kpi-subtitle">Kumar et al. Moderated Exponential</div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-title">Anatomical Sites & Registries</div>
          <div className="kpi-value">{data.total_cancer_sites} Sites / {data.total_registries} Registries</div>
          <div className="kpi-subtitle">75 Anatomical Sites (76 Dimension records incl. All-sites)</div>
        </div>
      </div>

      {/* Top Burden States & Regional Breakdown */}
      <div className="grid-2">
        {/* Top 5 States */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <MapPin size={18} color="var(--accent-primary)" />
              Top 5 Cancer Burden States (2022)
            </span>
            <span className="badge badge-orange">Highest Demand</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Region</th>
                  <th>Incident Cases</th>
                  <th>National Share</th>
                </tr>
              </thead>
              <tbody>
                {data.top_states?.map((st, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600" }}>{st.state_name}</td>
                    <td><span className="badge badge-gray">{st.region_zone}</span></td>
                    <td style={{ fontWeight: "700" }}>{st.incident_cases?.toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          flex: 1,
                          height: "6px",
                          background: "var(--border-color)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${Math.min(st.national_share_pct * 6, 100)}%`,
                            height: "100%",
                            background: "var(--accent-primary)"
                          }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", minWidth: "38px" }}>{st.national_share_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Zone Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Activity size={18} color="var(--accent-secondary)" />
              Regional Zone Rollup (2022)
            </span>
            <span className="badge badge-teal">OLAP Roll-up</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Regional Zone</th>
                  <th>States Count</th>
                  <th>Total Cases</th>
                  <th>Regional Share</th>
                </tr>
              </thead>
              <tbody>
                {data.regional_distribution?.map((rg, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600" }}>{rg.region_zone}</td>
                    <td>{rg.state_count} States/UTs</td>
                    <td style={{ fontWeight: "700" }}>{rg.total_regional_cases?.toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          flex: 1,
                          height: "6px",
                          background: "var(--border-color)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden"
                        }}>
                          <div style={{
                            width: `${rg.regional_share_pct}%`,
                            height: "100%",
                            background: "var(--accent-secondary)"
                          }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", minWidth: "38px" }}>{rg.regional_share_pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Leading Cancers by Gender */}
      <div className="grid-2">
        {/* Male Leading Cancers */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Dna size={18} color="var(--accent-info)" />
              Leading Cancer Sites in Males (2022)
            </span>
            <span className="badge badge-blue">IJMR Monograph</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cancer Site</th>
                  <th>Estimated Cases</th>
                  <th>Crude Rate</th>
                  <th>AAR / 100k</th>
                </tr>
              </thead>
              <tbody>
                {data.leading_sites_male?.map((site, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600" }}>{site.site_name}</td>
                    <td>{site.incident_cases?.toLocaleString()}</td>
                    <td>{site.crude_rate ?? "N/A"}</td>
                    <td><span className="badge badge-orange">{site.age_adjusted_rate ?? "N/A"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Female Leading Cancers */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Dna size={18} color="var(--accent-warning)" />
              Leading Cancer Sites in Females (2022)
            </span>
            <span className="badge badge-orange">IJMR Monograph</span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cancer Site</th>
                  <th>Estimated Cases</th>
                  <th>Crude Rate</th>
                  <th>AAR / 100k</th>
                </tr>
              </thead>
              <tbody>
                {data.leading_sites_female?.map((site, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600" }}>{site.site_name}</td>
                    <td>{site.incident_cases?.toLocaleString()}</td>
                    <td>{site.crude_rate ?? "N/A"}</td>
                    <td><span className="badge badge-teal">{site.age_adjusted_rate ?? "N/A"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
