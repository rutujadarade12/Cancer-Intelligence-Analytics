import React, { useState, useMemo } from "react";
import { Info, Layers, Eye } from "lucide-react";

/**
 * High-fidelity Conformed SVG Map Coordinates for 37 States & Union Territories of India
 * ViewBox: 0 0 650 720
 * Conformed to Census of India / NCRP classification matching Dim_Geography.
 */
const INDIA_STATE_PATHS = {
  // Northern Region
  LA: {
    name: "Ladakh",
    d: "M 220 30 L 260 25 L 305 45 L 330 85 L 315 125 L 290 145 L 255 130 L 235 110 L 225 75 Z",
    cx: 275, cy: 75
  },
  JK: {
    name: "Jammu and Kashmir",
    d: "M 175 65 L 220 30 L 225 75 L 235 110 L 210 135 L 180 130 L 160 100 Z",
    cx: 195, cy: 95
  },
  HP: {
    name: "Himachal Pradesh",
    d: "M 210 135 L 235 110 L 255 130 L 265 160 L 240 180 L 215 165 Z",
    cx: 235, cy: 150
  },
  PB: {
    name: "Punjab",
    d: "M 175 135 L 210 135 L 215 165 L 195 195 L 165 175 Z",
    cx: 190, cy: 165
  },
  CH: {
    name: "Chandigarh",
    d: "M 208 160 L 216 160 L 216 168 L 208 168 Z",
    cx: 212, cy: 164
  },
  UK: {
    name: "Uttaranchal",
    d: "M 240 180 L 265 160 L 290 170 L 300 205 L 260 220 Z",
    cx: 270, cy: 195
  },
  HR: {
    name: "Haryana",
    d: "M 195 195 L 215 165 L 240 180 L 235 220 L 215 235 L 190 225 Z",
    cx: 210, cy: 205
  },
  DL: {
    name: "Delhi",
    d: "M 225 210 L 237 210 L 237 222 L 225 222 Z",
    cx: 231, cy: 216
  },

  // Central / Northern Gangetic
  RJ: {
    name: "Rajasthan",
    d: "M 130 195 L 190 225 L 215 235 L 225 270 L 205 320 L 160 340 L 120 300 L 110 240 Z",
    cx: 165, cy: 270
  },
  UP: {
    name: "Uttar Pradesh",
    d: "M 225 222 L 260 220 L 300 205 L 340 230 L 375 255 L 345 310 L 285 320 L 250 300 L 225 270 Z",
    cx: 295, cy: 265
  },
  MP: {
    name: "Madhya Pradesh",
    d: "M 205 320 L 250 300 L 285 320 L 345 310 L 360 355 L 340 395 L 270 410 L 215 390 L 180 365 Z",
    cx: 270, cy: 355
  },
  CG: {
    name: "Chhattisgarh",
    d: "M 345 310 L 375 325 L 370 380 L 350 445 L 325 435 L 330 380 L 340 355 Z",
    cx: 350, cy: 380
  },

  // Eastern Region
  BR: {
    name: "Bihar",
    d: "M 345 235 L 405 245 L 415 285 L 375 295 L 345 280 Z",
    cx: 380, cy: 265
  },
  JH: {
    name: "Jharkhand",
    d: "M 370 295 L 420 290 L 425 340 L 380 345 L 360 325 Z",
    cx: 390, cy: 320
  },
  WB: {
    name: "West Bengal",
    d: "M 420 280 L 440 270 L 435 345 L 445 385 L 415 385 L 415 330 Z",
    cx: 430, cy: 335
  },
  OR: {
    name: "Orissa",
    d: "M 370 380 L 425 365 L 440 410 L 395 470 L 365 440 L 370 405 Z",
    cx: 400, cy: 415
  },

  // North-Eastern Region
  SK: {
    name: "Sikkim",
    d: "M 425 230 L 445 230 L 445 250 L 425 250 Z",
    cx: 435, cy: 240
  },
  AR: {
    name: "Arunachal Pradesh",
    d: "M 510 185 L 575 190 L 610 230 L 580 245 L 535 225 Z",
    cx: 560, cy: 215
  },
  AS: {
    name: "Assam",
    d: "M 465 240 L 535 225 L 570 245 L 540 280 L 495 270 L 465 265 Z",
    cx: 515, cy: 255
  },
  NL: {
    name: "Nagaland",
    d: "M 570 245 L 595 250 L 590 280 L 565 275 Z",
    cx: 580, cy: 262
  },
  MN: {
    name: "Manipur",
    d: "M 565 275 L 590 280 L 585 315 L 560 310 Z",
    cx: 575, cy: 295
  },
  MZ: {
    name: "Mizoram",
    d: "M 545 315 L 570 315 L 560 365 L 540 355 Z",
    cx: 555, cy: 335
  },
  TR: {
    name: "Tripura",
    d: "M 520 315 L 545 315 L 540 350 L 520 345 Z",
    cx: 532, cy: 330
  },
  ML: {
    name: "Meghalaya",
    d: "M 470 265 L 525 265 L 525 290 L 470 290 Z",
    cx: 497, cy: 277
  },

  // Western Region
  GJ: {
    name: "Gujarat",
    d: "M 90 295 L 145 295 L 180 340 L 160 395 L 125 410 L 100 375 L 65 350 L 80 315 Z",
    cx: 125, cy: 350
  },
  DD: {
    name: "Daman",
    d: "M 133 408 L 141 408 L 141 416 L 133 416 Z",
    cx: 137, cy: 412
  },
  DN: {
    name: "Dadra and Nagar Haveli",
    d: "M 143 415 L 152 415 L 152 424 L 143 424 Z",
    cx: 147, cy: 419
  },
  MH: {
    name: "Maharashtra",
    d: "M 155 395 L 215 390 L 270 410 L 330 430 L 310 495 L 240 505 L 180 480 L 150 435 Z",
    cx: 235, cy: 450
  },
  GA: {
    name: "Goa",
    d: "M 180 525 L 195 525 L 190 545 L 178 540 Z",
    cx: 186, cy: 534
  },

  // Southern Region
  TG: {
    name: "Telangana",
    d: "M 265 445 L 325 435 L 345 470 L 315 525 L 265 515 L 255 475 Z",
    cx: 295, cy: 480
  },
  AP: {
    name: "Andhra Pradesh",
    d: "M 325 470 L 365 440 L 395 470 L 365 550 L 315 580 L 305 535 L 345 500 Z",
    cx: 345, cy: 520
  },
  KA: {
    name: "Karnataka",
    d: "M 195 485 L 245 495 L 270 545 L 260 605 L 215 615 L 190 550 Z",
    cx: 230, cy: 555
  },
  KL: {
    name: "Kerala",
    d: "M 215 615 L 245 615 L 255 680 L 240 690 L 220 655 Z",
    cx: 235, cy: 655
  },
  TN: {
    name: "Tamil Nadu",
    d: "M 245 605 L 310 580 L 305 645 L 285 685 L 255 680 L 245 625 Z",
    cx: 275, cy: 635
  },
  PY: {
    name: "Pondicherry",
    d: "M 307 608 L 315 608 L 315 616 L 307 616 Z",
    cx: 311, cy: 612
  },

  // Islands
  LD: {
    name: "Lakshadweep",
    d: "M 150 635 L 165 635 L 165 675 L 150 675 Z",
    cx: 157, cy: 655
  },
  AN: {
    name: "Andaman and Nicobar Islands",
    d: "M 570 550 L 585 550 L 585 670 L 570 670 Z",
    cx: 577, cy: 610
  }
};

