import React, { useState } from "react";
import { GitBranch, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";

/**
 * DecisionTreeViewer
 * Graphical Visual Decision Tree Viewer (Regularized Depth=3)
 * Renders verified splitting conditions, decision branches, and predicted burden quartiles.
 */
export default function DecisionTreeViewer({
  evaluation = { accuracy: 0.6216, macro_f1: 0.5302 },
  title = "Supervised Decision Tree Classifier (Depth = 3)",
  subtitle = "Leakage-free classification model predicting state cancer burden quartiles based on observed CAGR and regional zones."
}) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Tree nodes definition mapped from tree_rules_text
  // Layout coordinates for SVG
  const width = 760;
  const height = 400;

  const tierColors = {
    Tier_1_Low: "#10B981",       // Green
    Tier_2_Moderate: "#3B82F6",  // Blue
    Tier_3_High: "#F97316",      // Orange
    Tier_4_Severe: "#EF4444"     // Red
  };

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <GitBranch size={18} color="var(--accent-primary)" />
            {title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        </div>

        {/* Accuracy Badges */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <span className="badge badge-teal" style={{ fontSize: "0.75rem" }}>
            Accuracy: {((evaluation?.accuracy || 0.6216) * 100).toFixed(2)}%
          </span>
          <span className="badge badge-orange" style={{ fontSize: "0.75rem" }}>
            Macro F1: {((evaluation?.macro_f1 || 0.5302) * 100).toFixed(2)}%
          </span>
          <span className="badge badge-green" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
            <ShieldCheck size={12} /> Leakage-Free Verified
          </span>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", minWidth: "680px", display: "block" }}
        >
          <defs>
            <marker
              id="treeArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--text-muted)" />
            </marker>
          </defs>

          {/* Root -> Level 1 Branch Lines */}
          <line x1="380" y1="45" x2="220" y2="105" stroke="var(--border-color)" strokeWidth="2" markerEnd="url(#treeArrow)" />
          <line x1="380" y1="45" x2="560" y2="105" stroke="var(--border-color)" strokeWidth="2" markerEnd="url(#treeArrow)" />
          <text x="280" y="70" fill="var(--accent-primary)" fontSize="10" fontWeight="600">&le; 3.0%</text>
          <text x="475" y="70" fill="var(--accent-secondary)" fontSize="10" fontWeight="600">&gt; 3.0%</text>

          {/* Level 1 (Left) -> Level 2 Branch Lines */}
          <line x1="220" y1="135" x2="130" y2="200" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <line x1="220" y1="135" x2="310" y2="200" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <text x="160" y="165" fill="var(--text-muted)" fontSize="9">No (&le; 0.5)</text>
          <text x="275" y="165" fill="var(--text-muted)" fontSize="9">Yes (&gt; 0.5)</text>

          {/* Level 1 (Right) -> Leaves Lines */}
          <line x1="560" y1="135" x2="490" y2="230" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <line x1="560" y1="135" x2="640" y2="230" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <text x="505" y="180" fill="var(--text-muted)" fontSize="9">No</text>
          <text x="615" y="180" fill="var(--text-muted)" fontSize="9">Yes</text>

          {/* Level 2 (Left) -> Leaves Lines */}
          <line x1="130" y1="230" x2="80" y2="315" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <line x1="130" y1="230" x2="180" y2="315" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <text x="90" y="275" fill="var(--text-muted)" fontSize="9">No</text>
          <text x="160" y="275" fill="var(--text-muted)" fontSize="9">Yes</text>

          {/* Level 2 (Mid) -> Leaves Lines */}
          <line x1="310" y1="230" x2="270" y2="315" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <line x1="310" y1="230" x2="360" y2="315" stroke="var(--border-color)" strokeWidth="1.8" markerEnd="url(#treeArrow)" />
          <text x="275" y="275" fill="var(--text-muted)" fontSize="9">&le; 3%</text>
          <text x="345" y="275" fill="var(--text-muted)" fontSize="9">&gt; 3%</text>

          {/* ROOT NODE */}
          <g transform="translate(380, 30)">
            <rect x="-80" y="-18" width="160" height="36" rx="6" fill="var(--bg-card)" stroke="var(--accent-primary)" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700">
              CAGR &le; 0.03 (3.0%)
            </text>
          </g>

          {/* LEVEL 1: Left Child */}
          <g transform="translate(220, 120)">
            <rect x="-70" y="-16" width="140" height="32" rx="5" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600">
              Region == North?
            </text>
          </g>

          {/* LEVEL 1: Right Child */}
          <g transform="translate(560, 120)">
            <rect x="-70" y="-16" width="140" height="32" rx="5" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="600">
              Region == North East?
            </text>
          </g>

          {/* LEVEL 2: Sub-children */}
          <g transform="translate(130, 215)">
            <rect x="-65" y="-15" width="130" height="30" rx="5" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-primary)" fontSize="9.5" fontWeight="600">
              Region == North East?
            </text>
          </g>

          <g transform="translate(310, 215)">
            <rect x="-60" y="-15" width="120" height="30" rx="5" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-primary)" fontSize="9.5" fontWeight="600">
              CAGR &le; 0.03?
            </text>
          </g>

          {/* LEAF NODES (Tier predictions) */}
          {/* Leaf 1: Tier 4 Severe */}
          <g transform="translate(80, 330)">
            <rect x="-45" y="-14" width="90" height="28" rx="4" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="1.8" />
            <text x="0" y="4" textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="700">Tier 4 (Severe)</text>
          </g>

          {/* Leaf 2: Tier 2 Moderate */}
          <g transform="translate(180, 330)">
            <rect x="-45" y="-14" width="90" height="28" rx="4" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="1.8" />
            <text x="0" y="4" textAnchor="middle" fill="#3B82F6" fontSize="10" fontWeight="700">Tier 2 (Mod)</text>
          </g>

          {/* Leaf 3: Tier 2 Moderate */}
          <g transform="translate(270, 330)">
            <rect x="-45" y="-14" width="90" height="28" rx="4" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="1.8" />
            <text x="0" y="4" textAnchor="middle" fill="#3B82F6" fontSize="10" fontWeight="700">Tier 2 (Mod)</text>
          </g>

          {/* Leaf 4: Tier 1 Low */}
          <g transform="translate(360, 330)">
            <rect x="-45" y="-14" width="90" height="28" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="1.8" />
            <text x="0" y="4" textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="700">Tier 1 (Low)</text>
          </g>

          {/* Leaf 5: Tier 1 Low */}
          <g transform="translate(490, 245)">
            <rect x="-45" y="-14" width="90" height="28" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="1.8" />
            <text x="0" y="4" textAnchor="middle" fill="#10B981" fontSize="10" fontWeight="700">Tier 1 (Low)</text>
          </g>

          {/* Leaf 6: Tier 2 Moderate */}
          <g transform="translate(640, 245)">
            <rect x="-45" y="-14" width="90" height="28" rx="4" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="1.8" />
            <text x="0" y="4" textAnchor="middle" fill="#3B82F6" fontSize="10" fontWeight="700">Tier 2 (Mod)</text>
          </g>
        </svg>
      </div>

      <div style={{ marginTop: "12px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "8px" }}>
        <CheckCircle2 size={16} color="var(--accent-success)" />
        <span>
          <strong>Decision Boundary Logic:</strong> States with slow historical growth (&le;3.0% CAGR) outside North/NE zones partition into Tier 4 (Severe volume: UP, MH, WB, BR). Fast growth (&gt;3.0%) with non-NE geography maps to Tier 1 (Low base volume catching up via rapid urbanization).
        </span>
      </div>
    </div>
  );
}
