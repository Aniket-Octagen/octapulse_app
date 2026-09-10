/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { PYTHON_BASE_URL } from "../Utilities/config";
import { getCurrentUser } from "../Utilities/auth";
import { IoNotificationsOutline } from "react-icons/io5";
import { LuRefreshCw } from "react-icons/lu";
import { RiMailCheckLine } from "react-icons/ri";

const TYPE_STYLES = {
  success: {
    dot: "var(--emerald-500)",
    border: "#6ee7b7",
    bg: "#f0fdf4",
    badge: { background: "#d1fae5", color: "#065f46" },
  },
  error: {
    dot: "#ef4444",
    border: "#fca5a5",
    bg: "#fff5f5",
    badge: { background: "#fee2e2", color: "#991b1b" },
  },
  warning: {
    dot: "#f59e0b",
    border: "#fcd34d",
    bg: "#fffbeb",
    badge: { background: "#fef3c7", color: "#92400e" },
  },
  info: {
    dot: "#3b82f6",
    border: "#93c5fd",
    bg: "#eff6ff",
    badge: { background: "#dbeafe", color: "#1e3a8a" },
  },
};

const typeStyle = (type) => TYPE_STYLES[type] || TYPE_STYLES.info;

export default function Notification() {
  const [items, setItems] = useState([]);
  const [onlyUnread, setOnlyUnread] = useState(true);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const { role } = getCurrentUser();
  const isAdmin = role === "admin";

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchCount = useCallback(async () => {
    try {
      const { data } = await axios.get(`${PYTHON_BASE_URL}/notifications`, {
        headers: getHeaders(),
      });
      setUnread(data.unread_count || 0);
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${PYTHON_BASE_URL}/notifications`, {
        headers: getHeaders(),
      });
      let notifications = data.notifications || [];
      if (onlyUnread) notifications = notifications.filter((n) => !n.read);
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setItems(notifications);
      setUnread(data.unread_count || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [onlyUnread]);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    fetchList();
    fetchCount();
    const id = setInterval(fetchCount, 15000);
    return () => clearInterval(id);
  }, [fetchList, fetchCount]);

  const markAllRead = async () => {
    try {
      await axios.put(`${PYTHON_BASE_URL}/notifications/read-all`, {}, { headers: getHeaders() });
      await fetchList();
      await fetchCount();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const markSelectedRead = async (id) => {
    try {
      await axios.put(`${PYTHON_BASE_URL}/notifications/${id}/read`, {}, { headers: getHeaders() });
      await fetchList();
      await fetchCount();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${PYTHON_BASE_URL}/notifications/${id}`, { headers: getHeaders() });
      await fetchList();
      await fetchCount();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const clearRead = async () => {
    try {
      await axios.delete(`${PYTHON_BASE_URL}/notifications/clear-read`, { headers: getHeaders() });
      await fetchList();
      await fetchCount();
    } catch (error) {
      console.error("Failed to clear read notifications:", error);
    }
  };

  const clearAll = async () => {
    try {
      await axios.delete(`${PYTHON_BASE_URL}/notifications/clear-all`, { headers: getHeaders() });
      await fetchList();
      await fetchCount();
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const readCount = items.filter((n) => n.read).length;

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="pmo-page-header">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="pmo-page-title flex items-center gap-2">
              <IoNotificationsOutline />
              Notifications
              {unread > 0 && <span className="count-badge">{unread}</span>}
            </h1>
            <p className="pmo-page-subtitle">
              {isAdmin ? "Admin · all alerts" : "Your alerts"}
            </p>
          </div>
          <button onClick={fetchList} className="icon-btn" aria-label="Refresh">
            <LuRefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Filter + action row */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        {/* Unread toggle */}
        <div className="toggle-wrap" onClick={() => setOnlyUnread((v) => !v)}>
          <div className={`toggle-track${onlyUnread ? " on" : ""}`}>
            <div className="toggle-knob" />
          </div>
          <span className="toggle-label">Unread only</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="btn-primary action-btn"
            style={{ opacity: unread === 0 ? 0.5 : 1 }}
          >
            <RiMailCheckLine size={13} />
            <span>Mark Read</span>
          </button>

          <button
            onClick={clearRead}
            disabled={readCount === 0 && !onlyUnread}
            className="action-btn action-btn-danger"
            style={{ opacity: readCount === 0 && !onlyUnread ? 0.5 : 1 }}
          >
            Clear Read
          </button>

          {isAdmin && (
            <button
              onClick={clearAll}
              disabled={items.length === 0}
              className="action-btn action-btn-danger"
              style={{ opacity: items.length === 0 ? 0.5 : 1 }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin"
            style={{ width: "32px", height: "32px", border: "3px solid var(--emerald-100)", borderTopColor: "var(--emerald-500)", borderRadius: "50%" }}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="pmo-card">
          <div className="empty-state">
            <IoNotificationsOutline size={32} className="empty-state-icon" />
            <p>{onlyUnread ? "No unread notifications." : "No notifications found."}</p>
          </div>
        </div>
      ) : (
        <div className="notif-list">
          {items.map((n) => {
            const meta = n.metadata || {};
            const ts = typeStyle(n.type);
            return (
              <div
                key={n.id}
                className={`notif-card${n.read ? " read" : ""}`}
                style={{ borderLeftColor: ts.border, backgroundColor: n.read ? "white" : ts.bg }}
              >
                <div
                  className="notif-dot"
                  style={{ background: n.read ? "var(--slate-300)" : ts.dot }}
                />
                <div className="notif-body">
                  <div className="notif-title-row">
                    <p className="notif-title">{n.title}</p>
                    {n.type && (
                      <span className="notif-type-badge" style={ts.badge}>{n.type}</span>
                    )}
                  </div>

                  <p className="notif-message">{n.message}</p>

                  {meta?.filename && (
                    <p className="notif-meta">
                      {meta.filename} · {meta.success_count || 0}/{meta.total_sheets || 0} sheets
                    </p>
                  )}

                  <p className="notif-time">
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
                          year: "numeric", hour: "2-digit", minute: "2-digit",
                        })
                      : ""}
                  </p>

                  <div className="notif-actions">
                    {!n.read && (
                      <button onClick={() => markSelectedRead(n.id)} className="notif-btn">
                        Mark Read
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="notif-btn notif-btn-danger">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
