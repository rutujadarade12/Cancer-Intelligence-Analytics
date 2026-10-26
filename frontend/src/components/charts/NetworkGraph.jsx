import React, { useState, useMemo } from "react";
import { GitFork, Info, Sparkles } from "lucide-react";

/**
 * NetworkGraph
 * Interactive Directed SVG Association Network Graph
 * Nodes = Discretized State Epidemiological Traits
 * Edges = Apriori Association Rules (thickness = Confidence, color = Lift)
 */
export default function NetworkGraph({
  rules = [],
  title = "Apriori Association Mining Directed Network",
  subtitle = "Directed relational topology connecting state epidemiological attributes with high statistical lift."
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);

  // Fallback sample rules if none passed
  const defaultRules = [
    { antecedent: ["NationalShare_Top5pct"], consequent: ["Cases_High", "ProjectedCAGR_High"], support: 0.1622, confidence: 0.6000, lift: 2.4667 },
    { antecedent: ["Cases_High", "ProjectedCAGR_High"], consequent: ["NationalShare_Top5pct"], support: 0.1622, confidence: 0.6667, lift: 2.4667 },
    { antecedent: ["ObservedCAGR_Low", "Cases_Low"], consequent: ["ProjectedCAGR_Low"], support: 0.1892, confidence: 1.0000, lift: 2.0556 },
    { antecedent: ["NationalShare_Top5pct"], consequent: ["ObservedCAGR_Low", "Cases_High"], support: 0.1622, confidence: 0.6000, lift: 2.0182 },
    { antecedent: ["NationalShare_Top5pct"], consequent: ["Cases_High"], support: 0.2703, confidence: 1.0000, lift: 1.9474 }
  ];

  const ruleList = rules && rules.length > 0 ? rules : defaultRules;

  // Extract unique item nodes
  const nodes = useMemo(() => {
    const itemSet = new Set();
    ruleList.forEach((r) => {
      (r.antecedent || []).forEach((item) => itemSet.add(item));
      (r.consequent || []).forEach((item) => itemSet.add(item));
    });
    return Array.from(itemSet);
  }, [ruleList]);

  // Canvas Geometry
  const width = 720;
  const height = 460;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 175;

  // Compute node coordinates on circle perimeter
  const nodePositions = useMemo(() => {
    const pos = {};
    const count = nodes.length || 1;
    nodes.forEach((node, i) => {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      pos[node] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angle
      };
    });
    return pos;
  }, [nodes, cx, cy, radius]);

  // Edges expansion: each rule can have multiple antecedent-consequent pairs
  const edges = useMemo(() => {
    const edgeList = [];
    ruleList.forEach((r, rIdx) => {
      const ants = r.antecedent || [];
      const cons = r.consequent || [];
      ants.forEach((source) => {
        cons.forEach((target) => {
          if (source !== target && nodePositions[source] && nodePositions[target]) {
            edgeList.push({
              id: `${source}->${target}-${rIdx}`,
              ruleIndex: rIdx,
              source,
              target,
              support: r.support,
              confidence: r.confidence,
              lift: r.lift,
              rule: r
            });
          }
        });
      });
    });
    return edgeList;
  }, [ruleList, nodePositions]);

  // Lift color scale
  const getLiftColor = (lift) => {
    // Lift range ~ 1.8 to 2.5
    if (lift >= 2.3) return "#EF4444"; // Red (High Lift)
    if (lift >= 2.0) return "#F97316"; // Orange
    if (lift >= 1.9) return "#F59E0B"; // Amber
    return "#06B6D4"; // Cyan
  };

  const getEdgeWidth = (conf) => {
    return Math.max(1.5, conf * 4.5);
  };

  const formatNodeLabel = (item) => {
    return item.replace(/_/g, " ");
  };

  const activeRule = hoveredEdge?.rule || selectedRule || (ruleList.length > 0 ? ruleList[0] : null);

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <GitFork size={18} color="var(--accent-primary)" />
            {title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "14px", alignItems: "center", fontSize: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "14px", height: "3px", background: "#EF4444" }} />
            <span style={{ color: "var(--text-primary)" }}>Lift &gt; 2.3</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "14px", height: "3px", background: "#F97316" }} />
            <span style={{ color: "var(--text-primary)" }}>Lift 2.0–2.3</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "14px", height: "3px", background: "#06B6D4" }} />
            <span style={{ color: "var(--text-primary)" }}>Lift &lt; 2.0</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px", alignItems: "start" }}>
        {/* SVG Network Canvas */}
        <div style={{ position: "relative", width: "100%", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <defs>
              <marker
                id="arrowhead-red"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
              </marker>
              <marker
                id="arrowhead-orange"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#F97316" />
              </marker>
              <marker
                id="arrowhead-cyan"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06B6D4" />
              </marker>
            </defs>

            {/* Directed Edges */}
            {edges.map((edge) => {
              const p1 = nodePositions[edge.source];
              const p2 = nodePositions[edge.target];
              if (!p1 || !p2) return null;

              const isHighlighted =
                hoveredEdge?.id === edge.id ||
                hoveredNode === edge.source ||
                hoveredNode === edge.target ||
                (selectedRule && selectedRule === edge.rule);

              const color = getLiftColor(edge.lift);
              const markerId = edge.lift >= 2.3 ? "arrowhead-red" : edge.lift >= 2.0 ? "arrowhead-orange" : "arrowhead-cyan";

              // Curved bezier arc through canvas center offset
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const midX = (p1.x + p2.x) / 2 + (dy * 0.15);
              const midY = (p1.y + p2.y) / 2 - (dx * 0.15);
              const pathD = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

              return (
                <path
                  key={edge.id}
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHighlighted ? getEdgeWidth(edge.confidence) + 2 : getEdgeWidth(edge.confidence)}
                  strokeOpacity={isHighlighted ? 0.95 : (hoveredNode || hoveredEdge ? 0.2 : 0.65)}
                  markerEnd={`url(#${markerId})`}
                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  onClick={() => setSelectedRule(edge.rule)}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions[node];
              if (!pos) return null;

              const isHovered = hoveredNode === node;
              const isConnected =
                hoveredEdge && (hoveredEdge.source === node || hoveredEdge.target === node);

              return (
                <g
                  key={node}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    r={isHovered || isConnected ? 16 : 13}
                    fill="var(--bg-card)"
                    stroke={isHovered ? "var(--accent-primary)" : "var(--accent-secondary)"}
                    strokeWidth={isHovered || isConnected ? 3 : 2}
                    style={{ transition: "all 0.15s ease" }}
                  />
                  <circle
                    r={5}
                    fill={node.includes("High") || node.includes("Top") ? "var(--accent-primary)" : "var(--accent-teal)"}
                  />

                  {/* Node Label positioned radially outward */}
                  <text
                    x={pos.x > cx ? 20 : -20}
                    y={pos.y > cy ? 12 : -8}
                    textAnchor={pos.x > cx ? "start" : "end"}
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight="600"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
                  >
                    {formatNodeLabel(node)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected / Hovered Rule Inspection Panel */}
        <div className="card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", color: "var(--accent-secondary)" }}>
            <Sparkles size={16} />
            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>Rule Inspection</span>
          </div>

          {activeRule ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Antecedent (Condition)
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "3px" }}>
                  {(activeRule.antecedent || []).map((ant, idx) => (
                    <span key={idx} className="badge badge-blue" style={{ fontSize: "0.7rem" }}>
                      {ant.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: "center", color: "var(--accent-secondary)", fontSize: "0.85rem", fontWeight: "700" }}>
                &darr; implies &darr;
              </div>

              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Consequent (Outcome)
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "3px" }}>
                  {(activeRule.consequent || []).map((con, idx) => (
                    <span key={idx} className="badge badge-orange" style={{ fontSize: "0.7rem" }}>
                      {con.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px", marginTop: "4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ background: "var(--bg-secondary)", padding: "8px", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>Confidence</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
                    {((activeRule.confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ background: "var(--bg-secondary)", padding: "8px", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>Lift Ratio</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: getLiftColor(activeRule.lift || 1) }}>
                    {(activeRule.lift || 0).toFixed(2)}x
                  </div>
                </div>
              </div>

              <div style={{ background: "var(--bg-secondary)", padding: "8px", borderRadius: "var(--radius-sm)" }}>
                <div style={{ fontSize: "0.675rem", color: "var(--text-muted)" }}>Support</div>
                <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)" }}>
                  {((activeRule.support || 0) * 100).toFixed(1)}% of 37 states
                </div>
              </div>

              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                A lift of <strong>{(activeRule.lift || 0).toFixed(2)}x</strong> indicates that states matching the condition are {(activeRule.lift || 0).toFixed(2)} times more likely to exhibit the consequence compared to random baseline occurrence.
              </p>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>
              Hover or click any network edge to inspect rule parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
