/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
// components/ForgotPasswordModal.jsx
import React, { useState } from "react";
import { API_BASE_URL } from "../Utilities/config";

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || "Failed to send reset link.");
      }

      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">
          Reset Your Password
        </h2>

        {!sent ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter your registered email"
              required
            />
            <button
              onClick={handleReset}
              className="w-full bg-[#59A472] text-white py-2 rounded hover:bg-green-600"
            >
              Send Reset Link
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </>
        ) : (
          <p className="text-center text-green-600 font-medium">
            ✅ Reset link has been sent to your email.
          </p>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Still need help?</p>
          <p>
            Contact Admin:{" "}
            <a
              href="mailto:admin@thetadynamics.io"
              className="text-blue-600 underline"
            >
              admin@thetadynamics.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
