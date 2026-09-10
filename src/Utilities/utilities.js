// src/utils/Utilities.js
import { toast } from "react-toastify";

/**
 * Show a toast notification.
 *
 * - type: 'success' = ✅ green
 * - type: 'warning' = ⚠️ yellow
 * - type: 'error' = ❌ red
 * - type: 'info' = ℹ️ blue
 * - type: 'pending' = ⏳ loading spinner (useful for async actions)
 *
 * @param {Object} config
 * @param {'success' | 'error' | 'warning' | 'info' | 'default' | 'pending'} config.type
 * @param {string} config.message
 * @param {number} [config.duration=3000]
 * @returns {string|undefined} toastId for 'pending', nothing for others
 */
export const showNotification = ({
  message,
  type = "default",
  duration = 3000,
}) => {
  if (type === "pending") {
    return toast.loading(message, {
      position: "top-center",
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
    });
  }

  toast(message, {
    type,
    position: "top-center",
    autoClose: duration,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Update an existing loading toast by ID
 *
 * @param {string} toastId - The toast ID returned from showNotification (type: 'pending')
 * @param {Object} config
 * @param {string} config.message - Updated message
 * @param {'success' | 'warning' | 'error' | 'info'} [config.type='success']
 * @param {number} [config.duration=3000]
 */
export const updateNotification = (
  toastId,
  { message, type = "success", duration = 3000 }
) => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: duration,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};
