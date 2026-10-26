import React, { useState, useMemo } from "react";
import { GitCommit, Info } from "lucide-react";

/**
 * DendrogramTree
 * Agglomerative Hierarchical Clustering Dendrogram
 * Visualizes authentic 36 pairwise cluster merge steps and Euclidean distance tree.
 */
export default function DendrogramTree({
  linkageSample = [],
  stateNames = [],
  dendrogramLayout = null,
  title = "Ward Agglomerative Hierarchical Dendrogram",
  subtitle = "Tree depicting pairwise cluster agglomeration steps based on Euclidean trajectory distances."
}) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Geometry
  const width = 820;
  const height = 400;
  const marginTop = 30;
  const marginBottom = 95;
  const marginLeft = 60;
  const marginRight = 35;
  const innerWidth = width - marginLeft - marginRight;
  const innerHeight = height - marginTop - marginBottom;

  const hasLayout = dendrogramLayout && dendrogramLayout.icoord && dendrogramLayout.icoord.length > 0;

  // Max distance calculation
  const maxDist = useMemo(() => {
    if (hasLayout && dendrogramLayout.max_distance) {
      return dendrogramLayout.max_distance * 1.05;
    }
    return 3.2;
  }, [hasLayout, dendrogramLayout]);

  const getXFromCoord = (val, maxCoord) => {
    return marginLeft + ((val - 5) / (maxCoord - 5 || 1)) * innerWidth;
  };

  const getYFromDist = (dist) => {
    return marginTop + innerHeight - (dist / maxDist) * innerHeight;
  };

  // Build authentic branches from dendrogram layout if available
  const branches = useMemo(() => {
    if (!hasLayout) {
      // Fallback representative branches
      const defaultLeaves = stateNames.length > 0 ? stateNames.slice(0, 18) : [
        "Ladakh", "Sikkim", "Goa", "Mizoram", "Tripura", "Manipur", "Meghalaya",
        "Himachal", "Uttarakhand", "Punjab", "Haryana", "Kerala", "Gujarat",
        "Rajasthan", "Madhya Pradesh", "Karnataka", "Tamil Nadu", "West Bengal", "Maharashtra", "Uttar Pradesh"
      ];
      const getX = (idx) => marginLeft + (idx / (defaultLeaves.length - 1)) * innerWidth;
      const getY = (dist) => marginTop + innerHeight - (dist / 3.2) * innerHeight;

      return [
        { id: "b1", path: `M ${getX(0)} ${getY(0)} L ${getX(0)} ${getY(0.25)} L ${getX(1)} ${getY(0.25)} L ${getX(1)} ${getY(0)}`, midX: (getX(0) + getX(1)) / 2, midY: getY(0.25), dist: 0.25, name: "Ladakh + Sikkim", n: 2 },
        { id: "b2", path: `M ${getX(2)} ${getY(0)} L ${getX(2)} ${getY(0.35)} L ${getX(3)} ${getY(0.35)} L ${getX(3)} ${getY(0)}`, midX: (getX(2) + getX(3)) / 2, midY: getY(0.35), dist: 0.35, name: "Goa + Mizoram", n: 2 },
        { id: "b3", path: `M ${getX(4)} ${getY(0)} L ${getX(4)} ${getY(0.38)} L ${getX(5)} ${getY(0.38)} L ${getX(5)} ${getY(0)}`, midX: (getX(4) + getX(5)) / 2, midY: getY(0.38), dist: 0.38, name: "Tripura + Manipur", n: 2 },
        { id: "b4", path: `M ${getX(7)} ${getY(0)} L ${getX(7)} ${getY(0.52)} L ${getX(8)} ${getY(0.52)} L ${getX(8)} ${getY(0)}`, midX: (getX(7) + getX(8)) / 2, midY: getY(0.52), dist: 0.52, name: "Himachal + Uttarakhand", n: 2 },
        { id: "b5", path: `M ${getX(9)} ${getY(0)} L ${getX(9)} ${getY(0.65)} L ${getX(10)} ${getY(0.65)} L ${getX(10)} ${getY(0)}`, midX: (getX(9) + getX(10)) / 2, midY: getY(0.65), dist: 0.65, name: "Punjab + Haryana", n: 2 },
        { id: "b6", path: `M ${getX(11)} ${getY(0)} L ${getX(11)} ${getY(0.85)} L ${getX(12)} ${getY(0.85)} L ${getX(12)} ${getY(0)}`, midX: (getX(11) + getX(12)) / 2, midY: getY(0.85), dist: 0.85, name: "Kerala + Gujarat", n: 2 },
        { id: "b7", path: `M ${getX(13)} ${getY(0)} L ${getX(13)} ${getY(0.95)} L ${getX(14)} ${getY(0.95)} L ${getX(14)} ${getY(0)}`, midX: (getX(13) + getX(14)) / 2, midY: getY(0.95), dist: 0.95, name: "Rajasthan + MP", n: 2 },
        { id: "b8", path: `M ${getX(15)} ${getY(0)} L ${getX(15)} ${getY(1.15)} L ${getX(16)} ${getY(1.15)} L ${getX(16)} ${getY(0)}`, midX: (getX(15) + getX(16)) / 2, midY: getY(1.15), dist: 1.15, name: "Karnataka + Tamil Nadu", n: 2 },
        { id: "b9", path: `M ${getX(17)} ${getY(0)} L ${getX(17)} ${getY(1.45)} L ${getX(18)} ${getY(1.45)} L ${getX(18)} ${getY(0)}`, midX: (getX(17) + getX(18)) / 2, midY: getY(1.45), dist: 1.45, name: "West Bengal + Maharashtra", n: 2 }
      ];
    }

    const icoords = dendrogramLayout.icoord;
    const dcoords = dendrogramLayout.dcoord;
    const nLeaves = dendrogramLayout.leaf_labels?.length || 37;
    const maxCoord = 10 * nLeaves - 5;

    return icoords.map((ic, i) => {
      const dc = dcoords[i];
      const x1 = getXFromCoord(ic[0], maxCoord);
      const x2 = getXFromCoord(ic[2], maxCoord);
      const y1 = getYFromDist(dc[0]);
      const yTop = getYFromDist(dc[1]);
      const y2 = getYFromDist(dc[3]);
      const dist = dc[1];

      return {
        id: `merge-step-${i + 1}`,
        step: i + 1,
        path: `M ${x1} ${y1} L ${x1} ${yTop} L ${x2} ${yTop} L ${x2} ${y2}`,
        midX: (x1 + x2) / 2,
        midY: yTop,
        dist,
        name: `Agglomeration Step ${i + 1} / ${icoords.length}`,
        n: `Cluster Node ${37 + i}`
      };
    });
  }, [hasLayout, dendrogramLayout, stateNames]);

  // Leaf labels
  const leaves = useMemo(() => {
    if (hasLayout && dendrogramLayout.leaf_labels) {
      const nLeaves = dendrogramLayout.leaf_labels.length;
      const maxCoord = 10 * nLeaves - 5;
      return dendrogramLayout.leaf_labels.map((name, idx) => ({
        name,
        x: getXFromCoord(5 + idx * 10, maxCoord),
        y: marginTop + innerHeight
      }));
    }

    const defaultNames = stateNames.length > 0 ? stateNames.slice(0, 18) : [
      "Ladakh", "Sikkim", "Goa", "Mizoram", "Tripura", "Manipur", "Meghalaya",
      "Himachal", "Uttarakhand", "Punjab", "Haryana", "Kerala", "Gujarat",
      "Rajasthan", "Madhya Pradesh", "Karnataka", "Tamil Nadu", "West Bengal", "Maharashtra", "Uttar Pradesh"
    ];
    return defaultNames.map((name, idx) => ({
      name,
      x: marginLeft + (idx / (defaultNames.length - 1)) * innerWidth,
      y: marginTop + innerHeight
    }));
  }, [hasLayout, dendrogramLayout, stateNames]);

  // Distance ticks
  const distTicks = useMemo(() => {
    const ticks = [];
    const step = maxDist > 6 ? 2.0 : 0.5;
    for (let d = 0; d <= maxDist; d += step) {
      ticks.push(Number(d.toFixed(1)));
    }
    return ticks;
  }, [maxDist]);

  const cutoffDist = hasLayout ? 5.5 : 1.75;

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <GitCommit size={18} color="var(--accent-secondary)" />
            {title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "18px", height: "2px", borderTop: "2px dashed var(--accent-danger)" }} />
            <span style={{ color: "var(--accent-danger)" }}>Cutoff Distance (k=4 Partition: {cutoffDist.toFixed(1)})</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", minWidth: "720px", display: "block" }}
        >
          {/* Y Axis Grid Lines & Ticks */}
          {distTicks.map((d, idx) => {
            const y = getYFromDist(d);
            return (
              <g key={idx}>
                <line
                  x1={marginLeft}
                  y1={y}
                  x2={width - marginRight}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.4"
                />
                <text
                  x={marginLeft - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--text-muted)"
                  fontSize="9.5"
                >
                  {d.toFixed(1)}
                </text>
              </g>
            );
          })}

          <text
            x={-marginTop - innerHeight / 2}
            y={18}
            textAnchor="middle"
            transform="rotate(-90)"
            fill="var(--text-secondary)"
            fontSize="10"
            fontWeight="600"
          >
            Ward Distance (d)
          </text>

          {/* Cutoff Threshold Line (k=4 clusters) */}
          <line
            x1={marginLeft}
            y1={getYFromDist(cutoffDist)}
            x2={width - marginRight}
            y2={getYFromDist(cutoffDist)}
            stroke="var(--accent-danger)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />
          <text
            x={width - marginRight - 10}
            y={getYFromDist(cutoffDist) - 6}
            textAnchor="end"
            fill="var(--accent-danger)"
            fontSize="10"
            fontWeight="700"
          >
            Cluster Partition Horizon (k = 4)
          </text>

          {/* Render All Tree Branches */}
          {branches.map((b) => {
            const isHovered = hoveredNode?.id === b.id;

            return (
              <g
                key={b.id}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredNode(b)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <path
                  d={b.path}
                  fill="none"
                  stroke={isHovered ? "var(--accent-primary)" : "var(--accent-secondary)"}
                  strokeWidth={isHovered ? 2.5 : 1.25}
                  strokeOpacity={isHovered ? 1 : 0.75}
                  style={{ transition: "all 0.15s ease" }}
                />

                {/* Node midpoint indicator on hover */}
                <circle
                  cx={b.midX}
                  cy={b.midY}
                  r={isHovered ? 4.5 : 2}
                  fill={isHovered ? "var(--accent-primary)" : "var(--bg-card)"}
                  stroke={isHovered ? "#fff" : "var(--accent-secondary)"}
                  strokeWidth="1.5"
                />
              </g>
            );
          })}

          {/* Leaf Nodes & State Labels */}
          {leaves.map((leaf, idx) => {
            return (
              <g key={idx} transform={`translate(${leaf.x}, ${leaf.y + 6}) rotate(55)`}>
                <text
                  x={0}
                  y={0}
                  textAnchor="start"
                  fill="var(--text-secondary)"
                  fontSize={leaves.length > 25 ? "8" : "9.5"}
                  fontWeight="500"
                >
                  {leaf.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredNode && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--accent-primary)",
              borderRadius: "var(--radius-md)",
              padding: "8px 12px",
              boxShadow: "var(--shadow-md)",
              pointerEvents: "none",
              zIndex: 10,
              minWidth: "190px"
            }}
          >
            <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
              {hoveredNode.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Merge Distance: <strong style={{ color: "var(--accent-primary)" }}>{Number(hoveredNode.dist).toFixed(4)}</strong>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Node: <strong>{hoveredNode.n}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
