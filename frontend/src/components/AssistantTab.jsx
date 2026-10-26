import React, { useState } from "react";
import { api } from "../services/api";
import { Bot, Send, Sparkles, AlertTriangle, ShieldCheck, Database, RefreshCw, Trash2 } from "lucide-react";

export default function AssistantTab() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to the **Cancer Analytics Intelligence Assistant**. I can answer questions grounded in the conformed SQLite Data Warehouse (37 States & UTs, 75 Cancer Sites, 2019–2045 Projections) and verified Data Mining models.\n\nSelect a preset prompt below or ask your own question.",
      intent: "welcome",
      sources: ["Dim_Geography", "Dim_Cancer_Site", "Fact_State_Surveillance"],
      disclaimer: "All calculations are generated from conformed warehouse records."
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    "What are the top 5 cancer burden states?",
    "Show regional cancer distribution across 6 zones",
    "What are the leading cancer sites for males and females?",
    "What is the projected cancer burden for 2026 and 2045?",
    "Explain the Dataset 5 mortality surveillance caveat",
    "What are the K-Means clustering and machine learning results?",
    "Show national early screening and treatment retention rates",
    "Do I have cancer symptoms? (Clinical Guardrail Test)"
  ];

  const handleSend = async (queryText) => {
    const text = queryText || inputQuery;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await api.askAssistant(text);
      const assistantMsg = {
        role: "assistant",
        content: res.answer,
        intent: res.intent,
        sources: res.table_sources,
        disclaimer: res.disclaimer,
        summary: res.data_summary
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error connecting to the warehouse API. Please ensure the backend server is running at http://127.0.0.1:8000.",
          intent: "error",
          sources: [],
          disclaimer: "Backend connection error."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. Ask a question regarding state cancer burden, longitudinal projections, organ systems, or data mining results.",
        intent: "reset",
        sources: [],
        disclaimer: "Grounded directly in warehouse records."
      }
    ]);
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bot size={22} color="var(--accent-secondary)" />
            Cancer Analytics Intelligence Assistant
          </h2>
          <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
            Grounded analytical assistant answering epidemiological, dimensional, and data mining questions from the warehouse.
          </p>
        </div>

        <button
          onClick={handleClear}
          className="btn btn-outline"
          style={{ fontSize: "0.775rem", padding: "6px 12px" }}
          title="Reset conversation"
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Suggested Prompt Pills */}
      <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Sparkles size={14} color="var(--accent-primary)" />
          <span>Quick Analytical Questions:</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              className="prompt-pill"
              onClick={() => handleSend(p)}
              disabled={loading}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`chat-bubble ${m.role}`}>
              {m.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Bot size={15} color="var(--accent-secondary)" />
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--accent-secondary)" }}>
                      Warehouse Assistant
                    </span>
                  </div>
                  {m.intent && (
                    <span className="badge badge-gray" style={{ fontSize: "0.675rem" }}>
                      Intent: {m.intent}
                    </span>
                  )}
                </div>
              )}

              {/* Message Content */}
              <div style={{ whiteSpace: "pre-wrap", fontSize: "0.875rem" }}>
                {m.content}
              </div>

              {/* Table Sources & Disclaimer */}
              {m.role === "assistant" && m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px dashed var(--border-color)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <Database size={12} color="var(--accent-primary)" />
                    <span>Sources:</span>
                    {m.sources.map((src, sIdx) => (
                      <span key={sIdx} className="badge badge-teal" style={{ fontSize: "0.65rem" }}>
                        {src}
                      </span>
                    ))}
                  </div>
                  {m.disclaimer && (
                    <div style={{ fontStyle: "italic", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Note: {m.disclaimer}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
              <RefreshCw size={16} className="pulse-dot" style={{ animation: "spin 1s infinite linear" }} />
              <span>Querying warehouse tables & verifying analytical models...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Ask a question about cancer incidence, projections, clusters, or infrastructure..."
            style={{ flex: 1, padding: "10px 14px" }}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "0 20px" }}
            disabled={loading || !inputQuery.trim()}
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
