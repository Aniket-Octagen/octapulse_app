/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../Utilities/config";
import { LuChartBar, LuRefreshCw, LuCircleCheck, LuTriangleAlert, LuCircleX, LuOctagonAlert } from "react-icons/lu";

function formatMonth(str) {
  // "2026-06" → "June 2026"
  const [year, mon] = str.split("-");
  const name = new Date(Number(year), parseInt(mon, 10) - 1, 1).toLocaleString("en", { month: "long" });
  return `${name} ${year}`;
}

function StatPill({ icon, label, value, bg, text }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
      style={{ background: bg }}
    >
      <span style={{ color: text, display: "flex", alignItems: "center" }}>{icon}</span>
      <span className="text-xs font-semibold" style={{ color: text }}>{value}</span>
      <span className="text-xs" style={{ color: text, opacity: 0.75 }}>{label}</span>
    </div>
  );
}

function MonthCard({ data }) {
  const { month, total, answered, unanswered, expired, high_severity } = data;
  const answeredPct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="pmo-card">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 pb-2.5"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <h3 className="text-base font-semibold text-slate-900">{formatMonth(month)}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{total} total</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: answeredPct === 100 ? "#d1fae5" : answeredPct >= 50 ? "#fef3c7" : "#fee2e2",
              color: answeredPct === 100 ? "#059669" : answeredPct >= 50 ? "#d97706" : "#dc2626",
            }}
          >
            {answeredPct}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--slate-100)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${answeredPct}%`,
            background: answeredPct === 100
              ? "linear-gradient(90deg, #059669, #10b981)"
              : answeredPct >= 50
              ? "linear-gradient(90deg, #d97706, #f59e0b)"
              : "linear-gradient(90deg, #dc2626, #ef4444)",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-2 gap-2">
        <StatPill
          icon={<LuCircleCheck size={13} />}
          label="answered"
          value={answered}
          bg="#d1fae5"
          text="#059669"
        />
        <StatPill
          icon={<LuTriangleAlert size={13} />}
          label="unanswered"
          value={unanswered}
          bg="#fef3c7"
          text="#d97706"
        />
        <StatPill
          icon={<LuCircleX size={13} />}
          label="expired"
          value={expired}
          bg="#fee2e2"
          text="#dc2626"
        />
        {high_severity > 0 && (
          <StatPill
            icon={<LuOctagonAlert size={13} />}
            label="high sev."
            value={high_severity}
            bg="#fce7f3"
            text="#be185d"
          />
        )}
      </div>
    </div>
  );
}

export default function DeviationReport() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE_URL}/admin/deviation-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort newest month first
      const sorted = [...(data.report || [])].sort((a, b) =>
        b.month.localeCompare(a.month)
      );
      setReport(sorted);
    } catch (err) {
      setError("Could not load report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pmo-page-header flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="pmo-page-title flex items-center gap-2">
              <LuChartBar className="text-xl" /> Deviation Report
            </h1>
            <p className="pmo-page-subtitle">Monthly deviation lifecycle summary</p>
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.375rem 0.75rem", fontSize: "0.8125rem",
              border: "1.5px solid var(--slate-200)", borderRadius: "0.625rem",
              color: "var(--slate-600)", background: "white", cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <LuRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 flex-shrink-0">
        {[
          { color: "#059669", label: "Answered" },
          { color: "#d97706", label: "Unanswered" },
          { color: "#dc2626", label: "Expired" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="pmo-card text-red-700 text-sm p-4" style={{ background: "#fef2f2", borderColor: "#fca5a5" }}>
            {error}
          </div>
        ) : report.length === 0 ? (
          <div className="pmo-card p-8 text-center text-slate-500">
            No report data available.
          </div>
        ) : (
          <div className="space-y-4">
            {report.map((row) => (
              <MonthCard key={row.month} data={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
