/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { FiUser, FiPhone, FiMapPin, FiMail, FiLock, FiEye, FiEyeOff, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { showNotification } from "../Utilities/utilities";
import logo from "./assests/logo.png";
import { API_BASE_URL } from "../Utilities/config";

const AppRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone_no: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/companies`);
        if (!res.ok) throw new Error("Failed to load companies");
        const data = await res.json();
        if (Array.isArray(data)) setCompanies(data);
      } catch {
        // leave empty; backend can default
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!companyId) {
      return showNotification({ title: "Company Required", message: "Please select a company to register under.", type: "warning" });
    }
    if (formData.password !== formData.confirmPassword) {
      return showNotification({ title: "Password Mismatch", message: "Password and Confirm Password must match", type: "warning" });
    }
    if (!/^\d{10}$/.test(formData.phone_no)) {
      return showNotification({ title: "Invalid Phone Number", message: "Phone number must be exactly 10 digits", type: "warning" });
    }
    if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
      return showNotification({ title: "Invalid Email", message: "Enter valid Gmail format", type: "warning" });
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return showNotification({ title: "Weak Password", message: "Password must include at least 1 letter, 1 number, 1 symbol, and be at least 8 characters.", type: "warning" });
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone_no: formData.phone_no,
      address: formData.address,
      company_id: companyId,
    };

    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, payload);
      showNotification({ title: "Registration Successful", message: "Your account has been created and is pending activation.", type: "success" });
      navigate("/login");
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Registration failed!";
      setError(errorMessage);
      showNotification({ title: "Registration Failed", message: errorMessage, type: "danger" });
    }
  };

  const fields = [
    { name: "name", placeholder: "Business Name", icon: FiUser, type: "text" },
    { name: "phone_no", placeholder: "Contact Number (10 digits)", icon: FiPhone, type: "tel" },
    { name: "address", placeholder: "Address", icon: FiMapPin, type: "text" },
    { name: "email", placeholder: "Gmail Address", icon: FiMail, type: "email" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)" }}
    >
      {/* Decorative blobs */}
      <div aria-hidden="true" style={{ position: "absolute", top: "-80px", right: "-60px", width: "260px", height: "260px", background: "radial-gradient(circle, rgba(167,243,208,0.55) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      <div aria-hidden="true" style={{ position: "absolute", bottom: "-60px", left: "-40px", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(110,231,183,0.35) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

      <div
        className="relative w-full"
        style={{
          maxWidth: "400px",
          background: "white",
          borderRadius: "1.5rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          border: "1px solid rgba(167,243,208,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: "4px", background: "linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)" }} />

        {/* Logo */}
        <div className="flex flex-col items-center pt-7 pb-4 px-6">
          <div style={{ width: "60px", height: "60px", borderRadius: "1rem", overflow: "hidden", boxShadow: "0 4px 12px rgba(5,150,105,0.18)", border: "2px solid var(--emerald-100)", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={logo} alt="Pulse Theta" style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
          </div>
          <h1 className="mt-3 text-lg font-bold text-slate-900" style={{ letterSpacing: "-0.3px" }}>Create Account</h1>
          <p className="text-sm text-slate-500 mt-0.5">Join <span className="font-semibold" style={{ color: "var(--emerald-700)" }}>Theta Dynamics</span></p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-7 space-y-3">
          {fields.map(({ name, placeholder, icon: Icon, type }) => (
            <div key={name} className="relative">
              <Icon
                size={15}
                style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)", pointerEvents: "none" }}
              />
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={formData[name]}
                onChange={handleChange}
                required
                className="input"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
          ))}

          {/* Company selector */}
          <div className="relative">
            <FiUsers size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)", pointerEvents: "none" }} />
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              className="input"
              style={{ paddingLeft: "2.25rem" }}
            >
              <option value="">Select Company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Password */}
          <div className="relative">
            <FiLock size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)", pointerEvents: "none" }} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input"
              style={{ paddingLeft: "2.25rem", paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--slate-400)", display: "flex", alignItems: "center", padding: "4px" }}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          {/* Confirm password */}
          <div className="relative">
            <FiLock size={15} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--slate-400)", pointerEvents: "none" }} />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input"
              style={{ paddingLeft: "2.25rem" }}
            />
          </div>

          {error && (
            <p className="text-sm font-medium" style={{ color: "#dc2626" }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            style={{ height: "46px", borderRadius: "0.75rem", fontSize: "0.9375rem", marginTop: "0.5rem" }}
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default AppRegister;
