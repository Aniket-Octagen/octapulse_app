/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { PYTHON_BASE_URL } from "../Utilities/config";

// ---- auth context (from localStorage) ----
const getAuthContext = () => {
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch {}
  const USER_ID   = user?.id ?? localStorage.getItem("user_id");
  const COMPANY_ID = user?.company_id ?? localStorage.getItem("companyId");
  return {
    USER_ID:   USER_ID   != null && String(USER_ID)   !== "" ? Number(USER_ID)   : undefined,
    COMPANY_ID: COMPANY_ID != null && String(COMPANY_ID) !== "" ? Number(COMPANY_ID) : undefined,
  };
};

// alignment helpers
const Row = ({ children }) => <div className="flex items-baseline gap-2">{children}</div>;
const Label = ({ children }) => (
  <div className="text-xs text-slate-400 font-medium shrink-0" style={{ width: "4.5rem" }}>{children}</div>
);
const Value = ({ children }) => (
  <div className="text-sm font-medium text-slate-800 flex-1 min-w-0">{children}</div>
);

// ---- date formatting (IST) ----
function formatDetectedAt(value) {
  if (!value) return "—";
  try {
    const str = value.includes("T") ? value : value.replace(" ", "T");
    const d = new Date(str);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return String(value);
  }
}

function normalize(d) { return Array.isArray(d) ? d : []; }

function getContextFor(item) {
  // Prefer DB description if present
  if (item?.description && String(item.description).trim()) return String(item.description);

  const rd = (item && typeof item.row_data === "object" && item.row_data) || {};
  const isQuantity = String(item?.sheet || "").toLowerCase().includes("quantity");
  if (isQuantity) {
    for (const k of ["Material","material","Item","item","Resource","resource","Scope","scope","Description","description"]) {
      if (rd[k] != null && String(rd[k]).trim() !== "") return `Material: ${String(rd[k])}`;
    }
  }
  for (const k of ["activity_name","task_name","activity_type","activity_category","Activity Name","Task Name","Scope","scope"]) {
    if (rd[k]) return String(rd[k]);
    const low = k.toLowerCase().replace(/\s+/g, "_");
    if (rd[low]) return String(rd[low]);
  }
  return "—";
}

export default function Declined() {
  const [{ USER_ID, COMPANY_ID }] = useState(getAuthContext());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState("declined");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setErrorMsg("");
        const { data } = await axios.get(`${PYTHON_BASE_URL}/deviations/history`, {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          params: { company_id: COMPANY_ID, user_id: USER_ID, limit: 500 },
        });
        setRows(normalize(data));
      } catch (e) {
        console.error(e);
        setErrorMsg("Could not load history (server error)."); setRows([]);
      } finally { setLoading(false); }
    })();
  }, [COMPANY_ID, USER_ID]);

  const declinedList = useMemo(() => {
    const bad = new Set(["not approved","declined","rejected"]);
    return rows.filter(r => bad.has(String(r.review_status||"").toLowerCase()));
  }, [rows]);

  const approvedList = useMemo(() => {
    return rows.filter(r => String(r.review_status||"").toLowerCase() === "approved");
  }, [rows]);

  const active = tab === "declined" ? declinedList : approvedList;
  const count  = active.length;

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header */}
      <div className="pmo-page-header flex-shrink-0">
        <h1 className="pmo-page-title">History</h1>
        <p className="pmo-page-subtitle">View approved and declined deviation records</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          onClick={() => setTab("declined")}
          className={`tab-btn ${tab === "declined" ? "active-danger" : ""}`}
        >
          Declined <span className="ml-1 text-xs opacity-75">({declinedList.length})</span>
        </button>
        <button
          onClick={() => setTab("approved")}
          className={`tab-btn ${tab === "approved" ? "active" : ""}`}
        >
          Approved <span className="ml-1 text-xs opacity-75">({approvedList.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : errorMsg ? (
          <div className="pmo-card" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
            <p className="text-sm" style={{ color: "#dc2626" }}>{errorMsg}</p>
          </div>
        ) : count === 0 ? (
          <div className="pmo-card">
            <div className="empty-state">
              <p>No items in this tab.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {active.map((r) => {
              const context = getContextFor(r);
              const statusClass = 
                tab === 'declined' ? 'pmo-badge-danger' : 'pmo-badge-success';
              
              return (
                <div key={r.id} className="pmo-card">
                  <div className="flex items-center justify-between mb-3 pb-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">#{r.id}</span>
                      <span className={`pmo-badge ${statusClass}`}>{r.review_status || "—"}</span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDetectedAt(r.detected_at)}</span>
                  </div>

                  <div className="space-y-2">
                    <Row><Label>Sheet</Label><Value>{r.sheet || "—"}</Value></Row>
                    <Row><Label>Flag</Label><Value>{r.flag || r.severity || "—"}</Value></Row>
                    <Row><Label>Context</Label><Value>{context}</Value></Row>
                    <Row>
                      <Label>Reason</Label>
                      <Value style={{ color: "var(--emerald-700)" }}>{r.review_reason || "—"}</Value>
                    </Row>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
