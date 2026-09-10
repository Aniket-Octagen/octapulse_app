/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaShieldAlt } from "react-icons/fa";
import { GrUpdate } from "react-icons/gr";
import { API_BASE_URL } from "../../Utilities/config";
import { showNotification } from "../../Utilities/utilities";

function useUser() {
  return useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
}

function Avatar({ user }) {
  const initials = (() => {
    const name = user?.name || user?.full_name || user?.username || user?.email || "AD";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (name.includes("@")) return name[0].toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

  return (
    <div
      style={{
        width: "48px", height: "48px", borderRadius: "50%",
        background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: "1.0625rem",
        boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function AdminAppSettings() {
  const user = useUser();
  const [activeTab, setActiveTab] = useState("profile");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handlePasswordUpdate() {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showNotification({ message: "Please fill in all password fields.", type: "warning" });
      return;
    }
    if (newPassword === oldPassword) {
      showNotification({ message: "New password cannot be the same as the old password.", type: "warning" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification({ message: "Passwords do not match.", type: "warning" });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: oldPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Failed to update password");
      }
      showNotification({ message: "Password updated successfully!", type: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showNotification({ message: err.message, type: "error" });
    }
  }

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header */}
      <div className="pmo-page-header flex-shrink-0">
        <div className="flex items-center gap-4">
          <Avatar user={user} />
          <div className="flex-1 min-w-0">
            <h1 className="pmo-page-title">Settings</h1>
            <p className="pmo-page-subtitle">{user?.name || "Administrator"}</p>
          </div>
          {user?.company_name && (
            <span className="pmo-badge pmo-badge-success">{user.company_name}</span>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <FaUser className="inline mr-1.5 mb-0.5" size={12} /> Profile
        </button>
        <button
          className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <FaShieldAlt className="inline mr-1.5 mb-0.5" size={12} /> Security
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-6">
        {activeTab === "profile" && (
          <motion.section
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <div className="pmo-card">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <FaUser className="text-emerald-600 text-lg" />
                <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
              </div>

              <div className="space-y-0 divide-y divide-slate-50">
                {[
                  { label: "Business Name", value: user?.name },
                  { label: "Email", value: user?.email, mono: true },
                  { label: "Company", value: user?.company_name },
                  { label: "Company ID", value: user?.company_id != null ? String(user.company_id) : null, mono: true },
                  { label: "Role", value: user?.role ? user.role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : null },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-baseline gap-3 py-3">
                    <span
                      className="text-xs font-semibold text-slate-400 uppercase tracking-wide"
                      style={{ minWidth: "5.5rem", flexShrink: 0 }}
                    >
                      {label}
                    </span>
                    <span className={`text-sm font-medium text-slate-900 flex-1 min-w-0 break-all ${mono ? "font-mono text-xs" : ""}`}>
                      {value || <span className="text-slate-300">N/A</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === "security" && (
          <motion.section
            key="security"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <div className="pmo-card">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <FaShieldAlt className="text-emerald-600 text-lg" />
                <h2 className="text-lg font-semibold text-slate-900">Security Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Old Password</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="input"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    autoComplete="new-password"
                  />
                </div>

                <button onClick={handlePasswordUpdate} className="btn-primary flex items-center gap-2">
                  <GrUpdate /> Update Password
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
