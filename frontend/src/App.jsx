import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import OverviewTab from "./components/OverviewTab";
import GeographyTab from "./components/GeographyTab";
import CancerSitesTab from "./components/CancerSitesTab";
import TrendsTab from "./components/TrendsTab";
import MortalityTab from "./components/MortalityTab";
import InfrastructureTab from "./components/InfrastructureTab";
import DataMiningTab from "./components/DataMiningTab";
import AssistantTab from "./components/AssistantTab";
import ProvenanceTab from "./components/ProvenanceTab";
import ExportsTab from "./components/ExportsTab";
import { api } from "./services/api";

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("cia-theme") || "dark";
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [dbStatus, setDbStatus] = useState("connecting");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cia-theme", theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const checkDb = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          const isHealthy = Boolean(
            res && res.status === "healthy" && res.database_connected === true
          );
          setDbStatus(isHealthy ? "connected" : "error");
        }
      } catch (err) {
        if (isMounted) {
          setDbStatus("error");
        }
      }
    };

    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "geography":
        return <GeographyTab />;
      case "sites":
        return <CancerSitesTab />;
      case "trends":
        return <TrendsTab />;
      case "mortality":
        return <MortalityTab />;
      case "infrastructure":
        return <InfrastructureTab />;
      case "datamining":
        return <DataMiningTab />;
      case "assistant":
        return <AssistantTab />;
      case "provenance":
        return <ProvenanceTab />;
      case "exports":
        return <ExportsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div className="app-container">
      <Header theme={theme} toggleTheme={toggleTheme} dbStatus={dbStatus} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        {renderActiveTab()}
      </main>

      <footer style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
        padding: "20px 24px",
        marginTop: "40px",
        fontSize: "0.825rem",
        color: "var(--text-muted)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px"
      }}>
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Cancer Intelligence & Analytics</strong> — Academic Data Warehousing & Data Mining (DWM) Platform
          <div style={{ marginTop: "4px" }}>
            Conformed Star Schema • 15 Tables • 55 Automated Verification Checks • 6 Data Mining Algorithms
          </div>
        </div>
        <div style={{ textAlign: "right", maxWidth: "420px" }}>
          <span style={{ color: "var(--accent-warning)", fontWeight: "600" }}>Non-Clinical Notice:</span> Strictly intended for epidemiological research, resource modeling, and curriculum evaluation. Not for clinical diagnosis or individual patient prognosis.
        </div>
      </footer>
    </div>
  );
}
