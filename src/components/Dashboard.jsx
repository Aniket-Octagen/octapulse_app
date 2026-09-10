/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { PYTHON_BASE_URL } from "../Utilities/config";
import { getAuthHeaders } from "../Utilities/auth";

// ---- auth context (from localStorage) ----
const getAuthContext = () => {
  let user = {};
  try { user = JSON.parse(localStorage.getItem("user") || "{}"); } catch { }
  const USER_ID = user?.id ?? localStorage.getItem("user_id");
  const COMPANY_ID = user?.company_id ?? localStorage.getItem("companyId");
  return {
    USER_ID: USER_ID != null && String(USER_ID) !== "" ? Number(USER_ID) : undefined,
    COMPANY_ID: COMPANY_ID != null && String(COMPANY_ID) !== "" ? Number(COMPANY_ID) : undefined,
  };
};

const PRESET_REASONS = [
  "Material delay", "Equipment breakdown", "Weather impact", "Vendor issue",
  "Site access", "Resource constraint", "Data/entry correction", "Other",
];

const PAGE_SIZE = 10;

// tiny UI helpers
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
    // Handle "YYYY-MM-DD HH:mm:ss" or ISO
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

// data helpers
const normalize = (d) => (Array.isArray(d) ? d : d?.items || d?.results || []);

function getContextFor(item) {
  // Prefer DB-provided description
  if (item?.description && String(item.description).trim()) return String(item.description);

  const rd = (item && typeof item.row_data === "object" && item.row_data) || {};
  const s = (item?.sheet || "").toLowerCase();

  if (s.includes("fuel")) {
    for (const k of ["Resource", "resource", "Activity Name", "Activity_Name", "Activity name", "Activity_Category", "Activity Category", "Type"]) {
      if (rd[k] != null && String(rd[k]).trim() !== "") return String(rd[k]);
    }
    if (rd["Fuel Used (L)"] || rd["Type"]) {
      const t = rd["Type"] || "Fuel";
      const v = rd["Fuel Used (L)"];
      return `${t}${v != null ? `: ${v}` : ""}`;
    }
  }

  if (s.includes("quantity")) {
    for (const k of ["Material", "material", "Item", "item", "Resource", "resource", "Scope", "scope", "Description", "description"]) {
      if (rd[k] != null && String(rd[k]).trim() !== "") return `Material: ${String(rd[k])}`;
    }
  }

  for (const k of ["activity_name", "task_name", "activity_type", "activity_category", "Activity Name", "Task Name", "Scope", "scope"]) {
    if (rd[k]) return String(rd[k]);
    const low = k.toLowerCase().replace(/\s+/g, "_");
    if (rd[low]) return String(rd[low]);
  }
  return "—";
}

function deriveFlag(item) {
  const explicit = (item?.flag || item?.severity || "").toString().trim();
  if (explicit && explicit.toLowerCase() !== "unknown") return explicit;

  const rd = (item && typeof item.row_data === "object" && item.row_data) || {};
  const sheet = (item?.sheet || "").toLowerCase();

  if (sheet.includes("quantity")) {
    for (const k of ["Deviation", "deviation", "Qty Deviation", "qty deviation"]) {
      const n = Number(rd[k]);
      if (!Number.isNaN(n)) return n > 0 ? "Over Consumed" : n < 0 ? "Under Consumed" : "On Target";
    }
    return "Unknown";
  }
  if (sheet.includes("timeline")) {
    const sd = Number(rd.start_delay ?? rd["start_delay"]);
    const dd = Number(rd.duration_deviation ?? rd["duration_deviation"]);
    if ((!Number.isNaN(sd) && sd > 0) || (!Number.isNaN(dd) && dd > 0)) return "Delay";
    return "On/Before Plan";
  }
  if (sheet.includes("cost")) {
    const dev = Number(rd["Cost Deviation"] ?? rd["cost deviation"] ?? rd["deviation"]);
    if (!Number.isNaN(dev)) return dev > 0 ? "Above Budget" : dev < 0 ? "Below Budget" : "Within Budget";
  }
  if (sheet.includes("fuel")) {
    const f = (rd.flag || rd.Flag || "").toString().trim();
    if (f) return f;
    const used = Number(rd.usage ?? rd["usage"] ?? rd["Used"] ?? rd["Fuel Used (L)"]);
    const alloc = Number(rd.allocated ?? rd["allocated"] ?? rd["Allocated"]);
    const dev = Number(rd.deviation ?? rd["deviation"]);
    if (!Number.isNaN(dev)) return dev > 0 ? "Overconsumed Fuel" : dev < 0 ? "Fuel Saved" : "On Target";
    if (!Number.isNaN(used) && !Number.isNaN(alloc)) {
      if (used > alloc) return "Overconsumed Fuel";
      if (used < alloc) return "Fuel Saved";
      return "On Target";
    }
    return "Unknown";
  }
  return "Unknown";
}

