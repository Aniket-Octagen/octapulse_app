/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuFileSpreadsheet,
  LuBell,
  LuLogOut,
  LuUser,
  LuChevronDown,
} from "react-icons/lu";
import { TbListDetails } from "react-icons/tb";
import "../styles/Layout.css";
import { unsubscribeFromPush } from "../Utilities/pushNotifications";

// ---- Top Navbar ----
function TopNavbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user?.name || "Manager";
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
    } catch (_) {}
    navigate("/", { replace: true });
  };

  return (
    <nav className="pmo-navbar">
      <div className="pmo-navbar-content">
        <Link to="/deviation-dashboard" className="pmo-logo">
          <div className="pmo-logo-icon">
            <LuFileSpreadsheet size={20} />
          </div>
          <span className="pmo-logo-text">Pulse Theta</span>
        </Link>

        <div className="pmo-user-menu">
          <button className="pmo-user-badge" onClick={() => setOpen(v => !v)}>
            <div className="pmo-user-avatar">{userInitials}</div>
            <div className="pmo-user-info">
              <span className="pmo-user-name">{userName}</span>
              <span className="pmo-user-role">{user?.role || "manager"}</span>
            </div>
            <LuChevronDown size={12} className="pmo-user-chevron" />
          </button>

          {open && (
            <>
              <div className="pmo-dropdown-overlay" onClick={() => setOpen(false)} />
              <div className="pmo-dropdown">
                <Link
                  to="/pmsettings"
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
    { to: "/deviation-dashboard", label: "Dashboard", icon: LuLayoutDashboard },
    { to: "/history", label: "History", icon: TbListDetails },
    { to: "/notification", label: "Alerts", icon: LuBell },
  ];

  const isActive = (path) =>
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

// ---- Main Layout ----
export default function MainLayout({ children }) {
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
