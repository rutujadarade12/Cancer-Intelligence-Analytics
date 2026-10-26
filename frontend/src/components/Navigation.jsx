import React from "react";
import {
  LayoutDashboard,
  MapPin,
  Dna,
  TrendingUp,
  HeartPulse,
  Building2,
  Cpu,
  Bot,
  FileText,
  Download
} from "lucide-react";

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "geography", label: "Geography", icon: MapPin },
    { id: "sites", label: "Cancer Sites", icon: Dna },
    { id: "trends", label: "Trends & Projections", icon: TrendingUp },
    { id: "mortality", label: "Mortality & MIR", icon: HeartPulse },
    { id: "infrastructure", label: "Infrastructure", icon: Building2 },
    { id: "datamining", label: "Data Mining Lab", icon: Cpu },
    { id: "assistant", label: "Analytics Assistant", icon: Bot, isNew: true },
    { id: "provenance", label: "Provenance", icon: FileText },
    { id: "exports", label: "Exports", icon: Download }
  ];

  return (
    <nav style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      padding: "0 24px",
      display: "flex",
      gap: "6px",
      overflowX: "auto",
      whiteSpace: "nowrap"
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "13px 15px",
              background: "transparent",
              border: "none",
              borderBottom: isActive ? "3px solid var(--accent-primary)" : "3px solid transparent",
              color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: isActive ? "600" : "500",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <Icon size={16} color={isActive ? "var(--accent-primary)" : "var(--text-muted)"} />
            <span>{tab.label}</span>
            {tab.isNew && (
              <span className="badge badge-teal" style={{ fontSize: "0.65rem", padding: "1px 5px" }}>
                AI
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
