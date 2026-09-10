/* eslint-disable no-unused-vars */
// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { API_BASE_URL } from "../Utilities/config";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Reset failed");
      }

      setMessage("✅ Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };

  useEffect(() => {
    if (!token) {
      setMessage("❌ Invalid or missing token.");
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Set New Password
        </h2>

        {message && (
          <p className="text-center text-sm text-red-500 mb-4">{message}</p>
        )}

        {/* New Password Field with Toggle */}
        <div className="relative mb-3">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            className="w-full p-2 border border-gray-300 rounded pr-10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
          >
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Confirm Password (Always Hidden) */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full mb-3 p-2 border border-gray-300 rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-[#478560] text-white py-2 rounded hover:bg-green-600"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
