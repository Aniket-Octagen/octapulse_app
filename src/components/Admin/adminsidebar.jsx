/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* adminsidebar.jsx */
import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuLayoutDashboard, LuHistory } from "react-icons/lu";
import { IoSettingsOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { API_BASE_URL } from "../../Utilities/config";

export default function BottomBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const companyId = user?.company_id || localStorage.getItem("companyId");

  const getInitials = (u) => {
    if (!u) return "TA";
    const name = u.name || u.full_name || u.username || u.email || "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (name.includes("@")) return name[0].toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isActive = (path) => location.pathname.toLowerCase().startsWith(path.toLowerCase());

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    navigate("/", { replace: true });
  };

  const items = [
    {
      key: "dashboard",
      type: "link",
      to: "/view",
      label: "Dashboard",
      icon: (active) => (
        <LuLayoutDashboard className={`text-[22px] ${active ? "text-[#478560]" : "text-gray-500"}`} />
      ),
    },
    {
      key: "history",
      type: "link",
      to: "/admin/history",
      label: "History",
      icon: (active) => (
        <LuHistory className={`text-[22px] ${active ? "text-[#478560]" : "text-gray-500"}`} />
      ),
    },
    {
      key: "notification",
      type: "link",
      to: "/notifications",
      label: "Notifications",
      icon: (active) => (
        <LuHistory className={`text-[22px] ${active ? "text-[#478560]" : "text-gray-500"}`} />
      ),
    },
    {
      key: "profile",
      type: "link",
      to: "/adminsettings",
      label: "Profile",
      icon: (active) => {
        if (user?.logo && companyId) {
          return (
            <img
              src={`${API_BASE_URL}/uploads/${companyId}/logos/${user.logo}`}
              alt="User"
              className={`w-[22px] h-[22px] rounded-full object-cover border ${active ? "ring-2 ring-[#478560] ring-offset-1" : ""}`}
            />
          );
        }
        const initials = getInitials(user);
        return initials ? (
          <div
            className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold
                        ${active ? "bg-[#478560] text-white" : "bg-gray-200 text-gray-700"}`}
          >
            {initials}
          </div>
        ) : (
          <IoSettingsOutline className={`text-[22px] ${active ? "text-[#478560]" : "text-gray-500"}`} />
        );
      },
    },
    {
      key: "logout",
      type: "button",
      onClick: handleLogout,
      label: "Logout",
      icon: () => <FiLogOut className="text-[22px] text-gray-500" />,
    },
  ];

  return (
    <div
      className="
        fixed bottom-0 inset-x-0 z-[1000]
        bg-white border-t shadow-md
        pb-[max(env(safe-area-inset-bottom),8px)]
      "
      style={{ height: "64px" }}
      aria-label="Bottom navigation"
    >
      <div className="h-full max-w-md mx-auto px-2">
        {/* Use flex with space-around so all 4 items align evenly */}
        <nav className="h-full w-full flex items-center justify-around">
          {items.map((item) => {
            const active = item.type === "link" ? isActive(item.to) : false;

            const common = (
              <>
                {item.icon(active)}
                <span className={`mt-0.5 text-[11px] ${active ? "text-[#478560] font-medium" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </>
            );

            if (item.type === "button") {
              return (
                <button
                  key={item.key}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center select-none"
                  aria-label={item.label}
                  title={item.label}
                >
                  {common}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.to}
                className="flex flex-col items-center justify-center select-none"
                aria-label={item.label}
                title={item.label}
              >
                {common}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
