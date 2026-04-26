import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email.";

    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6)
      e.password = "Password must be at least 6 characters.";

    if (!form.confirmPassword)
      e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";

    if (!form.phoneNumber.trim())
      e.phoneNumber = "Phone number is required.";
    else if (!/^\+?[1-9]\d{1,14}$/.test(form.phoneNumber))
      e.phoneNumber = "Enter a valid phone number.";

    return e;
  };

  const handleSubmit = async () => {
    console.log("Button clicked!");
    
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8002/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullName,
          email: form.email,
          phone: form.phoneNumber,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setErrors({ email: data.message || data.error || "Registration failed." });
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({ email: "Server error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rg-bg">
      {[...Array(12)].map((_, i) => (
        <span key={i} className={`rg-dot rg-dot--${i + 1}`} />
      ))}

      <div className="rg-card">
        {/* Back button */}
        <button
          type="button"
          className="rg-back"
          onClick={() => navigate("/")}
          aria-label="Go back"
        >
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
              <span className="rg-field__icon">👤</span>
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
              <span className="rg-field__icon">📧</span>
              <input
                type="email"
                className="rg-field__input"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
            {errors.email && <p className="rg-error">{errors.email}</p>}

            {/* Phone Number */}
            <div className={`rg-field ${errors.phoneNumber ? "rg-field--error" : ""}`}>
              <span className="rg-field__icon">📱</span>
              <input
                type="tel"
                className="rg-field__input"
                placeholder="Phone number"
                value={form.phoneNumber}
                onChange={(e) => update("phoneNumber", e.target.value)}
              />
            </div>
            {errors.phoneNumber && <p className="rg-error">{errors.phoneNumber}</p>}

            {/* Password */}
            <div className={`rg-field ${errors.password ? "rg-field--error" : ""}`}>
              <span className="rg-field__icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                className="rg-field__input"
                placeholder="Password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <button
                type="button"
                className="rg-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <p className="rg-error">{errors.password}</p>}

            {/* Confirm Password */}
            <div className={`rg-field ${errors.confirmPassword ? "rg-field--error" : ""}`}>
              <span className="rg-field__icon">🔒</span>
              <input
                type={showConfirm ? "text" : "password"}
                className="rg-field__input"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
              <button
                type="button"
                className="rg-field__toggle"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.confirmPassword && <p className="rg-error">{errors.confirmPassword}</p>}

            {/* Create Account Button */}
            <button
              type="button"
              className="rg-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
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
            <div className="rg-success__icon">✅</div>
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