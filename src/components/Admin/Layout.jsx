/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuBell,
  LuLogOut,
  LuHistory,
  LuShield,
  LuChartBar,
  LuUser,
  LuChevronDown,
} from "react-icons/lu";
import "../../styles/Layout.css";
import { unsubscribeFromPush } from "../../Utilities/pushNotifications";

// ---- Top Navbar ----
function TopNavbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user?.name || "Admin";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    setOpen(false);
    const token = localStorage.getItem("token");
    unsubscribeFromPush(token).catch(() => {});
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("user_id");
      localStorage.removeItem("companyId");
    } catch (e) {}
    navigate("/", { replace: true });
  };

  return (
    <nav className="pmo-navbar">
      <div className="pmo-navbar-content">
        <Link to="/view" className="pmo-logo">
          <div className="pmo-logo-icon">
            <LuShield size={20} />
          </div>
          <span className="pmo-logo-text">Pulse Theta Admin</span>
        </Link>

        <div className="pmo-user-menu">
          <button className="pmo-user-badge" onClick={() => setOpen(v => !v)}>
            <div className="pmo-user-avatar">{userInitials}</div>
            <div className="pmo-user-info">
              <span className="pmo-user-name">{userName}</span>
              <span className="pmo-user-role">{user?.role || "admin"}</span>
            </div>
            <LuChevronDown size={12} className="pmo-user-chevron" />
          </button>

          {open && (
            <>
              <div className="pmo-dropdown-overlay" onClick={() => setOpen(false)} />
              <div className="pmo-dropdown">
                <Link
                  to="/adminsettings"
                  className="pmo-dropdown-item"
                  onClick={() => setOpen(false)}
                >
                  <LuUser size={15} />
                  <span>View Profile</span>
                </Link>
                <button className="pmo-dropdown-item pmo-dropdown-item-danger" onClick={handleLogout}>
                  <LuLogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ---- Bottom Navigation Bar ----
function BottomNavbar() {
  const location = useLocation();

  const navItems = [
    { to: "/view", label: "Dashboard", icon: LuLayoutDashboard },
    { to: "/admin/history", label: "History", icon: LuHistory },
    { to: "/notifications", label: "Alerts", icon: LuBell },
    { to: "/admin/deviation-report", label: "Report", icon: LuChartBar },
  ];

  const isActive = (path) =>
    location.pathname.toLowerCase() === path.toLowerCase() ||
    location.pathname.toLowerCase().startsWith(path.toLowerCase());

  return (
    <div className="pmo-bottom-nav">
      <div className="pmo-bottom-nav-content">
        <nav className="pmo-nav-items">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`pmo-nav-item ${isActive(to) ? "active" : ""}`}
              aria-label={label}
            >
              <Icon className="pmo-nav-icon" />
              <span className="pmo-nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ---- Admin Layout ----
export default function Layout({ children }) {
  return (
    <div className="pmo-layout">
      <TopNavbar />

      <main className="pmo-main-content">
        <div className="pmo-content-container">{children}</div>
      </main>

      <BottomNavbar />
    </div>
  );
}