function renderDelayInfo(item) {
  const rd = (item && typeof item.row_data === "object" && item.row_data) || {};
  const sheet = (item?.sheet || "").toLowerCase();
  if (!sheet.includes("timeline")) return null;
  const sd = Number(rd.start_delay ?? rd["start_delay"]);
  const dd = Number(rd.duration_deviation ?? rd["duration_deviation"]);
  const parts = [];
  if (!Number.isNaN(sd) && sd > 0) parts.push(`start +${sd} day(s)`);
  if (!Number.isNaN(dd) && dd > 0) parts.push(`duration +${dd} day(s)`);
  return parts.length ? parts.join("; ") : null;
}

// reason picker
function ReasonPicker({ value, onChange }) {
  const { type = "", text = "" } = value || {};
  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <label className="block text-sm font-medium text-slate-700 mb-2">Deviation Reason</label>
      <select
        value={type}
        onChange={(e) => onChange({ type: e.target.value, text: "" })}
        className="input w-full"
      >
        <option value="">Select a reason</option>
        {PRESET_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {type === "Other" && (
        <input
          className="input w-full mt-2"
          placeholder="Type your custom reason…"
          value={text}
          onChange={(e) => onChange({ type, text: e.target.value })}
        />
      )}
    </div>
  );
}

export default function Dashboard() {
  const [{ USER_ID, COMPANY_ID }] = useState(getAuthContext());
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sheetFilter, setSheetFilter] = useState("All");
  const [flagFilter, setFlagFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [reasons, setReasons] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pullDistance, setPullDistance] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const pullStartY = useRef(0);
  const contentRef = useRef(null);
  const toastTimer = useRef(null);
  const PULL_THRESHOLD = 72;

  const showToast = (message, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ show: true, message, type });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true); setErrorMsg("");
      const { data } = await axios.get(
        `${PYTHON_BASE_URL}/deviations`,
        { headers: getAuthHeaders() }
      );
      const arr = normalize(data).filter((item) => {
        const status = String(item.review_status || "").toLowerCase().trim();
        // "not approved" items must stay visible so the manager can resubmit
        return status !== "reviewed" && status !== "approved";
      });
      setRows(arr);
      setFiltered(arr);
    } catch (e) {
      console.error("Fetch deviations failed:", e);
      setErrorMsg("Could not load deviations (server error).");
      setRows([]); setFiltered([]);
    } finally { setLoading(false); setPullDistance(0); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleTouchStart = (e) => {
    pullStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    const el = contentRef.current;
    if (!el || el.scrollTop > 0 || loading) return;
    const dist = e.touches[0].clientY - pullStartY.current;
    if (dist > 0) setPullDistance(Math.min(dist, PULL_THRESHOLD * 1.5));
  };
  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !loading) {
      fetchData();
    } else {
      setPullDistance(0);
    }
  };

  const sheetOptions = useMemo(() => {
    const seen = new Set(["all"]);
    const out = ["All"];
    const dyn = rows.map((r) => (r.sheet || "").trim()).filter(Boolean).map((raw) => {
      const k = raw.toLowerCase();
      if (k.startsWith("time")) return "Timeline Deviation";
      if (k.startsWith("quan")) return "Quantity Deviation";
      if (k.startsWith("cost")) return "Cost Deviation";
      if (k.includes("fuel deviation")) return "Fuel Deviation";
      if (k.includes("fuel by type")) return "Fuel by Type";
      if (k.includes("fuel")) return "Fuel Deviation";
      return raw;
    });
    for (const label of dyn) {
      const sig = label.toLowerCase();
      if (!seen.has(sig)) { seen.add(sig); out.push(label); }
    }
    return out;
  }, [rows]);

  const flagOptions = useMemo(() => {
    const seen = new Set(["all"]);
    const out = ["All"];
    for (const row of rows) {
      const f = deriveFlag(row);
      const label = String(f || "").trim();
      if (!label) continue;
      if (label.toLowerCase() === "manual error") continue;
      const sig = label.toLowerCase();
      if (!seen.has(sig)) {
        seen.add(sig);
        out.push(label);
      }
    }
    return out;
  }, [rows]);

  useEffect(() => {
    let result = rows;

    // Apply sheet filter
    if (sheetFilter !== "All" && sheetFilter) {
      const t = sheetFilter.toLowerCase();
      const key =
        t.startsWith("timeline") ? "timeline" :
          t.startsWith("quantity") ? "quantity" :
            t.startsWith("cost") ? "cost" :
              t.startsWith("fuel by type") ? "fuel by type" :
                t.startsWith("fuel") ? "fuel" :
                  t;
      result = result.filter((r) => (r.sheet || "").toLowerCase().includes(key));
    }

    // Apply date filters
    if (startDate || endDate) {
      result = result.filter((r) => {
        if (!r.detected_at) return true; // Include items without dates
        
        try {
          const detectedStr = r.detected_at.includes("T") 
            ? r.detected_at 
            : r.detected_at.replace(" ", "T");
          const detectedDate = new Date(detectedStr);
          
          if (isNaN(detectedDate.getTime())) return true; // Invalid date, include it
          
          // Extract date part as YYYY-MM-DD string for accurate comparison
          const year = detectedDate.getFullYear();
          const month = String(detectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(detectedDate.getDate()).padStart(2, '0');
          const detectedDateStr = `${year}-${month}-${day}`;
          
          // Compare date strings (works correctly for same start/end date)
          if (startDate && detectedDateStr < startDate) return false;
          if (endDate && detectedDateStr > endDate) return false;
          
          return true;
        } catch {
          return true; // On error, include the item
        }
      });
    }

    // Apply flag filter
    if (flagFilter !== "All") {
      const selected = flagFilter.toLowerCase();
      result = result.filter((r) => deriveFlag(r).toLowerCase() === selected);
    }

    setFiltered(result);
    setVisibleCount(PAGE_SIZE);
  }, [sheetFilter, startDate, endDate, flagFilter, rows]);

  const visibleRows = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMoreRows = visibleCount < filtered.length;

  const onReasonChange = (id, val) => setReasons((p) => ({ ...p, [id]: val }));
  const reasonText = (r) => (!r ? "" : r.type === "Other" ? (r.text?.trim() || "") : (r.type || ""));

  const submitOne = async (id, isResubmit = false) => {
    const r = reasons[id]; const text = reasonText(r);
    if (!text) return showToast("Please select a reason first.", "error");
    try {
      await axios.post(
        `${PYTHON_BASE_URL}/deviations/update/${id}`,
        { review_reason: text, review_status: "Reviewed" },
        { headers: getAuthHeaders() }
      );

      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.post(
            `${PYTHON_BASE_URL}/deviation/submit`,
            { reason: text, type: r.type || "General", deviation_id: id },
            { headers: { "Authorization": `Bearer ${token}` } }
          );
        } catch (notifError) {
          console.error("Notification failed:", notifError);
        }
      }

      showToast(isResubmit ? "Resubmitted successfully!" : "Reason submitted successfully!");
      setRows((prev) => prev.filter((row) => row.id !== id));
      setReasons((p) => { const c = { ...p }; delete c[id]; return c; });
    } catch (e) {
      console.error(e);
      showToast(`Failed to save #${id}`, "error");
    }
  };

  const submitAll = async () => {
    const payloads = Object.entries(reasons)
      .map(([id, val]) => [id, reasonText(val)])
      .filter(([, text]) => text);
    if (!payloads.length) return showToast("No reasons selected.", "error");
    setSubmitting(true);
    const submittedIds = [];
    try {
      const token = localStorage.getItem("token");
      for (const [id, text] of payloads) {
        await axios.post(
          `${PYTHON_BASE_URL}/deviations/update/${id}`,
          {
            review_status: "Reviewed",
            review_reason: text,
            reason_type: reasons[id]?.type || "",
          },
          { headers: getAuthHeaders() }
        );
        submittedIds.push(Number(id));

        if (token) {
          try {
            await axios.post(
              `${PYTHON_BASE_URL}/deviation/submit`,
              { reason: text, type: reasons[id]?.type || "General", deviation_id: id },
              { headers: { "Authorization": `Bearer ${token}` } }
            );
          } catch (notifError) {
            console.error(`Notification failed for #${id}:`, notifError);
          }
        }
      }

      showToast(`${submittedIds.length} reason${submittedIds.length > 1 ? "s" : ""} submitted!`);
      setRows((prev) => prev.filter((row) => !submittedIds.includes(row.id)));
      setReasons({});
    } catch (e) {
      console.error(e);
      if (submittedIds.length) {
        setRows((prev) => prev.filter((row) => !submittedIds.includes(row.id)));
      }
      showToast("Some submissions failed — check console.", "error");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Toast notification */}
      {toast.show && (
        <div
          className="fixed top-5 left-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white"
          style={{
            transform: "translateX(-50%)",
            backgroundColor: toast.type === "success" ? "#2f7a3d" : "#c24841",
            animation: "fadeSlideIn 0.2s ease",
          }}
        >
          {toast.type === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="pmo-page-header flex-shrink-0 flex items-start justify-between">
        <div>
          <h1 className="pmo-page-title">All Deviations</h1>
          <p className="pmo-page-subtitle">Review and manage detected deviations</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          title="Refresh"
          className="mt-1 p-2 rounded-full hover:bg-slate-100 disabled:opacity-40 transition-colors"
          style={{ color: "var(--emerald-600)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div>
            <label className="filter-label">Sheet</label>
            <select value={sheetFilter} onChange={(e) => setSheetFilter(e.target.value)} className="input w-full">
              {sheetOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="filter-label">Flag</label>
            <select value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)} className="input w-full">
              {flagOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="filter-label">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="filter-label">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-full" />
          </div>
        </div>

        {(sheetFilter !== "All" || startDate || endDate || flagFilter !== "All") && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <button
              onClick={() => { setSheetFilter("All"); setStartDate(""); setEndDate(""); setFlagFilter("All"); setVisibleCount(PAGE_SIZE); }}
              className="text-xs font-semibold"
              style={{ color: "var(--emerald-600)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        {pullDistance > 0 && (
          <div
            className="flex items-center justify-center gap-2 text-sm text-emerald-600 transition-all"
            style={{ height: `${pullDistance}px`, overflow: "hidden" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: pullDistance >= PULL_THRESHOLD ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            >
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
            <span>{pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}</span>
          </div>
        )}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-600">Loading deviations…</p>
          </div>
        </div>
      ) : errorMsg ? (
        <div className="pmo-card" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
          <p className="text-sm" style={{ color: "#dc2626" }}>{errorMsg}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pmo-card">
          <div className="empty-state">
            <p>No deviations found for this filter.</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Cards */}
          <div className="space-y-4">
            {visibleRows.map((item) => {
              const flag = deriveFlag(item);
              const delayInfo = renderDelayInfo(item);
              const context = getContextFor(item);
              const statusLower = String(item.review_status || "").toLowerCase().trim();
              const isDeclined = statusLower === "not approved";
              // Already submitted and waiting on admin — lock the card
              const isAwaitingAdmin = !isDeclined && statusLower === "reviewed";
              const adminReason = (item.admin_reason || item.rejection_reason || item.admin_comment || "").toString().trim();
              const history = Array.isArray(item.review_history) ? item.review_history : [];

              const severityClass =
                isDeclined ? 'pmo-badge-danger' :
                  item.severity === 'High' ? 'pmo-badge-danger' :
                    item.severity === 'Medium' ? 'pmo-badge-warning' :
                      'pmo-badge-info';

              return (
                <div key={item.id} className="pmo-card" style={isDeclined ? { borderLeft: "3px solid #c24841" } : {}}>
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-3 pb-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400">#{item.id}</span>
                      <span className={`pmo-badge ${severityClass}`}>
                        {isDeclined ? "Resubmission Required" : (item.severity || flag)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{formatDetectedAt(item.detected_at)}</span>
                  </div>

                  {/* Card body */}
                  <div className="space-y-2">
                    <Row>
                      <Label>Sheet</Label>
                      <Value>{item.sheet || "—"}</Value>
                    </Row>
                    <Row>
                      <Label>Flag</Label>
                      <Value>
                        {flag || "—"}
                        {delayInfo && <span className="text-red-500 ml-1 text-xs">({delayInfo})</span>}
                      </Value>
                    </Row>
                    <Row>
                      <Label>Context</Label>
                      <Value>{context}</Value>
                    </Row>
                  </div>

                  {/* Declined: history + admin reason */}
                  {isDeclined && (
                    <div className="mt-3 rounded-lg overflow-hidden" style={{ border: "1px solid #fecaca", background: "#fff5f5" }}>
                      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c24841" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span className="text-xs font-bold" style={{ color: "#c24841" }}>Admin declined — resubmission required</span>
                      </div>

                      <div className="px-3 py-2.5 space-y-2.5">
                        {/* Admin rejection reason */}
                        {adminReason && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-0.5">Admin feedback</p>
                            <p className="text-xs text-slate-700">{adminReason}</p>
                          </div>
                        )}

                        {/* Full history if backend provides it */}
                        {history.length > 0 ? (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">Submission history</p>
                            <div className="space-y-1.5">
                              {history.map((h, i) => (
                                <div key={i} className="text-xs" style={{ paddingLeft: "0.5rem", borderLeft: "2px solid #e2e8f0" }}>
                                  <span className="font-medium text-slate-500">Round {i + 1}:</span>{" "}
                                  <span className="text-slate-700">{h.manager_reason || h.reason || "—"}</span>
                                  {(h.admin_reason || h.admin_action) && (
                                    <span className="ml-1" style={{ color: "#c24841" }}>
                                      → {h.admin_action === "rejected" ? "Declined" : h.admin_action}
                                      {h.admin_reason ? `: ${h.admin_reason}` : ""}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : item.review_reason ? (
                          /* Fallback: show the previous manager reason */
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-0.5">Your previous reason</p>
                            <p className="text-xs text-slate-700">{item.review_reason}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {isAwaitingAdmin ? (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2f7a3d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "#2f7a3d" }}>Submitted — pending admin review</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Your reason: <span className="font-medium text-slate-700">{item.review_reason}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ReasonPicker value={reasons[item.id]} onChange={(v) => onReasonChange(item.id, v)} />
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => submitOne(item.id, isDeclined)}
                          className="btn-primary"
                          style={{ height: "36px", fontSize: "0.8125rem" }}
                        >
                          {isDeclined ? "Resubmit" : "Submit"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {hasMoreRows && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="btn-primary"
                style={{ background: "white", color: "var(--emerald-700)", border: "1.5px solid var(--emerald-300)", boxShadow: "none", height: "38px" }}
              >
                Load More
              </button>
            </div>
          )}

          {/* Submit All Button */}
          <div className="mt-3 pb-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "1rem" }}>
            <button
              onClick={submitAll}
              disabled={submitting}
              className="btn-primary w-full"
              style={{ height: "46px", borderRadius: "0.75rem", fontSize: "0.9375rem" }}
            >
              {submitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Submitting…
                </>
              ) : (
                "Submit All Reasons"
              )}
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}