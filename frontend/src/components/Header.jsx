import React from "react";
import { Activity, Sun, Moon, Database } from "lucide-react";

export default function Header({ theme, toggleTheme, dbStatus }) {
  return (
    <header style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      padding: "16px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{
          background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
          borderRadius: "var(--radius-md)",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF"
        }}>
          <Activity size={24} />
        </div>
        <div>
          <h1 style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            color: "var(--text-primary)",
            lineHeight: 1.2
          }}>
            Cancer Intelligence & Analytics
          </h1>
          <p style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            letterSpacing: "0.02em"
          }}>
            Data Warehouse & Mining Platform • Academic DWM Sem V CMPN
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Conformed DB schema pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          padding: "6px 12px",
          borderRadius: "var(--radius-full)",
          fontSize: "0.775rem",
          color: "var(--text-secondary)"
        }}>
          <Database size={13} color="var(--accent-secondary)" />
          <span>15 Conformed Tables • Star Schema</span>
        </div>

        {/* Backend Database Status Pill */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          padding: "6px 12px",
          borderRadius: "var(--radius-full)",
          fontSize: "0.775rem"
        }}>
          <div
            className={dbStatus === "connected" ? "pulse-dot" : ""}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background:
                dbStatus === "connected"
                  ? "var(--accent-success)"
                  : dbStatus === "connecting"
                  ? "var(--accent-warning)"
                  : "var(--accent-danger)"
            }}
          />
          <span style={{ color: "var(--text-secondary)", fontWeight: "500" }}>
            Warehouse: {
              dbStatus === "connected"
                ? "Connected"
                : dbStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"
            }
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark and Light Mode"
          className="btn btn-outline"
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer"
          }}
        >
          {theme === "dark" ? (
            <>
              <Sun size={18} color="var(--accent-warning)" />
              <span style={{ fontSize: "0.8rem" }}>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={18} color="var(--accent-info)" />
              <span style={{ fontSize: "0.8rem" }}>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
