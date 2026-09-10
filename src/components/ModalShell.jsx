/* eslint-disable react/prop-types */
// ModalShell.jsx
// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";

export default function ModalShell({ title, onClose, children }) {
  // ESC to close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-lg sm:w-[560px] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border
                   p-5 sm:p-6 m-0 sm:m-6 animate-in fade-in zoom-in-90"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border hover:bg-gray-50"
            aria-label="Close dialog"
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
