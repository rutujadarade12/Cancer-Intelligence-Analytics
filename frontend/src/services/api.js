/**
 * API Service for Cancer Intelligence & Analytics
 * Connects to FastAPI backend with Vite proxy support and direct fallback
 */

const API_BASE_FALLBACK = "http://127.0.0.1:8000/api";

async function fetchJson(endpoint) {
  const primaryUrl = (typeof window !== "undefined" && window.location.port === "5173")
    ? `/api${endpoint}`
    : `${API_BASE_FALLBACK}${endpoint}`;

  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) {
      let detail = `API error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          detail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (_) {}
      throw new Error(detail);
    }
    return await res.json();
  } catch (err) {
    if (primaryUrl !== `${API_BASE_FALLBACK}${endpoint}`) {
      try {
        const fbRes = await fetch(`${API_BASE_FALLBACK}${endpoint}`);
        if (fbRes.ok) {
          return await fbRes.json();
        }
      } catch (fbErr) {
        // Fall through
      }
    }
    console.warn(`Fetch failed for ${endpoint}:`, err);
    throw err;
  }
}

async function postJson(endpoint, body) {
  const primaryUrl = (typeof window !== "undefined" && window.location.port === "5173")
    ? `/api${endpoint}`
    : `${API_BASE_FALLBACK}${endpoint}`;

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };

  try {
    const res = await fetch(primaryUrl, options);
    if (!res.ok) {
      let detail = `API error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          detail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (_) {}
      throw new Error(detail);
    }
    return await res.json();
  } catch (err) {
    if (primaryUrl !== `${API_BASE_FALLBACK}${endpoint}`) {
      try {
        const fbRes = await fetch(`${API_BASE_FALLBACK}${endpoint}`, options);
        if (fbRes.ok) {
          return await fbRes.json();
        }
      } catch (fbErr) {
        // Fall through
      }
    }
    console.warn(`Post failed for ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => fetchJson("/health"),

  // Dashboard
  getDashboardSummary: () => fetchJson("/dashboard/summary"),

  // Geography
  getStates: (region = "", year = 2022) => {
    let url = `/geography/states?year=${year}`;
    if (region) url += `&region=${encodeURIComponent(region)}`;
    return fetchJson(url);
  },
  getRegions: (year = 2022) => fetchJson(`/geography/regions?year=${year}`),
  getStateDetail: (geoId) => fetchJson(`/geography/states/${geoId}`),

  // Cancer Sites
  getCancerSites: (organSystem = "", tobaccoOnly = false) => {
    let url = `/cancer-sites?tobacco_only=${tobaccoOnly}`;
    if (organSystem) url += `&organ_system=${encodeURIComponent(organSystem)}`;
    return fetchJson(url);
  },
  getOrganSystems: () => fetchJson("/cancer-sites/organ-systems"),
  getSiteBurden: (year = 2022, gender = "") => {
    let url = `/cancer-sites/burden?year=${year}`;
    if (gender) url += `&gender=${encodeURIComponent(gender)}`;
    return fetchJson(url);
  },
  getClinicalStages: () => fetchJson("/cancer-sites/clinical-stages"),

  // Trends
  getStateProjections: (stateId = null, region = "") => {
    let url = "/trends/state-projections";
    const params = [];
    if (stateId) params.push(`state_id=${stateId}`);
    if (region) params.push(`region=${encodeURIComponent(region)}`);
    if (params.length) url += `?${params.join("&")}`;
    return fetchJson(url);
  },
  getApcTrends: (direction = "", significantOnly = false, site = "") => {
    let url = `/trends/apc?significant_only=${Boolean(significantOnly)}`;
    if (direction) url += `&direction=${encodeURIComponent(direction)}`;
    if (site) url += `&site=${encodeURIComponent(site)}`;
    return fetchJson(url);
  },
  getPbcrSurveillance: (region = "", gender = "") => {
    let url = "/trends/pbcr-surveillance";
    const params = [];
    if (region) params.push(`region=${encodeURIComponent(region)}`);
    if (gender) params.push(`gender=${encodeURIComponent(gender)}`);
    if (params.length) url += `?${params.join("&")}`;
    return fetchJson(url);
  },

  // Mortality
  getStateMortality: (year = null) => {
    let url = "/mortality/state-surveillance";
    if (year) url += `?year=${year}`;
    return fetchJson(url);
  },
  getMirSummary: (year = 2022) => fetchJson(`/mortality/mir-summary?year=${year}`),

  // Infrastructure
  getNationalInfra: () => fetchJson("/infrastructure/national"),
  getMaharashtraInfra: (category = "") => {
    let url = "/infrastructure/maharashtra";
    if (category) url += `?category=${encodeURIComponent(category)}`;
    return fetchJson(url);
  },
  getScreeningData: () => fetchJson("/infrastructure/screening"),

  // OLAP
  getRegionalRollups: (year = 2022) => fetchJson(`/olap/regional-rollups?year=${year}`),
  getOrganSystemBurden: (year = 2022, gender = "") => {
    let url = `/olap/organ-system-burden?year=${year}`;
    if (gender) url += `&gender=${encodeURIComponent(gender)}`;
    return fetchJson(url);
  },
  getStatePivots: (region = "") => {
    let url = "/olap/state-pivots";
    if (region) url += `?region=${encodeURIComponent(region)}`;
    return fetchJson(url);
  },
  getSliceDice: (regions = "", years = "") => {
    let url = "/olap/slice-dice?";
    const params = [];
    if (regions) params.push(`regions=${encodeURIComponent(regions)}`);
    if (years) params.push(`years=${encodeURIComponent(years)}`);
    return fetchJson(url + params.join("&"));
  },

  // Data Mining Models & Real-Time Prediction
  getModelsSummary: () => fetchJson("/models/all"),
  getRegressionModel: () => fetchJson("/models/regression"),
  getDecisionTreeModel: () => fetchJson("/models/decision-tree"),
  getNaiveBayesModel: () => fetchJson("/models/naive-bayes"),
  getKmeansModel: () => fetchJson("/models/kmeans"),
  getHierarchicalModel: () => fetchJson("/models/hierarchical"),
  getAprioriModel: () => fetchJson("/models/apriori"),
  getModelBenchmarks: () => fetchJson("/models/evaluation/comparison"),
  getPredictionSupportedStates: () => fetchJson("/models/supported-states"),
  predictIncidence: (payload) => postJson("/models/predict/incidence", payload),

  // Assistant
  askAssistant: (query) => postJson("/assistant/query", { query }),

  // Reports
  getReportsList: () => fetchJson("/reports/list"),
  getExportUrl: (tableName) => `${API_BASE_FALLBACK}/reports/export-csv?table=${tableName}`
};