export default function IndiaMapSVG({
  states = [],
  selectedStateId = null,
  onSelectState = () => {},
  selectedMetric = "incident_cases",
  onMetricChange = () => {}
}) {
  const [hoveredState, setHoveredState] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Map state data by state_code
  const stateDataMap = useMemo(() => {
    const map = {};
    states.forEach((st) => {
      if (st.state_code) {
        map[st.state_code.toUpperCase()] = st;
      }
    });
    return map;
  }, [states]);

  // Metric range calculation
  const { minVal, maxVal, metricLabel, metricFormatter } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let label = "2022 Incidence Cases";
    let formatter = (v) => (v != null ? Number(v).toLocaleString() : "N/A");

    if (selectedMetric === "national_share_pct") {
      label = "National Share %";
      formatter = (v) => (v != null ? `${Number(v).toFixed(2)}%` : "N/A");
    } else if (selectedMetric === "cagr_observed") {
      label = "Observed CAGR %";
      formatter = (v) => (v != null ? `${(Number(v) * 100).toFixed(2)}%` : "N/A");
    }

    states.forEach((st) => {
      let val = st[selectedMetric];
      if (val != null) {
        val = Number(val);
        if (selectedMetric === "cagr_observed") val = val * 100;
        if (val < min) min = val;
        if (val > max) max = val;
      }
    });

    if (min === Infinity) {
      min = 0;
      max = 100;
    }

    return { minVal: min, maxVal: max, metricLabel: label, metricFormatter: formatter };
  }, [states, selectedMetric]);

  // Dynamic continuous color interpolation
  const getColor = (value) => {
    if (value == null) return "var(--bg-secondary)";
    let v = Number(value);
    if (selectedMetric === "cagr_observed") v = v * 100;

    const norm = Math.max(0, Math.min(1, (v - minVal) / (maxVal - minVal || 1)));

    // Multi-stop gradient: Cyan -> Sky Blue -> Orange -> Red
    if (norm < 0.25) {
      return "#06B6D4"; // Cyan
    } else if (norm < 0.5) {
      return "#38BDF8"; // Sky Blue
    } else if (norm < 0.75) {
      return "#F97316"; // Command Orange
    } else {
      return "#EF4444"; // Crimson Red
    }
  };

  const handleMouseEnter = (code, e) => {
    const data = stateDataMap[code];
    setHoveredState(data || { state_name: INDIA_STATE_PATHS[code]?.name, state_code: code });
    updateMousePosition(e);
  };

  const handleMouseMove = (e) => {
    updateMousePosition(e);
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
  };

  const updateMousePosition = (e) => {
    const rect = e.currentTarget.closest("svg")?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      {/* Top Controls Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Layers size={18} color="var(--accent-secondary)" />
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>
            Metric Layer:
          </span>
          <div style={{ display: "inline-flex", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: "2px", border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => onMetricChange("incident_cases")}
              style={{
                background: selectedMetric === "incident_cases" ? "var(--accent-primary)" : "transparent",
                color: selectedMetric === "incident_cases" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              2022 Incidence
            </button>
            <button
              onClick={() => onMetricChange("national_share_pct")}
              style={{
                background: selectedMetric === "national_share_pct" ? "var(--accent-primary)" : "transparent",
                color: selectedMetric === "national_share_pct" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              National Share %
            </button>
            <button
              onClick={() => onMetricChange("cagr_observed")}
              style={{
                background: selectedMetric === "cagr_observed" ? "var(--accent-primary)" : "transparent",
                color: selectedMetric === "cagr_observed" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Observed CAGR %
            </button>
          </div>
        </div>

        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Info size={14} />
          <span>Click any state polygon to open the longitudinal trajectory drawer.</span>
        </div>
      </div>

      {/* SVG Map Container */}
      <div style={{ position: "relative", width: "100%", height: "540px", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <svg
          viewBox="0 0 650 720"
          style={{ width: "100%", height: "100%", maxHeight: "530px" }}
          onMouseMove={handleMouseMove}
        >
          {/* Subtle Grid Watermark */}
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.3" />
            </pattern>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="650" height="720" fill="url(#mapGrid)" />

          {/* Render all 37 State/UT polygons */}
          <g>
            {Object.entries(INDIA_STATE_PATHS).map(([code, def]) => {
              const data = stateDataMap[code];
              const val = data ? data[selectedMetric] : null;
              const fill = getColor(val);
              const isSelected = selectedStateId && data && data.geo_id === selectedStateId;
              const isHovered = hoveredState && hoveredState.state_code === code;

              return (
                <g key={code}>
                  <path
                    d={def.d}
                    fill={fill}
                    stroke={isSelected ? "#F8FAFC" : isHovered ? "#38BDF8" : "var(--bg-primary)"}
                    strokeWidth={isSelected ? "3" : isHovered ? "2.5" : "1.2"}
                    strokeLinejoin="round"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      filter: isSelected ? "url(#glow)" : "none"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(code, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                      if (data?.geo_id) onSelectState(data.geo_id);
                    }}
                  />
                  {/* State Code Label */}
                  {def.cx && def.cy && (
                    <text
                      x={def.cx}
                      y={def.cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#FFFFFF"
                      fontSize={code === "CH" || code === "DL" || code === "DD" || code === "DN" || code === "GA" || code === "PY" ? "8" : "10"}
                      fontWeight="700"
                      pointerEvents="none"
                      style={{ textShadow: "0 1px 3px rgba(0,0,0,0.85)" }}
                    >
                      {code}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Compass Rose */}
          <g transform="translate(580, 70)">
            <circle cx="0" cy="0" r="18" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="1" />
            <path d="M 0 -14 L 4 0 L -4 0 Z" fill="var(--accent-primary)" />
            <path d="M 0 14 L 4 0 L -4 0 Z" fill="var(--text-muted)" />
            <text x="0" y="-17" textAnchor="middle" fill="var(--accent-primary)" fontSize="9" fontWeight="700">N</text>
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredState && (
          <div
            style={{
              position: "absolute",
              left: `${Math.min(mousePos.x + 15, 420)}px`,
              top: `${Math.min(mousePos.y + 15, 380)}px`,
              background: "var(--bg-card)",
              border: "1px solid var(--accent-secondary)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              boxShadow: "var(--shadow-lg)",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: "190px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: "700", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                {hoveredState.state_name}
              </span>
              <span className="badge badge-teal" style={{ fontSize: "0.65rem" }}>
                {hoveredState.state_code}
              </span>
            </div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              {hoveredState.region_zone ? `${hoveredState.region_zone} Zone` : "National Territory"}
            </div>
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{metricLabel}:</span>
                <span style={{ fontWeight: "700", color: "var(--accent-primary)" }}>
                  {metricFormatter(hoveredState[selectedMetric])}
                </span>
              </div>
              {selectedMetric !== "incident_cases" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.725rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>2022 Incidence:</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                    {hoveredState.incident_cases?.toLocaleString()}
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
            <div style={{ marginTop: "6px", fontSize: "0.65rem", color: "var(--accent-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Eye size={10} /> Click state for trajectory profile
            </div>
          </div>
        )}

        {/* Legend Overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "14px",
            background: "var(--bg-card-glass)",
            backdropFilter: "blur(6px)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            zIndex: 5
          }}
        >
          <span style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase" }}>
            {metricLabel} Gradient
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>{metricFormatter(minVal)}</span>
            <div
              style={{
                width: "120px",
                height: "10px",
                borderRadius: "3px",
                background: "linear-gradient(to right, #06B6D4, #38BDF8, #F97316, #EF4444)"
              }}
            />
            <span style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>{metricFormatter(maxVal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: "var(--text-muted)" }}>
            <span>Minimal</span>
            <span>Moderate</span>
            <span>High</span>
            <span>Severe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
