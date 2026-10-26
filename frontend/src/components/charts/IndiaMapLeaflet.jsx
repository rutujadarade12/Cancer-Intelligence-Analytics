import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Info, Map as MapIcon, RotateCcw } from "lucide-react";

/**
 * Tile Layer Providers (OpenStreetMap based, 100% Free, No API Key or Billing Required)
 */
const TILE_PROVIDERS = {
  dark: {
    name: "Dark (OSM)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 18
  },
  standard: {
    name: "Standard OSM",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 18
  }
};

export default function IndiaMapLeaflet({
  states = [],
  selectedStateId = null,
  onSelectState,
  selectedMetric = "incident_cases",
  onMetricChange
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const geoJsonDataRef = useRef(null);

  const [hoveredState, setHoveredState] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [tileMode, setTileMode] = useState("dark"); // "dark" | "standard"
  const [loadError, setLoadError] = useState(null);

  // Map state codes and IDs to state data records from warehouse
  const stateDataMap = useMemo(() => {
    const map = {};
    states.forEach((st) => {
      if (st.state_code) map[st.state_code.toUpperCase()] = st;
      if (st.geo_id != null) map[String(st.geo_id)] = st;
      if (st.state_name) map[st.state_name.toLowerCase()] = st;
    });
    return map;
  }, [states]);

  // Keep refs up-to-date to prevent stale closures in Leaflet event listeners
  const stateDataMapRef = useRef(stateDataMap);
  stateDataMapRef.current = stateDataMap;

  const selectedMetricRef = useRef(selectedMetric);
  selectedMetricRef.current = selectedMetric;

  const onSelectStateRef = useRef(onSelectState);
  onSelectStateRef.current = onSelectState;

  // Metric configuration
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case "national_share_pct":
        return {
          label: "National Share (%)",
          formatter: (v) => (v != null ? `${Number(v).toFixed(2)}%` : "N/A")
        };
      case "cagr_observed":
        return {
          label: "Observed CAGR (%)",
          formatter: (v) => (v != null ? `${(Number(v) * 100).toFixed(2)}%` : "N/A")
        };
      case "incident_cases":
      default:
        return {
          label: "2022 Incidence",
          formatter: (v) => (v != null ? `${Number(v).toLocaleString()} cases` : "N/A")
        };
    }
  }, [selectedMetric]);

  // Calculate dynamic min/max for choropleth gradient
  const { minVal, maxVal } = useMemo(() => {
    const vals = states
      .map((s) => s[selectedMetric])
      .filter((v) => typeof v === "number" && !isNaN(v));
    if (vals.length === 0) return { minVal: 0, maxVal: 100 };
    return {
      minVal: Math.min(...vals),
      maxVal: Math.max(...vals)
    };
  }, [states, selectedMetric]);

  // Interpolate choropleth color (Teal -> Sky Blue -> Orange -> Red)
  const getColor = useCallback((val) => {
    if (val == null || isNaN(val)) return "#334155";
    if (maxVal === minVal) return "#06B6D4";

    const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));

    if (ratio < 0.25) return "#06B6D4"; // Minimal (Cyan / Teal)
    if (ratio < 0.50) return "#38BDF8"; // Moderate (Sky Blue)
    if (ratio < 0.75) return "#F97316"; // Elevated (Orange)
    return "#EF4444"; // Severe (Red)
  }, [minVal, maxVal]);

  // Style function for GeoJSON features
  const getFeatureStyle = useCallback((feature) => {
    const code = String(feature.id || feature.properties?.state_code || "").toUpperCase();
    const geoId = feature.properties?.geo_id;
    const name = String(feature.properties?.state_name || "").toLowerCase();

    const currentMap = stateDataMapRef.current;
    const currentMetric = selectedMetricRef.current;
    const stData = currentMap[code] || currentMap[String(geoId)] || currentMap[name];
    const val = stData ? stData[currentMetric] : null;
    const isSelected = selectedStateId && stData && stData.geo_id === selectedStateId;

    return {
      fillColor: getColor(val),
      weight: isSelected ? 3.5 : 1.2,
      opacity: 1,
      color: isSelected ? "#FFFFFF" : "#1E293B",
      fillOpacity: isSelected ? 0.92 : 0.72
    };
  }, [selectedStateId, getColor]);

  // Reset map view to fit India bounds
  const handleResetView = useCallback(() => {
    if (mapInstanceRef.current && geoJsonLayerRef.current) {
      const bounds = geoJsonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center coordinates for India
    const map = L.map(mapContainerRef.current, {
      center: [22.8, 79.6],
      zoom: 4.6,
      minZoom: 4,
      maxZoom: 9,
      zoomControl: true,
      attributionControl: true
    });

    // Add initial Tile Layer
    const provider = TILE_PROVIDERS[tileMode];
    const tileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || "abc",
      maxZoom: provider.maxZoom
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Ensure map redraws cleanly if container resizes
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Load GeoJSON data
    fetch("/data/india_states.geojson")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status} fetching GeoJSON`);
        return res.json();
      })
      .then((geojson) => {
        geoJsonDataRef.current = geojson;

        const layer = L.geoJSON(geojson, {
          style: getFeatureStyle,
          onEachFeature: (feature, layerItem) => {
            const code = String(feature.id || feature.properties?.state_code || "").toUpperCase();
            const geoId = feature.properties?.geo_id;
            const name = feature.properties?.state_name || code;

            // Bind native hover tooltip with state name
            layerItem.bindTooltip(
              `<div style="font-weight:700; font-size:12px; color:#F8FAFC;">${name} (${code})</div>`,
              {
                direction: "top",
                sticky: true,
                opacity: 0.95,
                className: "leaflet-custom-tooltip"
              }
            );

            layerItem.on({
              mouseover: (e) => {
                const target = e.target;
                target.setStyle({
                  weight: 3.0,
                  color: "#38BDF8",
                  fillOpacity: 0.90
                });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                  target.bringToFront();
                }

                const currentMap = stateDataMapRef.current;
                const currentMetric = selectedMetricRef.current;
                const stData = currentMap[code] || currentMap[String(geoId)] || currentMap[name.toLowerCase()];

                setHoveredState(
                  stData || {
                    state_name: name,
                    state_code: code,
                    region_zone: feature.properties?.region_zone || "India",
                    [currentMetric]: null
                  }
                );
              },
              mouseout: (e) => {
                if (geoJsonLayerRef.current) {
                  geoJsonLayerRef.current.resetStyle(e.target);
                }
                setHoveredState(null);
              },
              click: () => {
                const currentMap = stateDataMapRef.current;
                const stData = currentMap[code] || currentMap[String(geoId)] || currentMap[name.toLowerCase()];
                if (stData?.geo_id != null && onSelectStateRef.current) {
                  onSelectStateRef.current(stData.geo_id);
                }
              }
            });
          }
        }).addTo(map);

        geoJsonLayerRef.current = layer;

        // Auto-fit to India's real boundary extent
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [15, 15] });
        }

        setMapReady(true);
      })
      .catch((err) => {
        console.error("Leaflet GeoJSON load error:", err);
        setLoadError(`Failed to load India state boundary GeoJSON: ${err.message}`);
      });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      geoJsonLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []); // Run once on mount

  // Update styles when selectedMetric, states data, or selectedStateId changes
  useEffect(() => {
    if (geoJsonLayerRef.current && mapReady) {
      geoJsonLayerRef.current.setStyle(getFeatureStyle);
    }
  }, [getFeatureStyle, mapReady, states, selectedMetric, selectedStateId]);

  // Update Tile Layer when tileMode toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const provider = TILE_PROVIDERS[tileMode];

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newTileLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || "abc",
      maxZoom: provider.maxZoom
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;

    // Keep geojson layer above tiles
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.bringToFront();
    }
  }, [tileMode]);

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      {/* SINGLE CLEAN METRIC CONTROLS BAR (No duplicate selector!) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        {/* Metric Selector Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Layers size={18} color="var(--accent-secondary)" />
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>
            Metric Layer:
          </span>
          <div
            style={{
              display: "inline-flex",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-sm)",
              padding: "2px",
              border: "1px solid var(--border-color)"
            }}
          >
            <button
              onClick={() => onMetricChange("incident_cases")}
              style={{
                background: selectedMetric === "incident_cases" ? "var(--accent-primary)" : "transparent",
                color: selectedMetric === "incident_cases" ? "#FFFFFF" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "5px 12px",
                fontSize: "0.775rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              2022 Incidence
            </button>
            <button
              onClick={() => onMetricChange("national_share_pct")}
              style={{
                background: selectedMetric === "national_share_pct" ? "var(--accent-primary)" : "transparent",
                color: selectedMetric === "national_share_pct" ? "#FFFFFF" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "5px 12px",
                fontSize: "0.775rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              National Share %
            </button>
            <button
              onClick={() => onMetricChange("cagr_observed")}
              style={{
                background: selectedMetric === "cagr_observed" ? "var(--accent-primary)" : "transparent",
                color: selectedMetric === "cagr_observed" ? "#FFFFFF" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "5px 12px",
                fontSize: "0.775rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Observed CAGR %
            </button>
          </div>
        </div>

        {/* View Controls & Tile Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Tile Mode Toggle */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "4px 10px", fontSize: "0.725rem", height: "30px" }}
            onClick={() => setTileMode((prev) => (prev === "dark" ? "standard" : "dark"))}
            title="Toggle OpenStreetMap tile layer"
          >
            <MapIcon size={12} style={{ marginRight: "4px" }} />
            {tileMode === "dark" ? "Dark OSM" : "Standard OSM"}
          </button>

          {/* Reset Zoom to India Bounds */}
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: "4px 10px", fontSize: "0.725rem", height: "30px" }}
            onClick={handleResetView}
            title="Reset to India bounds"
          >
            <RotateCcw size={12} style={{ marginRight: "4px" }} />
            Reset View
          </button>

          <span className="badge badge-teal" style={{ fontSize: "0.7rem", height: "26px", display: "inline-flex", alignItems: "center" }}>
            37 States & UTs (Leaflet OSM)
          </span>
        </div>
      </div>

      {/* Error alert if GeoJSON fails */}
      {loadError && (
        <div className="alert-box" style={{ borderColor: "var(--accent-danger)", background: "rgba(239, 68, 68, 0.1)", marginBottom: "12px" }}>
          <div style={{ fontSize: "0.825rem", color: "var(--text-primary)" }}>{loadError}</div>
        </div>
      )}

      {/* Leaflet Map Canvas Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "560px",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
          background: "#0f172a"
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "100%",
            background: "#0f172a"
          }}
        />

        {/* Floating State Info Tooltip on Hover */}
        {hoveredState && (
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              background: "rgba(15, 23, 42, 0.94)",
              backdropFilter: "blur(8px)",
              border: "1px solid var(--accent-secondary)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6)",
              pointerEvents: "none",
              zIndex: 1000,
              minWidth: "210px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                {hoveredState.state_name}
              </span>
              <span className="badge badge-teal" style={{ fontSize: "0.68rem" }}>
                {hoveredState.state_code}
              </span>
            </div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-muted)", marginBottom: "8px" }}>
              {hoveredState.region_zone ? `${hoveredState.region_zone} Regional Zone` : "National Territory"}
            </div>
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.775rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{metricConfig.label}:</span>
                <span style={{ fontWeight: "700", color: "var(--accent-primary)" }}>
                  {metricConfig.formatter(hoveredState[selectedMetric])}
                </span>
              </div>
              {selectedMetric !== "incident_cases" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>2022 Incidence:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                    {hoveredState.incident_cases?.toLocaleString()} cases
                  </span>
                </div>
              )}
              {selectedMetric !== "national_share_pct" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>National Share:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                    {hoveredState.national_share_pct?.toFixed(2)}%
                  </span>
                </div>
              )}
              {selectedMetric !== "cagr_observed" && hoveredState.cagr_observed != null && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Observed CAGR:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                    {(hoveredState.cagr_observed * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <div style={{ marginTop: "8px", fontSize: "0.675rem", color: "var(--accent-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              &bull; Click state polygon to open longitudinal drawer
            </div>
          </div>
        )}

        {/* Dynamic Continuous Choropleth Gradient Legend */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(15, 23, 42, 0.92)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 1000
          }}
        >
          <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
            {metricConfig.label} Gradient
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>{metricConfig.formatter(minVal)}</span>
            <div
              style={{
                width: "140px",
                height: "10px",
                borderRadius: "3px",
                background: "linear-gradient(to right, #06B6D4, #38BDF8, #F97316, #EF4444)"
              }}
            />
            <span style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>{metricConfig.formatter(maxVal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: "var(--text-muted)" }}>
            <span>Minimal</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Severe</span>
          </div>
        </div>

        {/* Interactive Helper Hint */}
        <div
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            background: "rgba(15, 23, 42, 0.88)",
            backdropFilter: "blur(6px)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            padding: "5px 10px",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            zIndex: 1000
          }}
        >
          <Info size={12} color="var(--accent-secondary)" />
          <span>Interactive Leaflet Map &bull; Scroll to Zoom, Drag to Pan</span>
        </div>
      </div>
    </div>
  );
}
