import React, { useState, useMemo } from "react";
import { BarChart2, Users } from "lucide-react";

/**
 * GroupedBarChart
 * Dual horizontal bar chart for Male vs Female cancer burden comparison (Top sites)
 * Allows toggling between Total Incident Cases and Age-Adjusted Rate (AAR per 100k).
 */
export default function GroupedBarChart({
  burdenData = [],
  title = "Sex-Stratified Cancer Burden (Male vs Female)",
  defaultMetric = "cases"
}) {
  const [metric, setMetric] = useState(defaultMetric); // 'cases' | 'aar'
  const [hoveredBar, setHoveredBar] = useState(null);

  // Group burden data into top sites
  const processedData = useMemo(() => {
    if (!burdenData || burdenData.length === 0) return [];

    // Check if already grouped
    if (burdenData[0]?.male_cases !== undefined) {
      return burdenData.slice(0, 10);
    }

    // Group from raw list of { site_name, gender, incident_cases, age_adjusted_rate }
    const siteMap = {};
    burdenData.forEach((row) => {
      const site = row.site_name;
      if (!site || site === "All sites") return;

      if (!siteMap[site]) {
        siteMap[site] = {
          site_name: site,
          male_cases: 0,
          female_cases: 0,
          male_aar: 0,
          female_aar: 0
        };
      }

      if (row.gender === "Male") {
        siteMap[site].male_cases = row.incident_cases || 0;
        siteMap[site].male_aar = row.age_adjusted_rate || 0;
      } else if (row.gender === "Female") {
        siteMap[site].female_cases = row.incident_cases || 0;
        siteMap[site].female_aar = row.age_adjusted_rate || 0;
      }
    });

    return Object.values(siteMap)
      .sort((a, b) => {
        if (metric === "aar") {
          return Math.max(b.male_aar, b.female_aar) - Math.max(a.male_aar, a.female_aar);
        }
        return (b.male_cases + b.female_cases) - (a.male_cases + a.female_cases);
      })
      .slice(0, 10);
  }, [burdenData, metric]);

  const maxVal = useMemo(() => {
    let max = 0;
    processedData.forEach((d) => {
      const mVal = metric === "cases" ? d.male_cases : d.male_aar;
      const fVal = metric === "cases" ? d.female_cases : d.female_aar;
      if (mVal > max) max = mVal;
      if (fVal > max) max = fVal;
    });
    return max * 1.15 || 100;
  }, [processedData, metric]);

  // Dimensions
  const width = 760;
  const barHeight = 14;
  const groupGap = 16;
  const groupHeight = barHeight * 2 + 4;
  const marginTop = 30;
  const marginBottom = 40;
  const marginLeft = 180;
  const marginRight = 50;
  const innerWidth = width - marginLeft - marginRight;
  const height = marginTop + processedData.length * (groupHeight + groupGap) + marginBottom;

  const getWidth = (val) => {
    return Math.max(2, (val / maxVal) * innerWidth);
  };

  const formatValue = (v) => {
    if (metric === "cases") {
      return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString();
    }
    return `${v.toFixed(1)} /100k`;
  };

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Users size={18} color="var(--accent-secondary)" />
            {title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Comparative epidemiological intensity across leading anatomical sites.
          </p>
        </div>

        {/* Metric Selector & Legend */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#3B82F6" }} />
              <span style={{ color: "var(--text-primary)" }}>Male</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#EC4899" }} />
              <span style={{ color: "var(--text-primary)" }}>Female</span>
            </div>
          </div>

          {/* Toggle */}
          <div style={{ display: "inline-flex", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: "2px", border: "1px solid var(--border-color)" }}>
            <button
              onClick={() => setMetric("cases")}
              style={{
                background: metric === "cases" ? "var(--accent-primary)" : "transparent",
                color: metric === "cases" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              Incident Cases
            </button>
            <button
              onClick={() => setMetric("aar")}
              style={{
                background: metric === "aar" ? "var(--accent-primary)" : "transparent",
                color: metric === "aar" ? "#fff" : "var(--text-secondary)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              AAR (Rate per 100k)
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", minWidth: "580px", display: "block" }}
        >
          {/* Vertical Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const x = marginLeft + pct * innerWidth;
            const val = pct * maxVal;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={marginTop - 10}
                  x2={x}
                  y2={height - marginBottom}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
                <text
                  x={x}
                  y={height - marginBottom + 18}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {formatValue(val)}
                </text>
              </g>
            );
          })}

          {/* Grouped Horizontal Bars */}
          {processedData.map((item, idx) => {
            const yGroup = marginTop + idx * (groupHeight + groupGap);
            const mVal = metric === "cases" ? item.male_cases : item.male_aar;
            const fVal = metric === "cases" ? item.female_cases : item.female_aar;
            const mWidth = getWidth(mVal);
            const fWidth = getWidth(fVal);

            return (
              <g key={idx}>
                {/* Site Label */}
                <text
                  x={marginLeft - 12}
                  y={yGroup + groupHeight / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {item.site_name.length > 24 ? `${item.site_name.substring(0, 22)}...` : item.site_name}
                </text>

                {/* Male Bar (Top) */}
                <rect
                  x={marginLeft}
                  y={yGroup}
                  width={mWidth}
                  height={barHeight}
                  fill="#3B82F6"
                  rx="3"
                  style={{
                    cursor: "pointer",
                    transition: "width 0.3s ease",
                    opacity: hoveredBar && (hoveredBar.site !== item.site_name || hoveredBar.gender !== "Male") ? 0.6 : 1
                  }}
                  onMouseEnter={() => setHoveredBar({ site: item.site_name, gender: "Male", value: mVal, aar: item.male_aar, cases: item.male_cases })}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                {mVal > 0 && (
                  <text
                    x={marginLeft + mWidth + 6}
                    y={yGroup + barHeight / 2}
                    dominantBaseline="central"
                    fill="var(--text-secondary)"
                    fontSize="9.5"
                    fontWeight="500"
                  >
                    {formatValue(mVal)}
                  </text>
                )}

                {/* Female Bar (Bottom) */}
                <rect
                  x={marginLeft}
                  y={yGroup + barHeight + 4}
                  width={fWidth}
                  height={barHeight}
                  fill="#EC4899"
                  rx="3"
                  style={{
                    cursor: "pointer",
                    transition: "width 0.3s ease",
                    opacity: hoveredBar && (hoveredBar.site !== item.site_name || hoveredBar.gender !== "Female") ? 0.6 : 1
                  }}
                  onMouseEnter={() => setHoveredBar({ site: item.site_name, gender: "Female", value: fVal, aar: item.female_aar, cases: item.female_cases })}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                {fVal > 0 && (
                  <text
                    x={marginLeft + fWidth + 6}
                    y={yGroup + barHeight + 4 + barHeight / 2}
                    dominantBaseline="central"
                    fill="var(--text-secondary)"
                    fontSize="9.5"
                    fontWeight="500"
                  >
                    {formatValue(fVal)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredBar && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "20px",
              background: "var(--bg-card)",
              border: `1px solid ${hoveredBar.gender === "Male" ? "#3B82F6" : "#EC4899"}`,
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              boxShadow: "var(--shadow-md)",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: "180px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                {hoveredBar.site}
              </span>
              <span
                className="badge"
                style={{
                  background: hoveredBar.gender === "Male" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)",
                  color: hoveredBar.gender === "Male" ? "#3B82F6" : "#EC4899",
                  fontSize: "0.65rem"
                }}
              >
                {hoveredBar.gender}
              </span>
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {hoveredBar.cases?.toLocaleString()} <span style={{ fontSize: "0.75rem", fontWeight: "400", color: "var(--text-secondary)" }}>cases</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", marginTop: "2px" }}>
              Age-Adjusted Rate: <strong>{hoveredBar.aar?.toFixed(1)}</strong> per 100k
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
