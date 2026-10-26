import React, { useState } from "react";
import { TrendingUp, Calendar, AlertCircle } from "lucide-react";

/**
 * TrajectoryLineChart
 * Multi-line SVG chart for cancer incidence progression (2019–2045)
 * Distinguishes solid (historical/extrapolated 2019-2022) vs dashed (projected 2026-2045).
 */
export default function TrajectoryLineChart({
  nationalData = [],
  stateData = null,
  stateName = "",
  title = "Cancer Incidence Trajectory & Forecast (2019–2045)",
  height = 360
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Combine and sort national progression points: 2019, 2020, 2021, 2022, 2026, 2045
  // If nationalData is empty, use conformed national totals:
  const defaultNational = [
    { year: 2019, cases: 1358415, epoch: "Extrapolated" },
    { year: 2020, cases: 1392179, epoch: "Extrapolated" },
    { year: 2021, cases: 1426747, epoch: "Extrapolated" },
    { year: 2022, cases: 1461427, epoch: "Extrapolated" },
    { year: 2026, cases: 1569793, epoch: "Projected" },
    { year: 2045, cases: 2080000, epoch: "Projected" }
  ];

  const seriesNational = (nationalData && nationalData.length > 0) ? nationalData : defaultNational;

  // State series if provided (e.g. from state projections)
  const seriesState = stateData || null;

  // Chart bounds & scales
  const margin = { top: 30, right: 40, bottom: 45, left: 70 };
  const width = 760;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // X scale mapping: years 2019 to 2045 non-linear or index-spaced for clean spacing
  const years = [2019, 2020, 2021, 2022, 2026, 2045];
  const getX = (yr) => {
    const idx = years.indexOf(yr);
    if (idx !== -1) {
      return margin.left + (idx / (years.length - 1)) * innerWidth;
    }
    // Interpolate if outside discrete list
    return margin.left + ((yr - 2019) / (2045 - 2019)) * innerWidth;
  };

  // Y scale mapping
  // If state is selected, determine whether to scale to national or state
  const isComparing = Boolean(seriesState && seriesState.length > 0);
  
  let maxVal = Math.max(...seriesNational.map((d) => d.cases || 0));
  let minVal = Math.min(...seriesNational.map((d) => d.cases || 0));
  
  if (isComparing) {
    const stateMax = Math.max(...seriesState.map((d) => d.cases || 0));
    // When state is small compared to national, we use dual axis or normalize
    // We can show state on a secondary scale or primary if only state is focused
  }

  // Add 15% headroom
  const yDomainMax = maxVal * 1.12;
  const yDomainMin = Math.max(0, minVal * 0.85);

  const getY = (val) => {
    return margin.top + innerHeight - ((val - yDomainMin) / (yDomainMax - yDomainMin || 1)) * innerHeight;
  };

  // Separate national into two segments:
  // Solid (2019-2022) and Dashed (2022-2045)
  const solidPoints = seriesNational.filter((d) => d.year <= 2022);
  const dashedPoints = seriesNational.filter((d) => d.year >= 2022);

  const buildPath = (pts) => {
    return pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(p.year)} ${getY(p.cases)}`)
      .join(" ");
  };

  const pathSolid = buildPath(solidPoints);
  const pathDashed = buildPath(dashedPoints);

  // Area under solid curve for subtle glow
  const areaSolid = solidPoints.length > 0 ? (
    `${buildPath(solidPoints)} L ${getX(solidPoints[solidPoints.length - 1].year)} ${margin.top + innerHeight} L ${getX(solidPoints[0].year)} ${margin.top + innerHeight} Z`
  ) : "";

  // Y-axis grid ticks (4 ticks)
  const yTicks = [
    yDomainMin,
    yDomainMin + (yDomainMax - yDomainMin) * 0.33,
    yDomainMin + (yDomainMax - yDomainMin) * 0.66,
    yDomainMax
  ];

  const formatCases = (v) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(2)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return v;
  };

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <TrendingUp size={18} color="var(--accent-primary)" />
            {title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Longitudinal progression across NCRP Extrapolations (2019–2022) and Mathematical Model Forecasts (2026, 2045).
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px", alignItems: "center", fontSize: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "20px", height: "3px", background: "var(--accent-primary)" }} />
            <span style={{ color: "var(--text-primary)" }}>Extrapolated (Solid)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "20px", height: "3px", borderTop: "3px dashed var(--accent-secondary)" }} />
            <span style={{ color: "var(--text-primary)" }}>Projected (Dashed)</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", minWidth: "580px", display: "block" }}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
            </linearGradient>
            <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines & Y Axis Ticks */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                <text
                  x={margin.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--text-muted)"
                  fontSize="11"
                  fontFamily="sans-serif"
                >
                  {formatCases(val)}
                </text>
              </g>
            );
          })}

          {/* Vertical Grid Lines & X Axis Ticks */}
          {years.map((yr, idx) => {
            const x = getX(yr);
            const isProjected = yr > 2022;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + innerHeight}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
                <text
                  x={x}
                  y={margin.top + innerHeight + 18}
                  textAnchor="middle"
                  fill={isProjected ? "var(--accent-secondary)" : "var(--text-secondary)"}
                  fontSize="12"
                  fontWeight={yr === 2022 ? "700" : "500"}
                  fontFamily="sans-serif"
                >
                  {yr}
                </text>
                <text
                  x={x}
                  y={margin.top + innerHeight + 32}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="9"
                >
                  {isProjected ? "Forecast" : "Observed"}
                </text>
              </g>
            );
          })}

          {/* Area Fill for solid portion */}
          {areaSolid && <path d={areaSolid} fill="url(#areaGrad)" />}

          {/* Boundary Divider between Extrapolated and Projected */}
          <line
            x1={getX(2022)}
            y1={margin.top}
            x2={getX(2022)}
            y2={margin.top + innerHeight}
            stroke="var(--accent-warning)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={getX(2022) + 6}
            y={margin.top + 12}
            fill="var(--accent-warning)"
            fontSize="10"
            fontWeight="600"
          >
            Horizon Shift
          </text>

          {/* Solid Curve (2019-2022) */}
          <path
            d={pathSolid}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Dashed Curve (2022-2045) */}
          <path
            d={pathDashed}
            fill="none"
            stroke="var(--accent-secondary)"
            strokeWidth="3.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {seriesNational.map((pt, idx) => {
            const cx = getX(pt.year);
            const cy = getY(pt.cases);
            const isProjected = pt.year > 2022;
            const isHovered = hoveredPoint && hoveredPoint.year === pt.year;

            return (
              <g
                key={idx}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : 5}
                  fill={isProjected ? "var(--accent-secondary)" : "var(--accent-primary)"}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 3 : 2}
                  filter={isHovered ? "url(#pointGlow)" : "none"}
                  style={{ transition: "all 0.15s ease" }}
                />
                {/* Static label on anchor years */}
                {(pt.year === 2019 || pt.year === 2022 || pt.year === 2045) && (
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="11"
                    fontWeight="700"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                  >
                    {formatCases(pt.cases)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              left: `${getX(hoveredPoint.year) - 80}px`,
              top: `${getY(hoveredPoint.cases) - 95}px`,
              background: "var(--bg-card)",
              border: `1px solid ${hoveredPoint.year > 2022 ? "var(--accent-secondary)" : "var(--accent-primary)"}`,
              borderRadius: "var(--radius-md)",
              padding: "8px 12px",
              boxShadow: "var(--shadow-md)",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: "160px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                Year {hoveredPoint.year}
              </span>
              <span
                className={`badge ${hoveredPoint.year > 2022 ? "badge-teal" : "badge-orange"}`}
                style={{ fontSize: "0.65rem" }}
              >
                {hoveredPoint.epoch}
              </span>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {hoveredPoint.cases?.toLocaleString()} <span style={{ fontSize: "0.75rem", fontWeight: "400", color: "var(--text-secondary)" }}>cases</span>
            </div>
            <div style={{ fontSize: "0.675rem", color: "var(--text-muted)", marginTop: "3px" }}>
              {hoveredPoint.year <= 2022 ? "NCRP / MoHFW Extrapolation" : "ICMR Poisson Growth Model"}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        <AlertCircle size={15} color="var(--accent-warning)" />
        <span>
          <strong>Methodological Note:</strong> Values for 2019–2022 represent NCRP retrospective extrapolations ($R^2 = 1.0$ against empirical registry growth). Values for 2026 and 2045 are exponential Poisson projections reflecting demographic aging.
        </span>
      </div>
    </div>
  );
}
