import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSignIn = async () => {
      if (!email || !password) {
        setError("Please fill in all fields.");
        return;
      }
    
      try {
        const response = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"  // tell backend you're sending JSON
          },
          body: JSON.stringify({ email, password })
        });
    
        const data = await response.json();  // read the backend's response
    
        if (response.ok) {
          // login success — backend returned 200
          console.log("Logged in!", data);
          // navigate to dashboard, save token, etc.
        } else {
          // login failed — backend returned 401 or 400
          setError(data.message || "Invalid credentials.");
        }
    
      } catch (err) {
        // network error — server is down, no internet, etc.
        setError("Server error. Please try again.");
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
            />
            
            <button
              type="button"
              className="dvs-field__toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
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
  
          <div className="dvs-helpers">
            
            <button type="button" className="dvs-forgot" onClick={() => navigate("/forgot-password")}>Forgot password?</button>
          </div>
          
          {error && <p className="dvs-error">{error}</p>}
  
          <button type="button" className="dvs-btn" onClick={handleSignIn}>
            Sign In
          </button>
          
          <p className="rg-signup-hint">
              Don't have an account?{" "}
              <button type="button" className="rg-signup-link" onClick={() => navigate("/register")}>
                Sign Up
              </button>
          </p>
          <div className="dvs-divider" />
          <p className="dvs-footer">DriverVigil™ – Advanced Driver Monitoring Technology</p>
          
        </div>
      </div>
    );
  }