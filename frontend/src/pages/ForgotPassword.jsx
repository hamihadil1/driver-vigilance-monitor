import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // "email" | "sent"
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setError("");
        setStep("sent"); // ← now it's real, email was actually sent
      } else {
        setError(data.message || "Something went wrong.");
      }
  
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

//   const handleBack = () => {
//     window.history.back();
//   };
  const handleBack = () => navigate("/");
  
  return (
    <div className="fp-bg">
      {[...Array(12)].map((_, i) => (
        <span key={i} className={`fp-dot fp-dot--${i + 1}`} />
      ))}

      <div className="fp-card">
        {/* Back button */}
        <button type="button" className="fp-back" onClick={handleBack} aria-label="Go back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Sign In
        </button>

        {/* Logo */}
        <div className="fp-logo-wrap">
          <div className="fp-logo">
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

        {step === "email" ? (
          <>
            <h1 className="fp-title">Forgot Password?</h1>
            <p className="fp-subtitle">
              No worries — enter your email and we'll send you a reset link.
            </p>

            {/* Email field */}
            <div className="fp-field">
              <span className="fp-field__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <polyline points="2,4 12,13 22,4" />
                </svg>
              </span>
              <input
                type="email"
                className="fp-field__input"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {error && <p className="fp-error">{error}</p>}

            <button type="button" className="fp-btn" onClick={handleSubmit}>
              Send Reset Link
            </button>
          </>
        ) : (
          <div className="fp-success">
            {/* Success icon */}
            <div className="fp-success__icon">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="28" stroke="white" strokeWidth="2.5" opacity="0.4" />
                <polyline points="20,33 28,41 44,24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h1 className="fp-title">Check Your Inbox</h1>
            <p className="fp-subtitle">
              A password reset link has been sent to<br />
              <span className="fp-success__email">{email}</span>
            </p>

            <p className="fp-success__hint">
              Didn't receive it? Check your spam folder or{" "}
              <button
                type="button"
                className="fp-resend"
                onClick={() => setStep("email")}
              >
                try again
              </button>
              .
            </p>
          </div>
        )}

        <div className="fp-divider" />
        <p className="fp-footer">DriverVigil™ – Advanced Driver Monitoring Technology</p>
      </div>
    </div>
  );
}
