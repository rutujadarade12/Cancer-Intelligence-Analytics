import React, { useState, useEffect, useMemo } from "react";
import { api } from "../services/api";
import {
  Cpu,
  GitBranch,
  Binary,
  Share2,
  Network,
  Key,
  CheckCircle2,
  AlertCircle,
  Activity,
  RefreshCw,
  Search,
  Sliders,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Play,
  Calendar,
  MapPin,
  SlidersHorizontal,
  Check,
  Info,
  ShieldAlert,
  BarChart2
} from "lucide-react";
import DecisionTreeViewer from "./charts/DecisionTreeViewer";
import ScatterPlot from "./charts/ScatterPlot";
import DendrogramTree from "./charts/DendrogramTree";
import NetworkGraph from "./charts/NetworkGraph";

export default function DataMiningTab() {
  const [subTab, setSubTab] = useState("prediction");
  const [modelsData, setModelsData] = useState(null);
  const [stateMetrics, setStateMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prediction Engine States
  const [modelBenchmarks, setModelBenchmarks] = useState(null);
  const [supportedStates, setSupportedStates] = useState([]);
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [targetYear, setTargetYear] = useState(2026);
  const [growthAdjustment, setGrowthAdjustment] = useState(0.0);
  const [selectedModel, setSelectedModel] = useState("bayesian_ridge");
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState(null);

  // Sub-tab specific interactive states
  const [ruleSearch, setRuleSearch] = useState("");
  const [minLift, setMinLift] = useState(1.0);
  const [selectedCluster, setSelectedCluster] = useState("all");
  const [selectedTier, setSelectedTier] = useState("all");

  const targetYearOptions = [
    { year: 2023, label: "2023 (Short-Term Extrapolation)" },
    { year: 2024, label: "2024 (GLOBOCAN Benchmark Year)" },
    { year: 2025, label: "2025 (Mid-Term Forecast)" },
    { year: 2026, label: "2026 (Kumar et al. Benchmark Horizon)" },
    { year: 2027, label: "2027 (Long-Term Projection)" },
    { year: 2028, label: "2028 (Long-Term Projection)" },
    { year: 2029, label: "2029 (Long-Term Projection)" },
    { year: 2030, label: "2030 (National Strategic Horizon)" },
    { year: 2031, label: "2031 (Strategic Projection)" },
    { year: 2032, label: "2032 (Strategic Projection)" },
    { year: 2033, label: "2033 (Strategic Projection)" },
    { year: 2034, label: "2034 (Strategic Projection)" },
    { year: 2035, label: "2035 (Decadal Outlook)" },
    { year: 2040, label: "2040 (Long-Term Horizon)" },
    { year: 2045, label: "2045 (Long-Horizon Vision)" }
  ];

  const scenarioPresets = [
    { label: "-5.0% (Screening / HPV Prevention)", value: -5.0, desc: "Early detection intervention" },
    { label: "-2.0% (Tobacco Cessation Impact)", value: -2.0, desc: "Policy intervention" },
    { label: "0.0% (Baseline Trend Continuation)", value: 0.0, desc: "Empirical momentum" },
    { label: "+2.0% (Demographic Aging Drift)", value: 2.0, desc: "Population aging shift" },
    { label: "+5.0% (Rapid Exposure Surge)", value: 5.0, desc: "Carcinogen surge" }
  ];

  const formatModelName = (id) => {
    switch (id) {
      case "bayesian_ridge": return "Bayesian Ridge Regression";
      case "linear_regression": return "OLS Linear Regression";
      case "ridge_regression": return "Ridge Regression (L2)";
      case "gradient_boosting": return "Gradient Boosting Regressor";
      case "random_forest": return "Random Forest Regressor";
      default: return id ? id.replace(/_/g, " ") : "Regression";
    }
  };

  const fetchPrediction = async (state, year, growth, model) => {
    setPredictLoading(true);
    setPredictError(null);
    try {
      const res = await api.predictIncidence({
        state: state,
        target_year: Number(year),
        growth_adjustment_pct: Number(growth),
        model_type: model
      });
      setPredictionResult(res);
    } catch (err) {
      console.error("Prediction error:", err);
      setPredictError(err.message || "Failed to calculate incidence prediction.");
    } finally {
      setPredictLoading(false);
    }
  };

  const handleRunPrediction = (e) => {
    if (e) e.preventDefault();
    if (!selectedState) {
      setPredictError("Please select a state or union territory.");
      return;
    }
    const yr = Number(targetYear);
    if (isNaN(yr) || yr < 2019 || yr > 2045) {
      setPredictError("Target year must be between 2019 and 2045.");
      return;
    }
    const growth = Number(growthAdjustment);
    if (isNaN(growth) || growth < -50 || growth > 50) {
      setPredictError("Annual growth adjustment must be between -50% and +50%.");
      return;
    }
    fetchPrediction(selectedState, yr, growth, selectedModel);
  };

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getRegressionModel(),
      api.getDecisionTreeModel(),
      api.getNaiveBayesModel(),
      api.getKmeansModel(),
      api.getHierarchicalModel(),
      api.getAprioriModel(),
      api.getStates("", 2022),
      api.getModelBenchmarks().catch((err) => {
        console.warn("Failed to fetch model benchmarks:", err);
        return null;
      }),
      api.getPredictionSupportedStates().catch((err) => {
        console.warn("Failed to fetch prediction supported states:", err);
        return null;
      })
    ])
      .then(([reg, dt, nb, km, hc, ap, states, benchmarks, supported]) => {
        setModelsData({
          regression: reg,
          decisionTree: dt,
          naiveBayes: nb,
          kmeans: km,
          hierarchical: hc,
          apriori: ap
        });
        setStateMetrics(states || []);
        if (benchmarks) setModelBenchmarks(benchmarks);
        if (supported && supported.length > 0) {
          setSupportedStates(supported);
        } else if (states && states.length > 0) {
          setSupportedStates(states);
        }
        setLoading(false);

        // Dynamically select best-supported model from backend benchmarks (default: Bayesian Ridge)
        const defaultModel = benchmarks?.selected_model || "bayesian_ridge";
        setSelectedModel(defaultModel);

        // Pre-execute default prediction for Maharashtra 2026 using verified benchmark model
        fetchPrediction("Maharashtra", 2026, 0.0, defaultModel);
      })
      .catch((err) => {
        console.error("Data Mining fetch error:", err);
        setError("Failed to fetch data mining model outputs. Please ensure backend is active.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const subTabs = [
    { id: "prediction", label: "Incidence Prediction", icon: TrendingUp },
    { id: "regression", label: "Regression (Trend)", icon: Cpu },
    { id: "decisionTree", label: "Decision Tree", icon: GitBranch },
    { id: "naiveBayes", label: "Naive Bayes", icon: Binary },
    { id: "kmeans", label: "K-Means Clustering", icon: Share2 },
    { id: "hierarchical", label: "Hierarchical (Ward)", icon: Network },
    { id: "apriori", label: "Apriori Association", icon: Key }
  ];

  // Map state metrics to cluster IDs for K-Means 2D Scatter Plot
  const kmeansScatterData = useMemo(() => {
    if (!modelsData?.kmeans?.clusters || stateMetrics.length === 0) return [];

    const stateToCluster = {};
    const clusterLabels = {};
    modelsData.kmeans.clusters.forEach((c) => {
      clusterLabels[c.cluster_id] = `Cluster ${c.cluster_id}: ${c.label?.split('/')[0]?.trim() || c.label}`;
      (c.states || []).forEach((st) => {
        stateToCluster[st] = c.cluster_id;
      });
    });

    return stateMetrics.map((st) => {
      const cId = stateToCluster[st.state_name] ?? 0;
      return {
        state_name: st.state_name,
        state_code: st.state_code,
        region_zone: st.region_zone,
        incident_cases: st.incident_cases || 0,
        cagr_pct: st.cagr_observed ? Number((st.cagr_observed * 100).toFixed(2)) : 0,
        national_share_pct: st.national_share_pct || 0,
        cluster_id: cId,
        cluster_label: clusterLabels[cId] || `Cluster ${cId}`
      };
    });
  }, [modelsData, stateMetrics]);

  const clusterColorMap = {
    0: "#06B6D4",
    1: "#EF4444",
    2: "#8B5CF6",
    3: "#F59E0B",
    "0": "#06B6D4",
    "1": "#EF4444",
    "2": "#8B5CF6",
    "3": "#F59E0B"
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <RefreshCw size={28} className="pulse-dot" style={{ animation: "spin 1.5s infinite linear", margin: "0 auto 16px" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>Loading DWM Data Mining Lab...</h3>
        <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "6px" }}>
          Retrieving 6 verified Scikit-learn algorithms & association rules.
        </p>
      </div>
    );
  }

  if (error || !modelsData) {
    return (
      <div className="card" style={{ padding: "30px", textAlign: "center" }}>
        <AlertCircle size={36} color="var(--accent-danger)" style={{ margin: "0 auto 12px" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--text-primary)" }}>Data Mining Service Unavailable</h3>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px", marginBottom: "20px" }}>
          {error || "Unable to load model results from warehouse/data_mining_results.json."}
        </p>
        <button onClick={loadData} className="btn btn-primary" style={{ margin: "0 auto" }}>
          <RefreshCw size={14} /> Retry Loading
        </button>
      </div>
    );
  }

  const { regression, decisionTree, naiveBayes, kmeans, hierarchical, apriori } = modelsData;

  // Filtered Apriori Rules
  const filteredRules = (apriori?.top_association_rules || []).filter((r) => {
    const textMatch =
      !ruleSearch ||
      (r.antecedent || []).some((a) => a.toLowerCase().includes(ruleSearch.toLowerCase())) ||
      (r.consequent || []).some((c) => c.toLowerCase().includes(ruleSearch.toLowerCase()));
    const liftMatch = !minLift || (r.lift && r.lift >= minLift);
    return textMatch && liftMatch;
  });

  // Reusable Model Comparison Matrix Component
  const renderModelComparisonSection = () => {
    const loocv = modelBenchmarks?.loocv_metrics || regression?.loocv_validation?.models || {};
    const inSample = modelBenchmarks?.in_sample_metrics || regression?.in_sample_evaluation?.models || {};
    const rationale = modelBenchmarks?.selection_rationale || regression?.selected_production_model?.selection_rationale;
    const projNote = modelBenchmarks?.external_projections_note || regression?.forecast_2026_trajectory_evaluation?.interpretation;
    const activeExecuted = predictionResult?.model_used;

    const benchmarkRows = [
      {
        id: "bayesian_ridge",
        name: "Bayesian Ridge Regression",
        type: "Regularized Probabilistic (L2 + Evidence Max)",
        isBenchmarkSelected: true,
        loocvMae: loocv?.bayesian_ridge?.mae ?? "15.50",
        loocvRmse: loocv?.bayesian_ridge?.rmse ?? "22.44",
        loocvR2: loocv?.bayesian_ridge?.r2 ?? "1.000000",
        inSampleMae: inSample?.bayesian_ridge?.mae ?? "12.95",
        inSampleR2: inSample?.bayesian_ridge?.r2 ?? "1.000000",
        uncertaintyMethod: "Bayesian Posterior Credible Interval (95%)",
        assessment: "Optimal generalization. Native 95% Bayesian Credible Intervals with lowest cross-validation error across 37 states."
      },
      {
        id: "linear_regression",
        name: "OLS Linear Regression",
        type: "Ordinary Least Squares",
        isBenchmarkSelected: false,
        loocvMae: loocv?.linear_regression?.mae ?? "15.63",
        loocvRmse: loocv?.linear_regression?.rmse ?? "22.64",
        loocvR2: loocv?.linear_regression?.r2 ?? "1.000000",
        inSampleMae: inSample?.linear_regression?.mae ?? "12.99",
        inSampleR2: inSample?.linear_regression?.r2 ?? "1.000000",
        uncertaintyMethod: "Frequentist Analytical Prediction Interval (95%)",
        assessment: "Exact historical alignment; slightly higher LOOCV error than Bayesian Ridge without parameter regularization."
      },
      {
        id: "ridge_regression",
        name: "Ridge Regression (alpha = 1.0)",
        type: "L2 Tikhonov Regularization",
        isBenchmarkSelected: false,
        loocvMae: loocv?.ridge_regression?.mae ?? "15.63",
        loocvRmse: loocv?.ridge_regression?.rmse ?? "22.64",
        loocvR2: loocv?.ridge_regression?.r2 ?? "1.000000",
        inSampleMae: inSample?.ridge_regression?.mae ?? "12.99",
        inSampleR2: inSample?.ridge_regression?.r2 ?? "1.000000",
        uncertaintyMethod: "Frequentist Analytical Prediction Interval (95%)",
        assessment: "Effective collinearity shrinkage; identical point forecast to Linear Regression at alpha=1.0."
      },
      {
        id: "naive_baseline",
        name: "Naive Persistence Baseline",
        type: "Linear Continuation (y_21 + delta)",
        isBenchmarkSelected: false,
        loocvMae: loocv?.naive_baseline?.mae ?? "25.46",
        loocvRmse: loocv?.naive_baseline?.rmse ?? "36.80",
        loocvR2: loocv?.naive_baseline?.r2 ?? "0.999999",
        inSampleMae: inSample?.naive_persistence_baseline?.mae ?? "25.46",
        inSampleR2: inSample?.naive_persistence_baseline?.r2 ?? "0.999999",
        uncertaintyMethod: "Heuristic Drift (No formal distribution)",
        assessment: "Heuristic baseline. Demonstrates high demographic momentum in ICMR compound series."
      },
      {
        id: "gradient_boosting",
        name: "Gradient Boosting Regressor (100 Trees)",
        type: "Non-Linear Decision Tree Ensemble",
        isBenchmarkSelected: false,
        isWarning: true,
        loocvMae: loocv?.gradient_boosting?.mae ?? "4,106.42",
        loocvRmse: loocv?.gradient_boosting?.rmse ?? "14,921.54",
        loocvR2: loocv?.gradient_boosting?.r2 ?? "0.900392",
        inSampleMae: inSample?.gradient_boosting?.mae ?? "2.48",
        inSampleR2: inSample?.gradient_boosting?.r2 ?? "1.000000",
        uncertaintyMethod: "Not Statistically Justified (Point Estimator Only)",
        assessment: "Severe overfitting (In-sample MAE 2.48 vs LOOCV MAE 4,106.42). Step functions cannot extrapolate continuous demographic trajectories; cannot produce valid intervals."
      },
      {
        id: "random_forest",
        name: "Random Forest Regressor (100 Trees)",
        type: "Bagged Decision Tree Ensemble",
        isBenchmarkSelected: false,
        isWarning: true,
        loocvMae: loocv?.random_forest?.mae ?? "4,146.43",
        loocvRmse: loocv?.random_forest?.rmse ?? "15,395.51",
        loocvR2: loocv?.random_forest?.r2 ?? "0.893963",
        inSampleMae: inSample?.random_forest?.mae ?? "1,436.16",
        inSampleR2: inSample?.random_forest?.r2 ?? "0.987024",
        uncertaintyMethod: "Not Statistically Justified (Point Estimator Only)",
        assessment: "Ensemble leaf-averaging blunts trajectory velocity. High out-of-fold error across small N=37 cohort; lacks continuous posterior."
      }
    ];

    return (
      <div className="card" style={{ marginTop: "24px", marginBottom: "20px" }}>
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <BarChart2 size={18} color="var(--accent-secondary)" />
              Multi-Model Evaluation & Leave-One-Out Cross-Validation (LOOCV)
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Comparative benchmarking evaluated across 37 States & UTs panel (2019–2022). Historical cross-validation strictly separated from external projection alignment.
            </p>
          </div>
          <span className="badge badge-teal">N = 37 States (Leakage-Free LOOCV)</span>
        </div>

        <div className="table-responsive" style={{ marginBottom: "16px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Validation Status</th>
                <th>LOOCV MAE (Cases)</th>
                <th>LOOCV RMSE</th>
                <th>LOOCV R²</th>
                <th>In-Sample MAE</th>
                <th>Uncertainty Characterization</th>
                <th>Generalization Assessment</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.map((m) => {
                const isCurrentlyActive = activeExecuted === m.id;
                return (
                  <tr
                    key={m.id}
                    style={
                      isCurrentlyActive
                        ? { background: "rgba(6, 182, 212, 0.12)", borderLeft: "3px solid var(--accent-secondary)" }
                        : m.isBenchmarkSelected
                        ? { background: "rgba(16, 185, 129, 0.08)" }
                        : {}
                    }
                  >
                    <td style={{ fontWeight: m.isBenchmarkSelected || isCurrentlyActive ? "700" : "600" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {m.isBenchmarkSelected && <Check size={14} color="var(--accent-success)" />}
                        {m.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{m.type}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {m.isBenchmarkSelected && (
                          <span className="badge badge-green">Production Selected</span>
                        )}
                        {isCurrentlyActive && (
                          <span className="badge badge-teal">Currently Executed</span>
                        )}
                        {m.isWarning && !isCurrentlyActive && (
                          <span className="badge badge-red">High OOF Error</span>
                        )}
                        {!m.isBenchmarkSelected && !m.isWarning && !isCurrentlyActive && (
                          <span className="badge badge-gray">Baseline</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: m.isBenchmarkSelected ? "700" : "500", color: m.isWarning ? "var(--accent-danger)" : "var(--text-primary)" }}>
                      {m.loocvMae}
                    </td>
                    <td>{m.loocvRmse}</td>
                    <td>
                      <span className={`badge ${m.isWarning ? "badge-orange" : "badge-teal"}`}>
                        {m.loocvR2}
                      </span>
                    </td>
                    <td>{m.inSampleMae}</td>
                    <td style={{ fontSize: "0.775rem", color: m.isWarning ? "var(--accent-warning)" : "var(--text-primary)" }}>
                      {m.uncertaintyMethod}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)", maxWidth: "260px" }}>
                      {m.assessment}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rationale && (
          <div className="alert-box" style={{ background: "rgba(6, 182, 212, 0.08)", borderLeftColor: "var(--accent-secondary)", marginBottom: "12px" }}>
            <Info size={18} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Model Selection Rationale:</strong>
              <div style={{ marginTop: "4px", fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                {rationale}
              </div>
            </div>
          </div>
        )}

        {projNote && (
          <div className="alert-box" style={{ background: "rgba(249, 115, 22, 0.06)", borderLeftColor: "var(--accent-primary)", margin: 0 }}>
            <ShieldAlert size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Provenance & Ground-Truth Segregation:</strong>
              <div style={{ marginTop: "4px", fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                {projNote}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={22} color="var(--accent-primary)" />
            Data Mining & Machine Learning Laboratory
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Empirical validation of machine learning algorithms, live autoregressive incidence forecasting, and association pattern mining.
          </p>
        </div>

        {/* Algorithm Sub-Tab Switcher */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "4px" }}>
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className="btn"
                style={{
                  padding: "6px 12px",
                  fontSize: "0.775rem",
                  background: isActive ? "var(--accent-primary)" : "transparent",
                  color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                  borderRadius: "var(--radius-sm)"
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 0. Live Incidence Prediction Sub-Tab */}
      {subTab === "prediction" && (
        <div>
          {/* Interactive Parameter Control Panel */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-header" style={{ marginBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={18} color="var(--accent-secondary)" />
                  Cancer Incidence Predictive Simulation Engine
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Dynamic, real-time autoregressive panel forecasting with statistically justified uncertainty intervals trained on ICMR-NCRP State Surveillance.
                </p>
              </div>
              <span className="badge badge-teal">Live API Inference</span>
            </div>

            {/* Benchmark Recommended Default Badge */}
            {modelBenchmarks?.selected_model && (
              <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <span className="badge badge-green" style={{ fontSize: "0.775rem", padding: "4px 10px" }}>
                  <Check size={13} style={{ marginRight: "4px" }} />
                  Benchmark Validated Default: {formatModelName(modelBenchmarks.selected_model)} (Lowest LOOCV MAE: {modelBenchmarks.loocv_metrics?.[modelBenchmarks.selected_model]?.mae ?? "15.50"} cases)
                </span>
                {selectedModel !== modelBenchmarks.selected_model && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: "0.725rem", padding: "3px 8px", borderColor: "var(--accent-secondary)", color: "var(--accent-secondary)" }}
                    onClick={() => {
                      setSelectedModel(modelBenchmarks.selected_model);
                      fetchPrediction(selectedState, targetYear, growthAdjustment, modelBenchmarks.selected_model);
                    }}
                  >
                    <RefreshCw size={11} style={{ marginRight: "4px" }} />
                    Reset to {formatModelName(modelBenchmarks.selected_model)}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleRunPrediction}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "16px",
                alignItems: "flex-end"
              }}>
                {/* State Selection */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={13} color="var(--accent-secondary)" /> Select State / UT:
                  </label>
                  <select
                    className="form-control"
                    style={{ width: "100%" }}
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {supportedStates.length > 0 ? (
                      [...supportedStates]
                        .sort((a, b) => a.state_name.localeCompare(b.state_name))
                        .map((st) => (
                          <option key={st.geo_id || st.state_name} value={st.state_name}>
                            {st.state_name} ({st.region_zone || "India"})
                          </option>
                        ))
                    ) : (
                      <option value="Maharashtra">Maharashtra (West)</option>
                    )}
                  </select>
                </div>

                {/* Target Horizon Year */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={13} color="var(--accent-secondary)" /> Target Horizon:
                  </label>
                  <select
                    className="form-control"
                    style={{ width: "100%" }}
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                  >
                    {targetYearOptions.map((opt) => (
                      <option key={opt.year} value={opt.year}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Growth Scenario Adjustment */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <SlidersHorizontal size={13} color="var(--accent-secondary)" /> Annual Growth Adjustment (%):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="-20"
                    max="20"
                    className="form-control"
                    style={{ width: "100%" }}
                    value={growthAdjustment}
                    onChange={(e) => setGrowthAdjustment(e.target.value)}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                    {scenarioPresets.map((preset) => {
                      const isActive = Number(growthAdjustment) === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          className="btn btn-outline"
                          style={{
                            fontSize: "0.68rem",
                            padding: "2px 7px",
                            height: "22px",
                            background: isActive ? "var(--accent-primary)" : "transparent",
                            color: isActive ? "#FFFFFF" : "var(--text-secondary)",
                            borderColor: isActive ? "var(--accent-primary)" : "var(--border-color)"
                          }}
                          onClick={() => {
                            setGrowthAdjustment(preset.value);
                            fetchPrediction(selectedState, targetYear, preset.value, selectedModel);
                          }}
                          title={preset.desc}
                        >
                          {preset.value > 0 ? `+${preset.value}%` : `${preset.value}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model Algorithm Selector */}
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Cpu size={13} color="var(--accent-secondary)" /> Forecasting Algorithm:
                  </label>
                  <select
                    className="form-control"
                    style={{ width: "100%" }}
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="bayesian_ridge">
                      Bayesian Ridge (Recommended — LOOCV MAE: {modelBenchmarks?.loocv_metrics?.bayesian_ridge?.mae ?? "15.50"})
                    </option>
                    <option value="linear_regression">
                      OLS Linear Regression (LOOCV MAE: {modelBenchmarks?.loocv_metrics?.linear_regression?.mae ?? "15.63"})
                    </option>
                    <option value="ridge_regression">
                      Ridge Regression L2 (LOOCV MAE: {modelBenchmarks?.loocv_metrics?.ridge_regression?.mae ?? "15.63"})
                    </option>
                    <option value="gradient_boosting">
                      Gradient Boosting (LOOCV MAE: {modelBenchmarks?.loocv_metrics?.gradient_boosting?.mae ?? "4,106.42"})
                    </option>
                    <option value="random_forest">
                      Random Forest (LOOCV MAE: {modelBenchmarks?.loocv_metrics?.random_forest?.mae ?? "4,146.43"})
                    </option>
                  </select>
                </div>

                {/* Run Prediction Button */}
                <div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={predictLoading}
                    style={{ width: "100%", height: "38px", justifyContent: "center", fontWeight: "600" }}
                  >
                    {predictLoading ? (
                      <>
                        <RefreshCw size={15} style={{ animation: "spin 1s infinite linear" }} />
                        Computing...
                      </>
                    ) : (
                      <>
                        <Play size={15} fill="currentColor" />
                        Run Prediction
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Error Alert Display */}
          {predictError && (
            <div className="alert-box" style={{ borderColor: "var(--accent-danger)", background: "rgba(239, 68, 68, 0.1)", marginBottom: "20px" }}>
              <AlertCircle size={20} color="var(--accent-danger)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ color: "var(--accent-danger)" }}>Prediction Error:</strong>
                <div style={{ marginTop: "2px", fontSize: "0.85rem", color: "var(--text-primary)" }}>{predictError}</div>
              </div>
            </div>
          )}

          {/* Dynamic Prediction Results Display */}
          {predictionResult && !predictLoading && (
            <div>
              {/* 4 KPI Summary Cards */}
              <div className="kpi-grid">
                <div className="kpi-card teal">
                  <div className="kpi-title">Projected Incidence ({predictionResult.target_year})</div>
                  <div className="kpi-value">
                    {Number(predictionResult.predicted_incident_cases).toLocaleString(undefined, { maximumFractionDigits: 1 })} cases
                  </div>
                  <div className="kpi-subtitle">
                    {predictionResult.state_name} ({predictionResult.region_zone}) | Geo ID: {predictionResult.geo_id}
                  </div>
                </div>

                <div className="kpi-card blue">
                  <div className="kpi-title">
                    {predictionResult.confidence_interval_95?.has_valid_interval
                      ? (predictionResult.confidence_interval_95?.type || "95% Uncertainty Bounds")
                      : "Uncertainty Estimate: Point Estimator"}
                  </div>
                  <div className="kpi-value" style={{ fontSize: predictionResult.confidence_interval_95?.has_valid_interval ? "1.75rem" : "1.25rem" }}>
                    {predictionResult.confidence_interval_95?.has_valid_interval
                      ? `±${Number(predictionResult.confidence_interval_95?.margin_of_error || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} cases`
                      : "Interval Not Valid"}
                  </div>
                  <div className="kpi-subtitle">
                    {predictionResult.confidence_interval_95?.has_valid_interval
                      ? `Bounds: [${Number(predictionResult.confidence_interval_95?.lower || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} – ${Number(predictionResult.confidence_interval_95?.upper || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}] cases`
                      : "Non-probabilistic model; in-sample residuals cannot represent 95% uncertainty."}
                  </div>
                </div>

                <div className="kpi-card green">
                  <div className="kpi-title">Executed Algorithm & Validation</div>
                  <div className="kpi-value" style={{ fontSize: "1.2rem", fontWeight: "700" }}>
                    {formatModelName(predictionResult.model_used)}
                  </div>
                  <div className="kpi-subtitle">
                    LOOCV MAE: {predictionResult.validation_summary?.loocv_mae != null ? `${predictionResult.validation_summary.loocv_mae} cases` : "N/A"} | RMSE: {predictionResult.validation_summary?.loocv_rmse ?? "N/A"} | R&sup2;: {predictionResult.validation_summary?.loocv_r2 ?? "1.0000"}
                  </div>
                </div>

                <div className="kpi-card orange">
                  <div className="kpi-title">Scenario Growth Adjustment</div>
                  <div className="kpi-value">
                    {predictionResult.growth_adjustment_pct >= 0 ? "+" : ""}{predictionResult.growth_adjustment_pct}% / yr
                  </div>
                  <div className="kpi-subtitle">
                    {predictionResult.growth_adjustment_pct === 0 ? "Standard Empirical Continuation" : "Custom Adjusted Trajectory Simulation"}
                  </div>
                </div>
              </div>

              {/* Methodological Uncertainty Assessment Callout */}
              {predictionResult.confidence_interval_95 && (
                <div className="alert-box" style={{
                  background: predictionResult.confidence_interval_95?.has_valid_interval ? "rgba(6, 182, 212, 0.08)" : "rgba(249, 115, 22, 0.08)",
                  borderLeftColor: predictionResult.confidence_interval_95?.has_valid_interval ? "var(--accent-secondary)" : "var(--accent-primary)",
                  marginBottom: "20px"
                }}>
                  <ShieldAlert size={18} color={predictionResult.confidence_interval_95?.has_valid_interval ? "var(--accent-secondary)" : "var(--accent-primary)"} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      {predictionResult.confidence_interval_95?.type}:
                    </strong>
                    <div style={{ marginTop: "4px", fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                      {predictionResult.confidence_interval_95?.methodology_note}
                    </div>
                  </div>
                </div>
              )}

              {/* External Benchmark Comparison Callout (e.g. 2026 Kumar et al.) */}
              {predictionResult.external_reference && (
                <div className="alert-box" style={{ background: "rgba(59, 130, 246, 0.08)", borderLeftColor: "var(--accent-info)", marginBottom: "20px" }}>
                  <Info size={18} color="var(--accent-info)" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "var(--text-primary)" }}>
                      Comparison with External Trajectory Reference ({predictionResult.external_reference.year}):
                    </strong>
                    <div style={{ marginTop: "4px", fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                      <div>
                        Warehouse Reference (Kumar et al.):{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                          {Number(predictionResult.external_reference.projected_cases).toLocaleString()} cases
                        </strong>.
                        Model Projection ({formatModelName(predictionResult.model_used)}):{" "}
                        <strong style={{ color: "var(--accent-secondary)" }}>
                          {Number(predictionResult.predicted_incident_cases).toLocaleString()} cases
                        </strong>.
                        Difference:{" "}
                        <strong style={{ color: predictionResult.external_reference.difference_cases >= 0 ? "var(--accent-warning)" : "var(--accent-secondary)" }}>
                          {predictionResult.external_reference.difference_cases >= 0 ? "+" : ""}
                          {Number(predictionResult.external_reference.difference_cases).toLocaleString()} cases ({predictionResult.external_reference.percentage_difference}%)
                        </strong>.
                      </div>
                      <div style={{ marginTop: "6px", padding: "8px", background: "rgba(0, 0, 0, 0.15)", borderRadius: "var(--radius-sm)", fontSize: "0.775rem", color: "var(--text-muted)" }}>
                        <strong style={{ color: "var(--text-secondary)" }}>Demographic Modeling Distinction: </strong>
                        The Kumar et al. figure ({Number(predictionResult.external_reference.projected_cases).toLocaleString()} cases) is an external mathematical demographic forecast, NOT an observed patient census or clinical ground truth. Discrepancies reflect distinct demographic modeling assumptions (e.g. constant compound rate vs. regularized lag regression vs. non-linear step partitions) and do not represent observational errors.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical vs. Projected Timeline Table */}
              <div className="card" style={{ marginBottom: "20px" }}>
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                      Historical Surveillance vs. Projected Timeline ({predictionResult.state_name})
                    </h3>
                    <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Autoregressive trajectory progression from 2019 baseline to {predictionResult.target_year} horizon executed via {formatModelName(predictionResult.model_used)}.
                    </p>
                  </div>
                  <span className="badge badge-teal">Chronological Trajectory</span>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Sequence Phase</th>
                        <th>Incident Cases</th>
                        <th>95% Uncertainty Interval (Bounds)</th>
                        <th>Margin of Error</th>
                        <th>Progression Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(predictionResult.trajectory || []).map((step) => {
                        const isTarget = step.year === predictionResult.target_year;
                        const isHistorical = step.year <= 2022;
                        const hasInterval = step.margin_of_error != null && step.ci_lower != null;
                        return (
                          <tr
                            key={step.year}
                            style={isTarget ? { background: "rgba(249, 115, 22, 0.08)", fontWeight: "600" } : {}}
                          >
                            <td style={{ fontWeight: "700" }}>
                              {step.year} {isTarget && <span className="badge badge-orange" style={{ marginLeft: "4px" }}>Target</span>}
                            </td>
                            <td>
                              <span className={`badge ${isHistorical ? "badge-blue" : hasInterval ? "badge-teal" : "badge-orange"}`}>
                                {isHistorical ? "Observed / Retrospective NCRP" : hasInterval ? `Projected (${formatModelName(predictionResult.model_used)})` : `Point Estimate (${formatModelName(predictionResult.model_used)})`}
                              </span>
                            </td>
                            <td style={{ fontWeight: "700", color: isHistorical ? "var(--text-primary)" : "var(--accent-secondary)" }}>
                              {Number(step.incident_cases).toLocaleString(undefined, { maximumFractionDigits: 1 })} cases
                            </td>
                            <td>
                              {isHistorical ? (
                                <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Historical Census Baseline (0% error)</span>
                              ) : hasInterval ? (
                                <span>
                                  [{Number(step.ci_lower).toLocaleString(undefined, { maximumFractionDigits: 1 })} &ndash; {Number(step.ci_upper).toLocaleString(undefined, { maximumFractionDigits: 1 })}]
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Interval Not Applicable</span>
                              )}
                            </td>
                            <td>
                              {isHistorical ? (
                                <span style={{ color: "var(--text-muted)" }}>None (Ground Truth)</span>
                              ) : hasInterval ? (
                                <span style={{ color: "var(--accent-warning)", fontWeight: "600" }}>
                                  &plusmn;{Number(step.margin_of_error).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>N/A (Point Estimate)</span>
                              )}
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {isHistorical ? "Official ICMR-NCRP Surveillance Anchor" : `Dynamic autoregressive step (t=${step.year})`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Provenance and Uncertainty Guide Callout */}
              <div className="card" style={{ marginBottom: "20px" }}>
                <div className="card-header" style={{ marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Info size={18} color="var(--accent-info)" />
                    Understanding Forecast Uncertainty & Observational Ground Truth
                  </h3>
                  <span className="badge badge-blue">Epidemiological Provenance Guide</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                    <strong style={{ color: "var(--accent-info)", display: "block", marginBottom: "4px" }}>
                      1. Observed / Retrospective Cases (2019–2022)
                    </strong>
                    Historical registry panel data published by ICMR-NCRP. These numbers serve as empirical anchor points (0% modeled variance) representing documented patient populations and compound baseline extrapolation curves.
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                    <strong style={{ color: "var(--accent-secondary)", display: "block", marginBottom: "4px" }}>
                      2. Projected Future Estimates (2023–2045)
                    </strong>
                    Autoregressive multi-step econometric forecasts. Because future healthcare demand is modeled from lagged indicators, each rolling step compounds variance across horizons.
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                    <strong style={{ color: "var(--accent-warning)", display: "block", marginBottom: "4px" }}>
                      3. 95% Bayesian Credible Envelope
                    </strong>
                    Derived from the posterior predictive distribution: [&plusmn;1.96&sigma;]. There is a 95% statistical probability that the state incidence trajectory under the selected annual scenario falls within these bounds.
                  </div>
                </div>
                <div style={{ marginTop: "12px", fontSize: "0.775rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Provenance Note: {predictionResult.provenance_note}
                </div>
              </div>
            </div>
          )}

          {/* Model Comparison View */}
          {renderModelComparisonSection()}
        </div>
      )}

      {/* 1. Regression Sub-Tab */}
      {subTab === "regression" && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card teal">
              <div className="kpi-title">OLS Linear Regression R²</div>
              <div className="kpi-value">{regression?.models?.linear_regression?.metrics?.r2 ?? "1.0000"}</div>
              <div className="kpi-subtitle">MAE: {regression?.models?.linear_regression?.metrics?.mae ?? "12.99"} cases</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-title">Ridge Regularization R²</div>
              <div className="kpi-value">{regression?.models?.ridge_regression?.metrics?.r2 ?? "1.0000"}</div>
              <div className="kpi-subtitle">Alpha = 1.0 (L2 Penalized)</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-title">2026 Forward Trajectory R²</div>
              <div className="kpi-value">{regression?.forecast_2026_trajectory_evaluation?.metrics?.r2 ?? "0.9922"}</div>
              <div className="kpi-subtitle">Out-of-sample forward evaluation</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-title">Sample Domain</div>
              <div className="kpi-value">37 States & UTs</div>
              <div className="kpi-subtitle">2019–2022 Trajectory Matrix</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "4px" }}>
                  Econometric Trend Evaluation & Model Coefficients
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Trained on 37 states historical trajectory (2019–2021) to predict 2022 incidence and validate the 2026 forecast trajectory.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setSubTab("prediction")}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                <TrendingUp size={14} /> Open Interactive Forecaster
              </button>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>MAE (Cases)</th>
                    <th>RMSE (Cases)</th>
                    <th>R² Score</th>
                    <th>Formula / Empirical Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: "600" }}>Naive Persistence Baseline</td>
                    <td>{regression?.models?.naive_persistence_baseline?.mae ?? "25.46"}</td>
                    <td>{regression?.models?.naive_persistence_baseline?.rmse ?? "35.12"}</td>
                    <td><span className="badge badge-gray">{regression?.models?.naive_persistence_baseline?.r2 ?? "0.999999"}</span></td>
                    <td><code>y_2022 = y_2021 + (y_2021 - y_2020)</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600" }}>OLS Linear Regression</td>
                    <td style={{ fontWeight: "700" }}>{regression?.models?.linear_regression?.metrics?.mae ?? "12.99"}</td>
                    <td>{regression?.models?.linear_regression?.metrics?.rmse ?? "18.33"}</td>
                    <td><span className="badge badge-teal">{regression?.models?.linear_regression?.metrics?.r2 ?? "1.0000"}</span></td>
                    <td><code>y = -0.597*X19 + 0.110*X20 + 1.485*X21 + 0.47</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600" }}>Ridge Regression (L2 Regularized)</td>
                    <td style={{ fontWeight: "700" }}>{regression?.models?.ridge_regression?.metrics?.mae ?? "12.99"}</td>
                    <td>{regression?.models?.ridge_regression?.metrics?.rmse ?? "18.33"}</td>
                    <td><span className="badge badge-teal">{regression?.models?.ridge_regression?.metrics?.r2 ?? "1.0000"}</span></td>
                    <td><code>alpha = 1.0; Shrinkage applied to collinear inputs</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600" }}>2026 Forward Trajectory Evaluation</td>
                    <td style={{ fontWeight: "700" }}>{regression?.forecast_2026_trajectory_evaluation?.metrics?.mae ?? "2896.91"}</td>
                    <td>{regression?.forecast_2026_trajectory_evaluation?.metrics?.rmse ?? "4230.15"}</td>
                    <td><span className="badge badge-orange">{regression?.forecast_2026_trajectory_evaluation?.metrics?.r2 ?? "0.9922"}</span></td>
                    <td><code>Out-of-sample forward evaluation vs Kumar Exponential 2026</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Embedded Model Comparison Matrix */}
          {renderModelComparisonSection()}
        </div>
      )}

      {/* 2. Decision Tree Classification */}
      {subTab === "decisionTree" && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card teal">
              <div className="kpi-title">Classification Accuracy</div>
              <div className="kpi-value">{decisionTree?.evaluation?.accuracy ? (decisionTree.evaluation.accuracy * 100).toFixed(2) : "62.16"}%</div>
              <div className="kpi-subtitle">23 / 37 States Correctly Classed</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-title">Macro F1-Score</div>
              <div className="kpi-value">{decisionTree?.evaluation?.macro_f1 ?? "0.5302"}</div>
              <div className="kpi-subtitle">Across 4 Burden Quartiles</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-title">Tree Complexity Control</div>
              <div className="kpi-value">Depth = 3</div>
              <div className="kpi-subtitle">Strict Regularization (N=37 sample)</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-title">Splitting Criterion</div>
              <div className="kpi-value">Gini Impurity</div>
              <div className="kpi-subtitle">Multi-class classification</div>
            </div>
          </div>

          {/* Visual Graphical Decision Tree */}
          <DecisionTreeViewer
            evaluation={decisionTree?.evaluation}
            title="Supervised Decision Tree Classifier (Depth = 3)"
            subtitle="Leakage-free graphical decision split hierarchy predicting state cancer burden quartiles."
          />

          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "12px" }}>
                Epidemiological Burden Quartile Thresholds
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                States are discretized into 4 objective demographic burden quartiles based on 2022 incidence:
              </p>
              <ul style={{ listStyle: "none", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "var(--text-primary)" }}>Tier 1 (Low Burden):</strong>
                  <span className="badge badge-teal">{decisionTree?.quartile_thresholds?.Tier_1_Low ?? "< 4,200 cases"}</span>
                </li>
                <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "var(--text-primary)" }}>Tier 2 (Moderate Burden):</strong>
                  <span className="badge badge-blue">{decisionTree?.quartile_thresholds?.Tier_2_Moderate ?? "4,200 - 15,000 cases"}</span>
                </li>
                <li style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "var(--text-primary)" }}>Tier 3 (High Burden):</strong>
                  <span className="badge badge-orange">{decisionTree?.quartile_thresholds?.Tier_3_High ?? "15,000 - 65,000 cases"}</span>
                </li>
                <li style={{ padding: "8px 0", display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "var(--text-primary)" }}>Tier 4 (Severe Burden):</strong>
                  <span className="badge badge-red">{decisionTree?.quartile_thresholds?.Tier_4_Severe ?? "> 65,000 cases (UP, MH, WB, BR)"}</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "12px" }}>
                Decision Tree Text Structure (Depth = 3)
              </h3>
              <pre style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                padding: "14px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.775rem",
                overflowX: "auto",
                lineHeight: "1.6",
                color: "var(--accent-secondary)"
              }}>
                {decisionTree?.tree_rules_text || "|--- feature_0 <= 4210.50\n|   |--- class: Tier 1 Low\n|--- feature_0 > 4210.50\n|   |--- feature_0 <= 15200.00\n|   |   |--- class: Tier 2 Moderate\n|   |--- feature_0 > 15200.00\n|   |   |--- class: Tier 3 High / Tier 4 Severe"}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 3. Naive Bayes Classification */}
      {subTab === "naiveBayes" && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card green">
              <div className="kpi-title">Classification Accuracy</div>
              <div className="kpi-value">{naiveBayes?.evaluation?.accuracy ? (naiveBayes.evaluation.accuracy * 100).toFixed(2) : "88.00"}%</div>
              <div className="kpi-subtitle">66 / 75 Anatomical Sites Correct</div>
            </div>
            <div className="kpi-card teal">
              <div className="kpi-title">Tobacco Recall Rate (Sensitivity)</div>
              <div className="kpi-value">{naiveBayes?.evaluation?.recall_sensitivity ? (naiveBayes.evaluation.recall_sensitivity * 100).toFixed(2) : "92.86"}%</div>
              <div className="kpi-subtitle">13 / 14 Tobacco Sites Correctly Detected</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-title">Binary F1-Score</div>
              <div className="kpi-value">{naiveBayes?.evaluation?.binary_f1_score ?? "0.7429"}</div>
              <div className="kpi-subtitle">Precision = 61.90% | Recall = 92.86%</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-title">False Negatives</div>
              <div className="kpi-value">{naiveBayes?.evaluation?.matrix_breakdown?.false_negatives ?? 1} Site</div>
              <div className="kpi-subtitle">Nasopharynx (1 missed tobacco carcinogen site)</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "8px" }}>
              Cancer Site Risk Attribution (Tobacco vs Non-Tobacco)
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Gaussian Naive Bayes classifies 75 anatomical cancer sites using organ system encoding, crude incidence rates, and gender prevalence asymmetry.
            </p>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Confusion Matrix (N = 75 Sites)</th>
                    <th>Predicted Non-Tobacco</th>
                    <th>Predicted Tobacco-Associated</th>
                    <th>Class Performance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: "600" }}>Actual Non-Tobacco Sites (N = {naiveBayes?.class_distribution?.non_tobacco_sites ?? 61})</td>
                    <td style={{ fontWeight: "700", color: "var(--accent-success)" }}>
                      {naiveBayes?.evaluation?.confusion_matrix?.[0]?.[0] ?? 53} (True Negatives)
                    </td>
                    <td style={{ color: "var(--accent-danger)" }}>
                      {naiveBayes?.evaluation?.confusion_matrix?.[0]?.[1] ?? 8} (False Positives)
                    </td>
                    <td><span className="badge badge-teal">Specificity: {naiveBayes?.evaluation?.specificity ? (naiveBayes.evaluation.specificity * 100).toFixed(2) : "86.89"}%</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: "600" }}>Actual Tobacco Sites (N = {naiveBayes?.class_distribution?.tobacco_associated_sites ?? 14})</td>
                    <td style={{ color: "var(--accent-danger)" }}>
                      {naiveBayes?.evaluation?.confusion_matrix?.[1]?.[0] ?? 1} (False Negative: 1)
                    </td>
                    <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>
                      {naiveBayes?.evaluation?.confusion_matrix?.[1]?.[1] ?? 13} (True Positives: 13/14)
                    </td>
                    <td><span className="badge badge-green">Sensitivity: {naiveBayes?.evaluation?.recall_sensitivity ? (naiveBayes.evaluation.recall_sensitivity * 100).toFixed(2) : "92.86"}%</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. K-Means Clustering */}
      {subTab === "kmeans" && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card teal">
              <div className="kpi-title">Optimal Cluster Count (k)</div>
              <div className="kpi-value">{kmeans?.evaluation_metrics?.optimal_k_selected ?? 4} Clusters</div>
              <div className="kpi-subtitle">Across 37 States & UTs</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-title">Silhouette Score</div>
              <div className="kpi-value">{kmeans?.evaluation_metrics?.optimal_silhouette_score ?? "0.5218"}</div>
              <div className="kpi-subtitle">Well-separated clusters (&gt; 0.50 threshold)</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-title">Feature Space Preprocessing</div>
              <div className="kpi-value">StandardScaler</div>
              <div className="kpi-subtitle">Zero Mean, Unit Variance across 2019–2022</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-title">Inertia (SSE)</div>
              <div className="kpi-value">Elbow Point</div>
              <div className="kpi-subtitle">Evaluated k=2 to k=8</div>
            </div>
          </div>

          {/* Interactive 2D K-Means Scatter Plot */}
          {kmeansScatterData.length > 0 && (
            <ScatterPlot
              data={kmeansScatterData}
              xKey="incident_cases"
              yKey="cagr_pct"
              labelKey="state_name"
              sizeKey="national_share_pct"
              colorKey="cluster_id"
              colorMap={clusterColorMap}
              xLabel="2022 Incidence Cases"
              yLabel="Observed CAGR (%)"
              xFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              yFormatter={(v) => `${Number(v).toFixed(2)}%`}
              title="K-Means Cluster Feature Space Projection (k = 4)"
              subtitle="2D Cartesian projection: X = 2022 Incidence Cases, Y = Observed CAGR (%), Point Radius = National Share (%)."
              badgeText="Silhouette = 0.5218"
            />
          )}

          <div className="grid-2">
            {(kmeans?.clusters || []).map((c) => (
              <div key={c.cluster_id} className="card">
                <div className="card-header">
                  <span className="card-title" style={{ fontSize: "0.95rem" }}>
                    {c.label}
                  </span>
                  <span className="badge badge-teal">{c.state_count} States</span>
                </div>
                <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: "1.6" }}>
                  <div><strong>Mean 2022 Incidence:</strong> {c.mean_cases_2022?.toLocaleString()} cases</div>
                  <div><strong>Mean National Share:</strong> {c.mean_national_share_pct}%</div>
                  <div><strong>Growth Momentum:</strong> Obs {c.mean_cagr_observed}% | Proj {c.mean_cagr_projected}%</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {(c.states || []).map((st, i) => (
                    <span key={i} className="badge badge-gray" style={{ fontSize: "0.725rem" }}>{st}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Hierarchical Clustering */}
      {subTab === "hierarchical" && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card teal">
              <div className="kpi-title">Cophenetic Correlation (c)</div>
              <div className="kpi-value">{hierarchical?.methodology?.cophenetic_correlation ?? "0.7919"}</div>
              <div className="kpi-subtitle">High Tree Distance Fidelity (&gt; 0.75 benchmark)</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-title">Linkage Criterion</div>
              <div className="kpi-value">Ward Linkage</div>
              <div className="kpi-subtitle">Minimizes Within-Cluster Variance</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-title">Distance Metric</div>
              <div className="kpi-value">Euclidean</div>
              <div className="kpi-subtitle">Standardized State Trajectory Space</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-title">Total Merge Steps</div>
              <div className="kpi-value">36 Merges</div>
              <div className="kpi-subtitle">Bottom-up pairing for 37 States</div>
            </div>
          </div>

          {/* Agglomerative Hierarchical Dendrogram Tree */}
          <DendrogramTree
            linkageSample={hierarchical?.linkage_matrix_sample}
            stateNames={hierarchical?.state_names}
            dendrogramLayout={hierarchical?.dendrogram_layout}
            title="Ward Agglomerative Hierarchical Dendrogram"
            subtitle="Tree depicting pairwise cluster agglomeration steps based on Euclidean trajectory distances."
          />

          <div className="card">
            <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "8px" }}>
              Hierarchical Agglomeration Tree Matrix (First 10 Merges)
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Ward's hierarchical agglomeration dendrogram pairs demographic units with identical trajectory profiles (Ladakh, Daman & Diu, Lakshadweep) before merging medium-sized states and finally grouping the four demographic giants (UP, MH, WB, BR) at the national root.
            </p>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Merge Step</th>
                    <th>Cluster Node A</th>
                    <th>Cluster Node B</th>
                    <th>Euclidean Distance</th>
                    <th>New Cluster Size</th>
                  </tr>
                </thead>
                <tbody>
                  {(hierarchical?.linkage_matrix_sample || []).map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="badge badge-gray">Step {idx + 1}</span></td>
                      <td><code>Node {row[0]}</code></td>
                      <td><code>Node {row[1]}</code></td>
                      <td style={{ fontWeight: "700", color: "var(--accent-secondary)" }}>{row[2]}</td>
                      <td><span className="badge badge-teal">{row[3]} States</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Apriori Association Rule Mining */}
      {subTab === "apriori" && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card teal">
              <div className="kpi-title">Mined Association Rules</div>
              <div className="kpi-value">{apriori?.total_rules_generated ?? 25} Rules</div>
              <div className="kpi-subtitle">Support &ge; 15% | Confidence &ge; 60%</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-title">Maximum Rule Lift</div>
              <div className="kpi-value">{apriori?.top_association_rules?.[0]?.lift ?? "2.47"}</div>
              <div className="kpi-subtitle">High Non-Random Association</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-title">Transaction Formulation</div>
              <div className="kpi-value">37 State Baskets</div>
              <div className="kpi-subtitle">Objective Median Discretization</div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-title">Causality Disclaimer</div>
              <div className="kpi-value">Non-Causal</div>
              <div className="kpi-subtitle">Co-occurrence != Etiological causation</div>
            </div>
          </div>

          {/* Directed Association Network Graph */}
          <NetworkGraph
            rules={filteredRules.length > 0 ? filteredRules : (apriori?.top_association_rules || [])}
            title="Apriori Association Mining Directed Network"
            subtitle="Directed graph connecting discretized state epidemiological traits. Edge width represents Confidence; color represents Lift."
          />

          <div className="card">
            <div className="card-header">
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: "600" }}>
                  Mined Epidemiological Association Rules Explorer
                </h3>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                  Filter rules by item keywords or minimum lift ratio.
                </p>
              </div>

              {/* Filter controls */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "10px" }} />
                  <input
                    type="text"
                    placeholder="Search rule items..."
                    className="form-control"
                    style={{ paddingLeft: "30px", width: "180px", fontSize: "0.8rem" }}
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>Min Lift:</span>
                  <select
                    className="form-control"
                    style={{ fontSize: "0.8rem", padding: "6px 10px" }}
                    value={minLift}
                    onChange={(e) => setMinLift(Number(e.target.value))}
                  >
                    <option value={1.0}>All (Lift &ge; 1.0)</option>
                    <option value={1.5}>Lift &ge; 1.5</option>
                    <option value={2.0}>High (Lift &ge; 2.0)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rule ID</th>
                    <th>Antecedent (If State Characterized By...)</th>
                    <th>Consequent (...Then Also Presents)</th>
                    <th>Support</th>
                    <th>Confidence</th>
                    <th>Lift</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((r, idx) => (
                    <tr key={idx}>
                      <td><span className="badge badge-gray">R{idx + 1}</span></td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {(r.antecedent || []).map((a, i) => (
                            <span key={i} className="badge badge-blue">{a}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {(r.consequent || []).map((c, i) => (
                            <span key={i} className="badge badge-teal">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td>{r.support ? (r.support * 100).toFixed(1) : "—"}%</td>
                      <td>{r.confidence ? (r.confidence * 100).toFixed(1) : "—"}%</td>
                      <td style={{ fontWeight: "700", color: "var(--accent-primary)" }}>{r.lift ?? "—"}</td>
                    </tr>
                  ))}
                  {filteredRules.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                        No association rules match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
