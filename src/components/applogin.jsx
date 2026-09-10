/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "./assests/logo.png";
import { jwtDecode } from "jwt-decode";
import { showNotification } from "../Utilities/utilities";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { API_BASE_URL } from "../Utilities/config";
import { subscribeToPush } from "../Utilities/pushNotifications";

const Spinner = ({ className = "w-5 h-5" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

const AppLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token, user } = response.data;
      const decoded = jwtDecode(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (user?.id || decoded?.id) localStorage.setItem("user_id", String(user?.id || decoded?.id));
      if (user?.company_id || decoded?.company_id) localStorage.setItem("companyId", String(user?.company_id || decoded?.company_id));
      subscribeToPush(token).catch(() => {});
      if (user.role === "admin") {
        showNotification({ message: `Admin panel ready — ${user.name || "Administrator"}.`, type: "success" });
        setTimeout(() => navigate("/view"), 700);
      } else {
        showNotification({ message: `Dashboard ready, ${user.name || "Manager"}.`, type: "success" });
        setTimeout(() => navigate("/deviation-dashboard"), 700);
      }
    } catch (err) {
      showNotification({ message: err.response?.data?.error || err.response?.data?.message || "Couldn't sign you in — check your credentials.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)" }}
    >
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: "-80px", right: "-60px",
          width: "260px", height: "260px",
          background: "radial-gradient(circle, rgba(167,243,208,0.55) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute", bottom: "-60px", left: "-40px",
          width: "200px", height: "200px",
          background: "radial-gradient(circle, rgba(110,231,183,0.35) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-3" style={{ color: "var(--emerald-600)" }}>
            <Spinner className="w-7 h-7" />
            <span className="text-sm font-semibold">Signing you in…</span>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          maxWidth: "380px",
          background: "white",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(167,243,208,0.6)",
        }}
      >
        {/* Top gradient accent bar */}
        <div style={{ height: "4px", background: "linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)" }} />

        {/* Logo */}
        <div className="flex flex-col items-center pt-7 pb-4 px-6">
          <div
            style={{
              width: "76px", height: "76px",
              borderRadius: "1.125rem",
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(5,150,105,0.2)",
              border: "2px solid var(--emerald-100)",
              background: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <img src={logo} alt="Pulse Theta" style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
          </div>
          <h1 className="mt-3 text-lg font-bold text-slate-900" style={{ letterSpacing: "-0.3px" }}>Welcome back</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sign in to Pulse Theta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-6 pb-7 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or username</label>
            <div className="relative">
              <FiMail
                size={15}
                style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)", pointerEvents: "none" }}
              />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="your@email.com"
                className="input"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <FiLock
                size={15}
                style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)", pointerEvents: "none" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="input"
                style={{ paddingLeft: "2.25rem", paddingRight: "2.75rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--slate-400)", padding: "4px",
                  display: "flex", alignItems: "center",
                }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              disabled={isLoading}
              className="text-sm font-medium"
              style={{ color: "var(--emerald-600)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
            style={{ height: "46px", borderRadius: "0.75rem", fontSize: "0.9375rem" }}
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4" />
                <span>Signing in…</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      {showForgotModal && <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />}
    </div>
  );
};

export default AppLogin;
