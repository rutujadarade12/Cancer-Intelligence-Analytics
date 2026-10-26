import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Building2, Stethoscope, ShieldCheck, Activity } from "lucide-react";

export default function InfrastructureTab() {
  const [nationalInfra, setNationalInfra] = useState([]);
  const [maharashtraInfra, setMaharashtraInfra] = useState([]);
  const [screeningData, setScreeningData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getNationalInfra(),
      api.getMaharashtraInfra(),
      api.getScreeningData()
    ]).then(([natRes, mhRes, screenRes]) => {
      setNationalInfra(natRes);
      setMaharashtraInfra(mhRes);
      setScreeningData(screenRes);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Healthcare Infrastructure & National Screening Programs
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Approved National Cancer Centers (Dataset 6), Maharashtra Health Facilities, and NP-NCD Screening Retention.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>Loading healthcare infrastructure facts...</div>
      ) : (
        <div>
          {/* National Screening Performance Cascade */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <span className="card-title">
                <Stethoscope size={18} color="var(--accent-primary)" />
                National Early Detection Screening (NP-NCD Program)
              </span>
              <span className="badge badge-orange">Dataset 6 Table 2</span>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Screened Cancer Type</th>
                    <th>Persons Screened</th>
                    <th>Cases Diagnosed</th>
                    <th>Cases On Treatment</th>
                    <th>Detection Rate / 100k</th>
                    <th>Treatment Retention Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  {screeningData.map((s) => (
                    <tr key={s.screening_id}>
                      <td style={{ fontWeight: "600" }}>{s.cancer_type}</td>
                      <td style={{ fontWeight: "700" }}>{s.persons_screened?.toLocaleString()}</td>
                      <td>{s.cases_diagnosed?.toLocaleString()}</td>
                      <td>{s.cases_on_treatment?.toLocaleString()}</td>
                      <td><span className="badge badge-teal">{s.detection_rate_per_100k} / 100k</span></td>
                      <td>
                        <span className="badge badge-green" style={{ fontWeight: "700" }}>
                          {s.treatment_retention_rate_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2">
            {/* National Approved Facilities */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Building2 size={18} color="var(--accent-secondary)" />
                  Approved National Infrastructure (MOHFW 2026)
                </span>
                <span className="badge badge-teal">Dataset 6 Table 1</span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Infrastructure Indicator</th>
                      <th>Approved Count</th>
                      <th>Reporting Authority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nationalInfra.map((n) => (
                      <tr key={n.infra_id}>
                        <td style={{ fontWeight: "600" }}>{n.indicator_name}</td>
                        <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>
                          {n.facility_count?.toLocaleString()}
                        </td>
                        <td><span className="badge badge-gray">{n.reporting_source}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maharashtra Health Infrastructure Deep-Dive */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  <Activity size={18} color="var(--accent-info)" />
                  Maharashtra State Health Infrastructure
                </span>
                <span className="badge badge-blue">State Fact Sheet</span>
              </div>
              <div className="table-responsive" style={{ maxHeight: "380px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Facility Name / Tier</th>
                      <th>Facility Count / Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maharashtraInfra.map((m) => (
                      <tr key={m.mh_infra_id}>
                        <td><span className="badge badge-gray">{m.category}</span></td>
                        <td style={{ fontWeight: "600" }}>{m.facility_name}</td>
                        <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                          {m.facility_count_or_type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
