import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";
import api from "../services/api";       

export default function AuthPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let data;
      
      // إذا كان البريد الإلكتروني هو admin@test.com، استخدم مسار admin/login
      if (email === 'admin@test.com') {
        const response = await fetch('http://localhost:8002/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        data = await response.json();
      } else {
        data = await api.login(email, password);
      }

      if (data.access) {
        localStorage.setItem("token", data.access);
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("userId", data.email );
        localStorage.setItem("userName", data.name || "");

        console.log("✅ Logged in successfully!", data);

        if (data.role === "admin") {
          navigate("/dashboard");
        } else if (data.role === "driver") {
          navigate("/driver-dashboard");
        } else {
          setError("Unknown user role");
        }
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dvs-bg">
      {[...Array(12)].map((_, i) => (
        <span key={i} className={`dvs-dot dvs-dot--${i + 1}`} />
      ))}

      <div className="dvs-card">
        {/* Logo */}
        <div className="dvs-logo-wrap">
          <div className="dvs-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="2.5" />
              <path d="M17 24 Q24 16.5 31 24 Q24 31.5 17 24Z" fill="white" />
              <circle cx="24" cy="24" r="3.2" fill="#7C3AED" />
              <circle cx="24" cy="24" r="1.4" fill="white" />
              <line x1="24" y1="6" x2="24" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="34" x2="24" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="6" y1="24" x2="14" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="34" y1="24" x2="42" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h1 className="dvs-title">Driver Vigilance System</h1>
        <p className="dvs-subtitle">Real-time driver monitoring &amp; alert system</p>

        {/* Email */}
        <div className="dvs-field">
          <span className="dvs-field__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="2,4 12,13 22,4" />
            </svg>
          </span>
          <input
            type="email"
            className="dvs-field__input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="dvs-field">
          <span className="dvs-field__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            className="dvs-field__input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="dvs-field__toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Forgot Password */}
        <div className="dvs-helpers">
          <button
            type="button"
            className="dvs-forgot"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot password?
          </button>
        </div>

        {error && <p className="dvs-error">{error}</p>}

        <button
          type="button"
          className="dvs-btn"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="rg-signup-hint">
          Don't have an account?{" "}
          <button
            type="button"
            className="rg-signup-link"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </button>
        </p>

        <div className="dvs-divider" />
        <p className="dvs-footer">DriverVigil™ – Advanced Driver Monitoring Technology</p>
      </div>
    </div>
  );
}