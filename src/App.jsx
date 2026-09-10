// App.jsx

// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

import DeviationsDashboard from "./components/Dashboard";
import DeclinedDeviations from "./components/Declined";
import AllDeviations from "./components/Admin/Admin";
import DeviationLayout from "./components/Main";
import PMSettings from "./components/PMSettings";
import Layout from "./components/Admin/Layout";
import AdminAppSettings from "./components/Admin/adminsettings";
import AppLogin from "./components/applogin";
import ResetPassword from "./components/ResetPassword";
import Notification from "./components/Notification";
import DeviationReport from "./components/Admin/DeviationReport";

// Redirect to dashboard if already logged in
function AuthRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (token) {
    return <Navigate to={user?.role === "admin" ? "/view" : "/deviation-dashboard"} replace />;
  }
  return children;
}

// Redirect to login if not authenticated; adminOnly/userOnly enforce role separation
function ProtectedRoute({ children, adminOnly, userOnly }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token) return <Navigate to="/" replace />;
  if (adminOnly && user?.role !== "admin") return <Navigate to="/deviation-dashboard" replace />;
  if (userOnly && user?.role === "admin") return <Navigate to="/view" replace />;
  return children;
}

const App = () => {
  useEffect(() => {
    const setupStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        await StatusBar.show();
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#1F2937" });
      } catch (error) {
        console.error("Error setting up StatusBar:", error);
      }
    };
    setupStatusBar();
  }, []);

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} />
      <Routes>
        {/* USER layout */}
        <Route
          path="/deviation-dashboard"
          element={
            <ProtectedRoute userOnly>
              <DeviationLayout><DeviationsDashboard /></DeviationLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute userOnly>
              <DeviationLayout><DeclinedDeviations /></DeviationLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pmsettings"
          element={
            <ProtectedRoute userOnly>
              <DeviationLayout><PMSettings /></DeviationLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notification"
          element={
            <ProtectedRoute userOnly>
              <DeviationLayout><Notification /></DeviationLayout>
            </ProtectedRoute>
          }
        />

        {/* ADMIN layout */}
        <Route
          path="/view"
          element={
            <ProtectedRoute adminOnly>
              <Layout><AllDeviations /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute adminOnly>
              <Layout><Notification /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/history"
          element={
            <ProtectedRoute adminOnly>
              <Layout><DeclinedDeviations /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminsettings"
          element={
            <ProtectedRoute adminOnly>
              <Layout><AdminAppSettings /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/deviation-report"
          element={
            <ProtectedRoute adminOnly>
              <Layout><DeviationReport /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Auth */}
        <Route path="/" element={<AuthRoute><AppLogin /></AuthRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  );
};

export default App;
