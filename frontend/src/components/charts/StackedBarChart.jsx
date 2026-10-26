import React, { useState } from "react";
import { Activity, ShieldAlert } from "lucide-react";

/**
 * StackedBarChart
 * 100% Normalized Horizontal Stacked Bar Chart for Clinical Presentation Staging
 * (Localized Stage I, Locoregional Stage II/III, Distant Metastasis Stage IV, Unknown)
 */
export default function StackedBarChart({
  stageData = [],
  title = "Clinical Presentation Staging Distribution (NCRP HBCR Surveillance)",
  subtitle = "Proportion of patients presenting at early vs advanced metastatic disease stages across 11 key anatomical sites."
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Fallback data if empty
  const defaultStages = [
    { cancer_site: "Breast", localized_pct: 29.0, locoregional_pct: 57.0, distant_metastasis_pct: 10.3, unknown_extent_pct: 3.7, advanced_stage_pct: 67.3 },
    { cancer_site: "Cervix uteri", localized_pct: 32.8, locoregional_pct: 60.0, distant_metastasis_pct: 5.1, unknown_extent_pct: 2.2, advanced_stage_pct: 65.1 },
    { cancer_site: "Head & neck", localized_pct: 25.2, locoregional_pct: 66.6, distant_metastasis_pct: 4.8, unknown_extent_pct: 3.4, advanced_stage_pct: 71.4 },
    { cancer_site: "Stomach", localized_pct: 18.7, locoregional_pct: 50.8, distant_metastasis_pct: 24.7, unknown_extent_pct: 5.8, advanced_stage_pct: 75.5 },
    { cancer_site: "Lung", localized_pct: 13.9, locoregional_pct: 37.0, distant_metastasis_pct: 44.0, unknown_extent_pct: 5.1, advanced_stage_pct: 81.0 },
    { cancer_site: "Gallbladder", localized_pct: 14.2, locoregional_pct: 41.3, distant_metastasis_pct: 38.5, unknown_extent_pct: 6.0, advanced_stage_pct: 79.8 }
  ];

  const data = stageData && stageData.length > 0 ? stageData : defaultStages;

  // Dimensions
  const width = 760;
  const barHeight = 20;
  const barGap = 12;
  const marginTop = 30;
  const marginBottom = 40;
  const marginLeft = 150;
  const marginRight = 80;
  const innerWidth = width - marginLeft - marginRight;
  const height = marginTop + data.length * (barHeight + barGap) + marginBottom;

  const stageColors = {
    localized: "#10B981",    // Green (Stage I)
    locoregional: "#0284C7", // Sky Blue (Stage II / III)
    distant: "#EF4444",      // Red (Stage IV)
    unknown: "#64748B"       // Slate Gray (Unknown)
  };

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Activity size={18} color="var(--accent-teal)" />
            {title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: stageColors.localized }} />
            <span style={{ color: "var(--text-primary)" }}>Localized (I)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: stageColors.locoregional }} />
            <span style={{ color: "var(--text-primary)" }}>Locoregional (II/III)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: stageColors.distant }} />
            <span style={{ color: "var(--text-primary)" }}>Distant Metastasis (IV)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: stageColors.unknown }} />
            <span style={{ color: "var(--text-primary)" }}>Unknown Extent</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", minWidth: "580px", display: "block" }}
        >
          {/* Vertical Grid Lines (0%, 25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((pct, idx) => {
            const x = marginLeft + (pct / 100) * innerWidth;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={marginTop - 8}
                  x2={x}
                  y2={height - marginBottom}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
                <text
                  x={x}
                  y={height - marginBottom + 16}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Stacked Bars */}
          {data.map((row, idx) => {
            const y = marginTop + idx * (barHeight + barGap);

            const wLoc = (row.localized_pct / 100) * innerWidth;
            const wReg = (row.locoregional_pct / 100) * innerWidth;
            const wDist = (row.distant_metastasis_pct / 100) * innerWidth;
            const wUnk = (row.unknown_extent_pct / 100) * innerWidth;

            const x0 = marginLeft;
            const x1 = x0 + wLoc;
            const x2 = x1 + wReg;
            const x3 = x2 + wDist;

            return (
              <g key={idx}>
                {/* Site Name Label */}
                <text
                  x={marginLeft - 12}
                  y={y + barHeight / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {row.cancer_site}
                </text>

                {/* Localized Segment */}
                <rect
                  x={x0}
                  y={y}
                  width={Math.max(0, wLoc)}
                  height={barHeight}
                  fill={stageColors.localized}
                  style={{ cursor: "pointer", opacity: hoveredSegment && hoveredSegment.site === row.cancer_site && hoveredSegment.stage !== "Localized" ? 0.6 : 1 }}
                  onMouseEnter={() => setHoveredSegment({ site: row.cancer_site, stage: "Localized (Stage I)", pct: row.localized_pct, note: "Early detection favorable" })}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Locoregional Segment */}
                <rect
                  x={x1}
                  y={y}
                  width={Math.max(0, wReg)}
                  height={barHeight}
                  fill={stageColors.locoregional}
                  style={{ cursor: "pointer", opacity: hoveredSegment && hoveredSegment.site === row.cancer_site && hoveredSegment.stage !== "Locoregional" ? 0.6 : 1 }}
                  onMouseEnter={() => setHoveredSegment({ site: row.cancer_site, stage: "Locoregional (Stage II/III)", pct: row.locoregional_pct, note: "Regional node involvement" })}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Distant Metastasis Segment */}
                <rect
                  x={x2}
                  y={y}
                  width={Math.max(0, wDist)}
                  height={barHeight}
                  fill={stageColors.distant}
                  style={{ cursor: "pointer", opacity: hoveredSegment && hoveredSegment.site === row.cancer_site && hoveredSegment.stage !== "Distant Metastasis" ? 0.6 : 1 }}
                  onMouseEnter={() => setHoveredSegment({ site: row.cancer_site, stage: "Distant Metastasis (Stage IV)", pct: row.distant_metastasis_pct, note: "Late-stage advanced presentation" })}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Unknown Segment */}
                <rect
                  x={x3}
                  y={y}
                  width={Math.max(0, wUnk)}
                  height={barHeight}
                  fill={stageColors.unknown}
                  style={{ cursor: "pointer", opacity: hoveredSegment && hoveredSegment.site === row.cancer_site && hoveredSegment.stage !== "Unknown" ? 0.6 : 1 }}
                  onMouseEnter={() => setHoveredSegment({ site: row.cancer_site, stage: "Unknown Extent", pct: row.unknown_extent_pct, note: "Incomplete staging documentation" })}
                  onMouseLeave={() => setHoveredSegment(null)}
                />

                {/* Advanced Stage Sum Badge on Right */}
                <text
                  x={marginLeft + innerWidth + 10}
                  y={y + barHeight / 2}
                  dominantBaseline="central"
                  fill="var(--accent-danger)"
                  fontSize="10"
                  fontWeight="700"
                >
                  {row.advanced_stage_pct ? `${row.advanced_stage_pct.toFixed(1)}% Adv` : ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredSegment && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--accent-secondary)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              boxShadow: "var(--shadow-md)",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: "200px"
            }}
          >
            <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
              {hoveredSegment.site}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{hoveredSegment.stage}:</span>
              <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "var(--accent-primary)" }}>
                {hoveredSegment.pct?.toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {hoveredSegment.note}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
