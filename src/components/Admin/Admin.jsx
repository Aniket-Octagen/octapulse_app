/* eslint-disable no-empty */
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { PYTHON_BASE_URL } from "../../Utilities/config";
import { getAuthHeaders } from "../../Utilities/auth";
import { showNotification } from "../../Utilities/utilities";

// ---- auth context (same as Dashboard) ----
const getAuthContext = () => {
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {}
  const rawUserId = user?.id ?? localStorage.getItem("user_id");
  const rawCompanyId = user?.company_id ?? localStorage.getItem("companyId");
  const toId = (v) => {
    if (v == null || String(v).trim() === "") return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  return {
    USER_ID: toId(rawUserId),
    COMPANY_ID: toId(rawCompanyId),
  };
};

// layout bits
const Row = ({ children }) => (
  <div className="grid grid-cols-12 gap-3">{children}</div>
);
const Label = ({ children }) => (
  <div className="col-span-12 sm:col-span-4 text-slate-500">{children}</div>
);
const Value = ({ children }) => (
  <div className="col-span-12 sm:col-span-8 font-medium">{children}</div>
);

// date (IST)
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

function getContextFor(item) {
  if (item?.description && String(item.description).trim())
    return String(item.description);
  const rd =
    (item && typeof item.row_data === "object" && item.row_data) || {};
  const s = (item?.sheet || "").toLowerCase();

  if (s.includes("fuel")) {
    for (const k of [
      "Resource",
      "resource",
      "Activity Name",
      "Activity_Name",
      "Activity name",
      "Activity_Category",
      "Activity Category",
      "Type",
    ]) {
      if (rd[k] != null && String(rd[k]).trim() !== "") return String(rd[k]);
    }
    if (rd["Fuel Used (L)"] || rd["Type"]) {
      const t = rd["Type"] || "Fuel";
      const v = rd["Fuel Used (L)"];
      return `${t}${v != null ? `: ${v}` : ""}`;
    }
  }
  if (s.includes("quantity")) {
    for (const k of [
      "Material",
      "material",
      "Item",
      "item",
      "Resource",
      "resource",
      "Scope",
      "scope",
      "Description",
      "description",
    ]) {
      if (rd[k] != null && String(rd[k]).trim() !== "")
        return `Material: ${String(rd[k])}`;
    }
  }
  for (const k of [
    "activity_name",
    "task_name",
    "activity_type",
    "activity_category",
    "Activity Name",
    "Task Name",
    "Scope",
    "scope",
  ]) {
    if (rd[k]) return String(rd[k]);
    const low = k.toLowerCase().replace(/\s+/g, "_");
    if (rd[low]) return String(rd[low]);
  }
  return "—";
}

function deriveFlag(item) {
  const explicit = (item?.flag || item?.severity || "")
    .toString()
    .trim();
  if (explicit && explicit.toLowerCase() !== "unknown") return explicit;

  const rd =
    (item && typeof item.row_data === "object" && item.row_data) || {};
  const sheet = (item?.sheet || "").toLowerCase();

  if (sheet.includes("quantity")) {
    const n = Number(
      rd["Deviation"] ??
        rd["deviation"] ??
        rd["Qty Deviation"] ??
        rd["qty deviation"]
    );
    if (!Number.isNaN(n))
      return n > 0
        ? "Over Consumed"
        : n < 0
        ? "Under Consumed"
        : "On Target";
    return "Unknown";
  }
  if (sheet.includes("timeline")) {
    const sd = Number(rd.start_delay ?? rd["start_delay"]);
    const dd = Number(rd.duration_deviation ?? rd["duration_deviation"]);
    if (
      (!Number.isNaN(sd) && sd > 0) ||
      (!Number.isNaN(dd) && dd > 0)
    )
      return "Delay";
    return "On/Before Plan";
  }
  if (sheet.includes("cost")) {
    const dev = Number(
      rd["Cost Deviation"] ??
        rd["cost deviation"] ??
        rd["deviation"]
    );
    if (!Number.isNaN(dev))
      return dev > 0
        ? "Above Budget"
        : dev < 0
        ? "Below Budget"
        : "Within Budget";
  }
  if (sheet.includes("fuel")) {
    const f = (rd.flag || rd.Flag || "").toString().trim();
    if (f) return f;
    const used = Number(
      rd.usage ??
        rd["usage"] ??
        rd["Used"] ??
        rd["Fuel Used (L)"]
    );
    const alloc = Number(
      rd.allocated ?? rd["allocated"] ?? rd["Allocated"]
    );
    const dev = Number(rd.deviation ?? rd["deviation"]);
    if (!Number.isNaN(dev))
      return dev > 0
        ? "Overconsumed Fuel"
        : dev < 0
        ? "Fuel Saved"
        : "On Target";
    if (!Number.isNaN(used) && !Number.isNaN(alloc)) {
      if (used > alloc) return "Overconsumed Fuel";
      if (used < alloc) return "Fuel Saved";
      return "On Target";
    }
    return "Unknown";
  }
  return "Unknown";
}

export default function Admin() {
  const [{ USER_ID, COMPANY_ID }] = useState(getAuthContext());
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejectState, setRejectState] = useState({});
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // Fetch deviations that still need admin decision
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${PYTHON_BASE_URL}/deviations`,
          {
            headers: getAuthHeaders(),
            params: {
              ...(COMPANY_ID !== undefined && { company_id: COMPANY_ID }),
              ...(USER_ID !== undefined && { user_id: USER_ID }),
            },
          }
        );
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Admin fetch failed:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [COMPANY_ID, USER_ID]);

  const sheetOptions = useMemo(() => {
    const seen = new Set([
      "all",
      
    ]);
    const out = [
      "All",
      
    ];
    rows.forEach((r) => {
      const raw = (r.sheet || "").trim();
      if (!raw) return;
      const k = raw.toLowerCase();
      const label =
        k.startsWith("time")
          ? "Timeline Deviation"
          : k.startsWith("quan")
          ? "Quantity Deviation"
          : k.startsWith("cost")
          ? "Cost Deviation"
          : k.includes("fuel deviation")
          ? "Fuel Deviation"
          : k.includes("fuel by type")
          ? "Fuel by Type"
          : k.includes("fuel")
          ? "Fuel Deviation"
          : raw;
      if (!seen.has(label.toLowerCase())) {
        seen.add(label.toLowerCase());
        out.push(label);
      }
    });
    return out;
  }, [rows]);

  // Filter to show only deviations that still need admin review
  const pendingDeviations = useMemo(() => {
    return rows.filter((r) => {
      const status = String(r.review_status || "").toLowerCase().trim();
      return status !== "approved" && status !== "not approved";
    });
  }, [rows]);

  const filtered = useMemo(() => {
    let result = pendingDeviations;

    // Apply sheet filter
    if (filter !== "All") {
      const t = filter.toLowerCase();
      const needle =
        t.startsWith("timeline")
          ? "timeline"
          : t.startsWith("quantity")
          ? "quantity"
          : t.startsWith("cost")
          ? "cost"
          : t.startsWith("fuel by type")
          ? "fuel by type"
          : t.startsWith("fuel")
          ? "fuel"
          : t;
      result = result.filter((r) =>
        (r.sheet || "").toLowerCase().includes(needle)
      );
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

    return result;
  }, [pendingDeviations, filter, startDate, endDate]);

  // Reset page when filters change
  React.useEffect(() => { setPage(0); }, [filter, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ---- Admin decision ----
  const canActOn = (row) =>
    String(row?.review_status || "").toLowerCase().trim() === "reviewed";

  async function handleApprove(row) {
    if (!canActOn(row)) return;
    try {
      await axios.post(
        `${PYTHON_BASE_URL}/deviations/admin/approve/${row.id}`,
        { reason: "", user_id: USER_ID, company_id: COMPANY_ID },
        { headers: { ...getAuthHeaders(), "Content-Type": "application/json" } }
      );
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      console.error("Approve failed:", e);
      showNotification({ message: e?.response?.data?.error || e?.message || "Failed to approve.", type: "error" });
    }
  }

  function openReject(rowId) {
    const row = rows.find((r) => r.id === rowId);
    if (!canActOn(row)) return;
    setRejectState((prev) => ({ ...prev, [rowId]: { open: true, text: "", submitting: false } }));
  }
  function closeReject(rowId) {
    setRejectState((prev) => ({ ...prev, [rowId]: { open: false, text: "", submitting: false } }));
  }
  function setRejectText(rowId, text) {
    setRejectState((prev) => ({ ...prev, [rowId]: { ...prev[rowId], text } }));
  }
  async function submitReject(row) {
    const rs = rejectState[row.id] || {};
    const reason = (rs.text || "").trim();
    if (!reason) { showNotification({ message: "Please enter a reason.", type: "warning" }); return; }
    setRejectState((prev) => ({ ...prev, [row.id]: { ...prev[row.id], submitting: true } }));
    try {
      await axios.post(
        `${PYTHON_BASE_URL}/deviations/admin/reject/${row.id}`,
        { reason, user_id: USER_ID, company_id: COMPANY_ID },
        { headers: { ...getAuthHeaders(), "Content-Type": "application/json" } }
      );
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      closeReject(row.id);
    } catch (e) {
      console.error("Reject failed:", e);
      showNotification({ message: e?.response?.data?.error || e?.message || "Failed to reject.", type: "error" });
      setRejectState((prev) => ({ ...prev, [row.id]: { ...prev[row.id], submitting: false } }));
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pmo-page-header flex-shrink-0">
        <h1 className="pmo-page-title">Company Deviations</h1>
        <p className="pmo-page-subtitle">Review and approve deviation reports from managers</p>
      </div>

      {/* Filter */}
      <div className="px-6 mb-4 flex-shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Sheet Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Filter by Sheet
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input w-full"
            >
              {sheetOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filter !== "All" || startDate || endDate) && (
          <div className="mt-3">
            <button
              onClick={() => {
                setFilter("All");
                setStartDate("");
                setEndDate("");
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pmo-card p-8 text-center text-slate-500">
            No deviations found.
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-slate-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} deviations
            </div>
            <div className="space-y-4">
              {pagedRows.map((r) => {
                const rd = (r && typeof r.row_data === "object" && r.row_data) || {};
                const flag = deriveFlag(r);
                const context = getContextFor(r);
                const sd = Number(rd.start_delay ?? rd["start_delay"]);
                const dd = Number(rd.duration_deviation ?? rd["duration_deviation"]);
                const delayExtra = [
                  !Number.isNaN(sd) && sd > 0 ? `Start delay: ${sd} day(s)` : null,
                  !Number.isNaN(dd) && dd > 0 ? `Duration delay: ${dd} day(s)` : null,
                ].filter(Boolean).join(" — ");

                const managerReason = r.review_reason && r.review_reason.toString().trim();
                const rs = rejectState[r.id] || {};

                const statusClass =
                  r.review_status === "Approved" ? "pmo-badge-success" :
                  r.review_status === "Not Approved" ? "pmo-badge-danger" :
                  r.review_status === "Reviewed" ? "pmo-badge-info" :
                  "pmo-badge-warning";

                const statusLabel =
                  r.review_status === "Approved" ? "Approved" :
                  r.review_status === "Not Approved" ? "Not Approved" :
                  r.review_status === "Reviewed" ? "Ready for Review" :
                  "Pending";

                return (
                  <div key={r.id} className="pmo-card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">#{r.id}</span>
                        <span className={`pmo-badge ${statusClass}`}>{statusLabel}</span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDetectedAt(r.detected_at)}</span>
                    </div>

                    <div className="space-y-3">
                      <Row><Label>Sheet</Label><Value>{r.sheet || "—"}</Value></Row>
                      <Row>
                        <Label>Flag</Label>
                        <Value>
                          {flag}
                          {delayExtra && <span className="text-red-600 ml-1">— {delayExtra}</span>}
                        </Value>
                      </Row>
                      <Row><Label>Context</Label><Value>{context}</Value></Row>
                      <Row>
                        <Label>Manager Reason</Label>
                        <Value className={managerReason ? "text-emerald-700 font-medium" : "text-red-600 font-medium"}>
                          {managerReason || "Awaiting manager input"}
                        </Value>
                      </Row>
                    </div>

                    {rs.open && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <label className="block text-sm font-medium text-red-700 mb-1">
                          Reason for Not Approved <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          className="w-full border border-red-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                          rows={3}
                          placeholder="Enter reason..."
                          value={rs.text || ""}
                          onChange={(e) => setRejectText(r.id, e.target.value)}
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <button
                            onClick={() => closeReject(r.id)}
                            className="px-3 py-1.5 rounded text-sm text-slate-600 border border-slate-300 hover:bg-slate-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => submitReject(r)}
                            disabled={rs.submitting}
                            className="px-3 py-1.5 rounded text-sm text-white font-medium disabled:opacity-50"
                            style={{ backgroundColor: "#c24841" }}
                          >
                            {rs.submitting ? "Submitting…" : "Confirm Not Approved"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      {!canActOn(r) && (
                        <p className="text-xs text-amber-600 mb-2 text-right">
                          Awaiting manager response — cannot act yet.
                        </p>
                      )}
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleApprove(r)}
                          disabled={!canActOn(r)}
                          className="px-4 py-2 rounded-md text-white text-sm font-medium shadow disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "#2f7a3d" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openReject(r.id)}
                          disabled={!canActOn(r)}
                          className="px-4 py-2 rounded-md text-white text-sm font-medium shadow disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "#c24841" }}
                        >
                          Not Approved
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-md border text-sm font-medium disabled:opacity-40 hover:bg-slate-100"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-600">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 rounded-md border text-sm font-medium disabled:opacity-40 hover:bg-slate-100"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}