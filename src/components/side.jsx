/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HiMenuAlt3 } from "react-icons/hi";
import "./notification styles/Layout.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when clicking a link (on mobile)
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button: fixed top-left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 text-[#478560] text-3xl p-1 rounded-md bg-white shadow-md focus:outline-none"
        aria-label="Toggle Sidebar"
      >
        <HiMenuAlt3 />
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar bg-white shadow-md fixed top-0 left-0 z-40 h-full w-64 p-6
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <h3 className="sidebar-title text-xl font-semibold text-[#478560]">Menu</h3>
        <ul className="sidebar-links space-y-6 mt-6">
          <li>
            <Link to="/deviation-dashboard" onClick={handleLinkClick} className="hover:text-[#2c6a36]">
              Dashboard
            </Link>
          </li>
          {/* <li><Link to="/view" onClick={handleLinkClick}>All Deviations</Link></li> */}
          <li>
            <Link to="/history" onClick={handleLinkClick} className="hover:text-[#2c6a36]">
              History
            </Link>
          </li>
          <li>
            <Link to="/pmsettings" onClick={handleLinkClick} className="hover:text-[#2c6a36]">
              Settings
            </Link>
          </li>
          <li>
            <Link to="/notification" onClick={handleLinkClick} className="hover:text-[#2c6a36]">
              Notification
            </Link>
          </li>          
        </ul>
      </div>
    </>
  );
}
