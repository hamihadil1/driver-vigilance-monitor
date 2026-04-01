import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          // confirmPassword is NOT sent — backend doesn't need it
          // validation already passed on frontend
        })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setSubmitted(true); // ← now real, account was actually created
      } else {
        setErrors({ email: data.message || "Registration failed." });
      }
  
    } catch (err) {
      setErrors({ email: "Server error. Please try again." });
    }
  };

  return (
    <div className="rg-bg">
      {[...Array(12)].map((_, i) => (
        <span key={i} className={`rg-dot rg-dot--${i + 1}`} />
      ))}

      <div className="rg-card">
        {/* Back button */}
        <button type="button" className="rg-back" onClick={() => navigate("/")} aria-label="Go back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Sign In
        </button>

        {/* Logo */}
        <div className="rg-logo-wrap">
          <div className="rg-logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="2.5" />
                
                {/* Eye shape */}
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

        {!submitted ? (
          <>
            <h1 className="rg-title">Create Account</h1>
            <p className="rg-subtitle">Join the Driver Vigilance System today</p>

            {/* Full Name */}
            <div className={`rg-field ${errors.fullName ? "rg-field--error" : ""}`}>
              <span className="rg-field__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </span>
              <input
                type="text"
                className="rg-field__input"
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </div>
            {errors.fullName && <p className="rg-error">{errors.fullName}</p>}

            {/* Email */}
            <div className={`rg-field ${errors.email ? "rg-field--error" : ""}`}>
              <span className="rg-field__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="2,4 12,13 22,4" />
                </svg>
              </span>
              <input
                type="email"
                className="rg-field__input"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            {errors.email && <p className="rg-error">{errors.email}</p>}

            {/* Password */}
            <div className={`rg-field ${errors.password ? "rg-field--error" : ""}`}>
              <span className="rg-field__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                className="rg-field__input"
                placeholder="Password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <button type="button" className="rg-field__toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C6 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="rg-error">{errors.password}</p>}

            {/* Confirm Password */}
            <div className={`rg-field ${errors.confirmPassword ? "rg-field--error" : ""}`}>
              <span className="rg-field__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <input
                type={showConfirm ? "text" : "password"}
                className="rg-field__input"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
              <button type="button" className="rg-field__toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C6 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="rg-error">{errors.confirmPassword}</p>}

            <button type="button" className="rg-btn" onClick={handleSubmit}>
              Create Account
            </button>

            <p className="rg-signin-hint">
              Already have an account?{" "}
              <button type="button" className="rg-signin-link" onClick={() => navigate("/")}>
                Sign In
              </button>
            </p>
          </>
        ) : (
          <div className="rg-success">
            <div className="rg-success__icon">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="2.5" opacity="0.4" />
                <polyline points="20,33 28,41 44,24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="rg-title">Account Created!</h1>
            <p className="rg-subtitle">
              Welcome, <span className="rg-success__name">{form.fullName}</span>!<br />
              Your account has been successfully created.
            </p>
            <button type="button" className="rg-btn" onClick={() => navigate("/")}>
              Go to Sign In
            </button>
          </div>
        )}

        <div className="rg-divider" />
        <p className="rg-footer">DriverVigil™ – Advanced Driver Monitoring Technology</p>
      </div>
    </div>
  );
}
