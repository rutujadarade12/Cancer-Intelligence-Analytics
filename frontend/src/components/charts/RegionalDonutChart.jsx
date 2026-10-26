import React, { useState } from "react";
import { PieChart } from "lucide-react";

/**
 * RegionalDonutChart
 * Interactive SVG Donut Chart for Regional Zonal Burden Distribution
 * Supports hover segment highlights and click-to-filter.
 */
export default function RegionalDonutChart({
  regions = [],
  selectedRegion = "",
  onSelectRegion = () => {},
  title = "Regional Burden Distribution (6 Zonal Councils)"
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Conformed palette for the 6 zones
  const zoneColors = {
    Central: "#F97316",    // Orange
    South: "#06B6D4",      // Cyan
    East: "#3B82F6",       // Blue
    West: "#10B981",       // Green
    North: "#8B5CF6",      // Purple
    "North East": "#EC4899" // Pink
  };

  const totalCases = regions.reduce((acc, r) => acc + (r.total_regional_cases || 0), 0);

  // SVG Geometry
  const size = 300;
  const center = size / 2;
  const radius = 110;
  const innerRadius = 70;

  // Build arc slices
  let accumulatedAngle = -Math.PI / 2; // Start from top (12 o'clock)
  const slices = regions.map((rg, idx) => {
    const fraction = totalCases > 0 ? (rg.total_regional_cases || 0) / totalCases : 1 / 6;
    const angle = fraction * 2 * Math.PI;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    const isHovered = hoveredIdx === idx;
    const isSelected = selectedRegion === rg.region_zone;
    const currentRadius = isHovered || isSelected ? radius + 8 : radius;

    // SVG path coordinates
    const x1 = center + currentRadius * Math.cos(startAngle);
    const y1 = center + currentRadius * Math.sin(startAngle);
    const x2 = center + currentRadius * Math.cos(endAngle);
    const y2 = center + currentRadius * Math.sin(endAngle);

    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${currentRadius} ${currentRadius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;

    return {
      region_zone: rg.region_zone,
      total_cases: rg.total_regional_cases,
      share_pct: rg.regional_share_pct || (fraction * 100).toFixed(1),
      state_count: rg.state_count,
      color: zoneColors[rg.region_zone] || "#64748B",
      pathData,
      isHovered,
      isSelected
    };
  });

  const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : (slices.find(s => s.isSelected) || null);

  return (
    <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="card-header">
        <h3 className="card-title">
          <PieChart size={18} color="var(--accent-secondary)" />
          {title}
        </h3>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {selectedRegion ? `Filtered: ${selectedRegion}` : "All 6 Zones"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "20px", flex: 1, padding: "10px 0" }}>
        {/* Donut SVG */}
        <div style={{ position: "relative", width: `${size}px`, height: `${size}px` }}>
          <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "100%" }}>
            <defs>
              <filter id="donutGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <g>
              {slices.map((slice, idx) => (
                <path
                  key={idx}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="var(--bg-card)"
                  strokeWidth="2.5"
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    filter: slice.isHovered || slice.isSelected ? "url(#donutGlow)" : "none"
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSelectRegion(selectedRegion === slice.region_zone ? "" : slice.region_zone)}
                />
              ))}
            </g>
          </svg>

          {/* Center Content */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none"
            }}
          >
            {activeItem ? (
              <>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: activeItem.color }}>
                  {activeItem.region_zone}
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  {activeItem.share_pct}%
                </div>
                <div style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>
                  {activeItem.total_cases?.toLocaleString()}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  National Total
                </div>
                <div style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)" }}>
                  1.46M
                </div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>
                  37 States / UTs
                </div>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "160px" }}>
          {slices.map((slice, idx) => (
            <div
              key={idx}
              onClick={() => onSelectRegion(selectedRegion === slice.region_zone ? "" : slice.region_zone)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                background: selectedRegion === slice.region_zone ? "var(--bg-card-hover)" : "transparent",
                border: selectedRegion === slice.region_zone ? `1px solid ${slice.color}` : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: slice.color }} />
                <span style={{ fontSize: "0.8rem", fontWeight: "500", color: "var(--text-primary)" }}>
                  {slice.region_zone}
                </span>
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: slice.color }}>
                {slice.share_pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
