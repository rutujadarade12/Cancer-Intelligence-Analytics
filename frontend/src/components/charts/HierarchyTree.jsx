import React, { useState, useMemo } from "react";
import { FolderTree, ChevronRight, ChevronDown, Flame, Search, Shield, Info } from "lucide-react";

/**
 * HierarchyTree
 * Interactive Collapsible Anatomical Snowflake Hierarchy Tree
 * Level 0: Root (Human Anatomy & Clinical Oncology)
 * Level 1: 11 Physiological Organ Systems (Dim_Organ_System)
 * Level 2: 76 Anatomical Cancer Sites (Dim_Cancer_Site with ICD-10 & Tobacco flags)
 */
export default function HierarchyTree({
  organSystems = [],
  cancerSites = [],
  title = "Anatomical Snowflake Hierarchy (Organ Systems &rarr; Cancer Sites)",
  subtitle = "Two-level dimensional snowflake hierarchy linking 11 physiological organ systems to 76 conformed anatomical cancer sites."
}) {
  const [expandedSystems, setExpandedSystems] = useState({ 1: true, 2: true, 3: true, 4: true });
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSystem = (id) => {
    setExpandedSystems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all = {};
    organSystems.forEach((o) => { all[o.organ_system_id] = true; });
    setExpandedSystems(all);
  };

  const collapseAll = () => {
    setExpandedSystems({});
  };

  // Group sites by organ_system_id
  const sitesBySystem = useMemo(() => {
    const map = {};
    cancerSites.forEach((site) => {
      const sysId = site.organ_system_id || 10;
      if (!map[sysId]) map[sysId] = [];
      map[sysId].push(site);
    });
    return map;
  }, [cancerSites]);

  // Filtered organ systems based on search
  const filteredSystems = useMemo(() => {
    if (!searchTerm.trim()) return organSystems;
    const term = searchTerm.toLowerCase();

    return organSystems.filter((sys) => {
      const sysMatches = (sys.system_name || "").toLowerCase().includes(term);
      const sites = sitesBySystem[sys.organ_system_id] || [];
      const sitesMatch = sites.some(
        (s) =>
          (s.site_name || "").toLowerCase().includes(term) ||
          (s.icd10_code || "").toLowerCase().includes(term)
      );
      return sysMatches || sitesMatch;
    });
  }, [organSystems, sitesBySystem, searchTerm]);

  return (
    <div className="card" style={{ width: "100%", marginBottom: "20px" }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <FolderTree size={18} color="var(--accent-secondary)" />
            {title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "9px", top: "9px" }} />
            <input
              type="text"
              placeholder="Search site or ICD-10..."
              className="form-control"
              style={{ paddingLeft: "28px", width: "180px", fontSize: "0.75rem", padding: "6px 28px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={expandAll}
            className="btn btn-outline"
            style={{ fontSize: "0.75rem", padding: "5px 10px" }}
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="btn btn-outline"
            style={{ fontSize: "0.75rem", padding: "5px 10px" }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree Visualization */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxHeight: "520px",
          overflowY: "auto"
        }}
      >
        {/* Root Node */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 14px",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--accent-secondary)",
            width: "fit-content"
          }}
        >
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--accent-secondary)" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
            Root: Human Anatomical Oncology Taxonomy
          </span>
          <span className="badge badge-teal" style={{ fontSize: "0.65rem" }}>
            11 Systems / 76 Sites
          </span>
        </div>

        {/* Level 1: Organ Systems */}
        <div style={{ marginLeft: "20px", paddingLeft: "16px", borderLeft: "2px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredSystems.map((sys) => {
            const sysId = sys.organ_system_id;
            const sites = sitesBySystem[sysId] || [];
            const isExpanded = expandedSystems[sysId] || Boolean(searchTerm);
            const tobaccoCount = sites.filter((s) => s.is_tobacco_associated === 1).length;

            return (
              <div key={sysId} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {/* Organ System Header */}
                <div
                  onClick={() => toggleSystem(sysId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 12px",
                    background: isExpanded ? "var(--bg-card-hover)" : "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    width: "fit-content"
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={15} color="var(--accent-primary)" />
                  ) : (
                    <ChevronRight size={15} color="var(--text-muted)" />
                  )}
                  <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "var(--text-primary)" }}>
                    {sys.system_name}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: "0.65rem" }}>
                    {sites.length} sites
                  </span>
                  {tobaccoCount > 0 && (
                    <span className="badge badge-orange" style={{ fontSize: "0.65rem", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Flame size={10} /> {tobaccoCount} tobacco-linked
                    </span>
                  )}
                </div>

                {/* Level 2: Expanded Cancer Sites */}
                {isExpanded && sites.length > 0 && (
                  <div
                    style={{
                      marginLeft: "24px",
                      paddingLeft: "14px",
                      borderLeft: "2px dashed var(--accent-secondary)",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      paddingTop: "4px",
                      paddingBottom: "6px"
                    }}
                  >
                    {sites.map((site) => (
                      <div
                        key={site.site_id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 9px",
                          background: "var(--bg-card)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.75rem"
                        }}
                      >
                        <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>
                          {site.site_name}
                        </span>
                        {site.icd10_code && (
                          <span
                            className="badge badge-gray"
                            style={{ fontSize: "0.625rem", fontFamily: "monospace", padding: "1px 5px" }}
                          >
                            {site.icd10_code}
                          </span>
                        )}
                        {site.is_tobacco_associated === 1 && (
                          <span title="Tobacco-Associated Site" style={{ color: "var(--accent-primary)", display: "inline-flex" }}>
                            <Flame size={12} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
