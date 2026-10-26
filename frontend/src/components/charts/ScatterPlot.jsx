import React, { useState, useMemo } from "react";
import { CircleDot, ZoomIn } from "lucide-react";

/**
 * ScatterPlot
 * Highly configurable 2D Cartesian Scatter Plot with bubble sizing,
 * categorical / continuous color mapping, and interactive tooltips.
 */
export default function ScatterPlot({
  data = [],
  xKey = "x",
  yKey = "y",
  labelKey = "label",
  sizeKey = null,
  colorKey = null,
  colorMap = null,
  xLabel = "X Axis",
  yLabel = "Y Axis",
  xFormatter = (v) => v,
  yFormatter = (v) => v,
  title = "2D Scatter Analysis",
  subtitle = "",
  badgeText = "",
  height = 420
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute domains
  const { xMin, xMax, yMin, yMax, sizeMin, sizeMax } = useMemo(() => {
    let xm = Infinity, xM = -Infinity;
    let ym = Infinity, yM = -Infinity;
    let sm = Infinity, sM = -Infinity;

    data.forEach((d) => {
      const x = Number(d[xKey]);
      const y = Number(d[yKey]);
      if (!isNaN(x)) {
        if (x < xm) xm = x;
        if (x > xM) xM = x;
      }
      if (!isNaN(y)) {
        if (y < ym) ym = y;
        if (y > yM) yM = y;
      }
      if (sizeKey && d[sizeKey] != null) {
        const s = Number(d[sizeKey]);
        if (!isNaN(s)) {
          if (s < sm) sm = s;
          if (s > sM) sM = s;
        }
      }
    });

    if (xm === Infinity) { xm = 0; xM = 100; }
    if (ym === Infinity) { ym = 0; yM = 100; }
    if (sm === Infinity) { sm = 1; sM = 10; }

    // Headroom (8% on each side)
    const xPad = (xM - xm) * 0.08 || 1;
    const yPad = (yM - ym) * 0.08 || 1;

    return {
      xMin: Math.max(0, xm - xPad),
      xMax: xM + xPad,
      yMin: Math.max(0, ym - yPad),
      yMax: yM + yPad,
      sizeMin: sm,
      sizeMax: sM
    };
  }, [data, xKey, yKey, sizeKey]);

  // Dimensions
  const width = 760;
  const margin = { top: 30, right: 35, bottom: 50, left: 75 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const getX = (val) => {
    return margin.left + ((val - xMin) / (xMax - xMin || 1)) * innerWidth;
  };

  const getY = (val) => {
    return margin.top + innerHeight - ((val - yMin) / (yMax - yMin || 1)) * innerHeight;
  };

  const getRadius = (val) => {
    if (!sizeKey || val == null) return 6;
    const norm = Math.max(0, Math.min(1, (val - sizeMin) / (sizeMax - sizeMin || 1)));
    return 4 + norm * 12; // Radius between 4px and 16px
  };

  const getColor = (item) => {
    if (colorMap && colorKey && item[colorKey] !== undefined) {
      return colorMap[item[colorKey]] || "#06B6D4";
    }
    return "#F97316";
  };

  // Ticks
  const xTicks = [
    xMin,
    xMin + (xMax - xMin) * 0.25,
    xMin + (xMax - xMin) * 0.5,
    xMin + (xMax - xMin) * 0.75,
    xMax
  ];

  const yTicks = [
    yMin,
    yMin + (yMax - yMin) * 0.25,
    yMin + (yMax - yMin) * 0.5,
    yMin + (yMax - yMin) * 0.75,
    yMax
  ];

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <CircleDot size={18} color="var(--accent-primary)" />
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>

        {badgeText && (
          <span className="badge badge-orange" style={{ fontSize: "0.75rem" }}>
            {badgeText}
          </span>
        )}
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", minWidth: "580px", display: "block" }}
        >
          <defs>
            <filter id="scatterGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Lines & Ticks */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={`y-${idx}`}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
                <text
                  x={margin.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {yFormatter(val)}
                </text>
              </g>
            );
          })}

          {xTicks.map((val, idx) => {
            const x = getX(val);
            return (
              <g key={`x-${idx}`}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + innerHeight}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
                <text
                  x={x}
                  y={margin.top + innerHeight + 16}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {xFormatter(val)}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={margin.left + innerWidth / 2}
            y={height - 10}
            textAnchor="middle"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            {xLabel}
          </text>

          <text
            x={-margin.top - innerHeight / 2}
            y={18}
            textAnchor="middle"
            transform="rotate(-90)"
            fill="var(--text-secondary)"
            fontSize="11"
            fontWeight="600"
          >
            {yLabel}
          </text>

          {/* Scatter Data Points */}
          {data.map((item, idx) => {
            const x = getX(item[xKey]);
            const y = getY(item[yKey]);
            const r = getRadius(sizeKey ? item[sizeKey] : null);
            const color = getColor(item);
            const isHovered = hoveredPoint && hoveredPoint === item;

            return (
              <g
                key={idx}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredPoint(item)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? r + 3 : r}
                  fill={color}
                  fillOpacity="0.75"
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 2.5 : 1}
                  filter={isHovered ? "url(#scatterGlow)" : "none"}
                  style={{ transition: "all 0.15s ease" }}
                />
                {/* Optional point label if prominent */}
                {isHovered && (
                  <text
                    x={x}
                    y={y - r - 6}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight="700"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                  >
                    {item[labelKey]}
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
              left: `${Math.min(getX(hoveredPoint[xKey]) + 15, width - 220)}px`,
              top: `${Math.max(10, getY(hoveredPoint[yKey]) - 60)}px`,
              background: "var(--bg-card)",
              border: `1px solid ${getColor(hoveredPoint)}`,
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              boxShadow: "var(--shadow-md)",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: "180px"
            }}
          >
            <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
              {hoveredPoint[labelKey]}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>{xLabel}:</span>
              <strong style={{ color: "var(--text-primary)" }}>{xFormatter(hoveredPoint[xKey])}</strong>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>{yLabel}:</span>
              <strong style={{ color: "var(--text-primary)" }}>{yFormatter(hoveredPoint[yKey])}</strong>
            </div>
            {sizeKey && hoveredPoint[sizeKey] != null && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", gap: "8px" }}>
                <span>Scale:</span>
                <strong style={{ color: "var(--accent-primary)" }}>{Number(hoveredPoint[sizeKey]).toFixed(3)}</strong>
              </div>
            )}
            {colorKey && hoveredPoint[colorKey] !== undefined && (
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Group: <strong>{hoveredPoint.cluster_label || hoveredPoint[colorKey]}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
