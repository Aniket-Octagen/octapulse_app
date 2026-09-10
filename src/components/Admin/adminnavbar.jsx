/* eslint-disable no-unused-vars */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import "../notification styles/Layout.css";
import logo from "../assests/logo.png";
import { API_BASE_URL } from "../../Utilities/config";

export default function AdminNavbar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const companyId = user?.company_id || localStorage.getItem("companyId");

  const getInitials = (u) => {
    if (!u) return "TA";
    const name = u.name || u.full_name || u.username || u.email || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (name.includes("@")) return name[0].toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user);

  return (
    <nav className="w-full bg-white shadow-sm border-b">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center px-4 py-2">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-4">
          <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
          <h2 className="text-lg font-semibold text-gray-800">Deviation Tracker</h2>
        </div>

        {/* Right: Profile */}
        <div className="flex items-center gap-4">
          <Link to="/adminsettings" title={user?.name || user?.email || "Admin"}>
            {user?.logo && companyId ? (
              <motion.img
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                src={`${API_BASE_URL}/uploads/${companyId}/logos/${user.logo}`}
                alt="User Logo"
                className="w-10 h-10 rounded-full object-cover border cursor-pointer"
              />
            ) : (
              <motion.div
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="w-10 h-10 bg-[#478560] text-white rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer select-none"
              >
                {initials}
              </motion.div>
            )}
          </Link>
        </div>
        </div>
      </div>
    </nav>
  );
}
