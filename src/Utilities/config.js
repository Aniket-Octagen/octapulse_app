// Backend server configuration
export const PYTHON_BASE_URL = 
  import.meta?.env?.VITE_BACKEND_URL || "https://pmo-backend.thetadynamics.io/api";

export const API_BASE_URL = PYTHON_BASE_URL;