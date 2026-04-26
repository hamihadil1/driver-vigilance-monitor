import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./DriverDashboard.css";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isBeingCalled, setIsBeingCalled] = useState(false);
  const [driver, setDriver] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [todayAlerts, setTodayAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isFatigued, setIsFatigued] = useState(false);
  const [lastFaceBox, setLastFaceBox] = useState(null);
  
  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [profileSaved, setProfileSaved] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const lastAlertTimeRef = useRef(0);
  const frameCounterRef = useRef(0);
  const audioRef = useRef(null);

  const activeAlertCount = activeAlerts.length;
  const driverId = localStorage.getItem("userId");

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    if (!token || userRole !== "driver") navigate("/login");
  }, [navigate]);

  // Load FaceAPI
  useEffect(() => {
    const loadFaceAPI = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
        script.onload = async () => {
          console.log('FaceAPI loaded');
          await window.faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          console.log('✅ Models loaded');
          setModelsLoaded(true);
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error('FaceAPI error:', err);
      }
    };
    loadFaceAPI();
  }, []);

  // Load alert sound
  useEffect(() => {
    audioRef.current = new Audio('/alert.mp3');
    audioRef.current.load();
  }, []);

  // Fetch driver data
  useEffect(() => {
    const fetchData = async () => {
      if (!driverId) return;
      try {
        const profile = await api.getDriverProfile(driverId);
        const history = await api.getDriverAlerts(driverId);
        const stats = await api.getDriverStats(driverId);
        setDriver(profile);
        setProfileForm({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || ""
        });
        setAlertHistory(history);
        setWeeklyStats(stats.weekly || []);
        setTodayAlerts(stats.today || 0);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [driverId]);

  // Fonction pour sauvegarder le profil
  const handleSaveProfile = async () => {
    try {
      const response = await fetch('http://localhost:8002/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (response.ok) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
        setDriver(prev => ({ ...prev, ...profileForm }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Fonction pour changer le mot de passe
  const handleChangePassword = async () => {
    setPasswordError("");
    
    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8002/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: driver?.email,
          currentPassword: currentPassword, 
          newPassword: newPassword 
        })
      });
      
      if (response.ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 2500);
      } else {
        const error = await response.json();
        setPasswordError(error.message || "Failed to change password");
      }
    } catch (error) {
      setPasswordError("Error changing password");
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const analyzeFatigueWithDL = async (imageDataUrl) => {
    try {
      const blob = dataURLtoBlob(imageDataUrl);
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');
      formData.append('driver_id', driverId);

      const response = await fetch('http://localhost:8000/api/predict/', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log('DL API Result:', result);
      return result;
    } catch (error) {
      console.error('DL API error:', error);
      return null;
    }
  };

  const startCamera = async () => {
    if (!modelsLoaded) {
      alert("Loading face detection models, please wait...");
      return;
    }
    setCameraActive(true);
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsFatigued(false);
    setAnalysisResult(null);
    setLastFaceBox(null);
    frameCounterRef.current = 0;
  };

  useEffect(() => {
    if (!cameraActive || !modelsLoaded) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(analyzeFrame, 200);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCameraActive(false);
      }
    };
    initCamera();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive, modelsLoaded]);

  const sendAlertToBackend = async (confidenceValue) => {
    try {
      const alertData = {
        driver_id: driverId,
        driver_name: driver?.name,
        alert_type: 'fatigue',
        confidence: Math.round(confidenceValue * 100)
      };
    
      console.log('📤 Sending alert to backend:', alertData);
    
      const response = await fetch('http://localhost:8002/alerts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
    
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Alert saved successfully!', result);
      } else {
        console.error('❌ Failed to save alert:', response.status);
      }
    } catch (err) {
      console.error('❌ Alert error:', err);
    }
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !window.faceapi) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const detection = await window.faceapi.detectSingleFace(
        video,
        new window.faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5
        })
      );

      let box = null;
      
      if (detection) {
        box = detection.box;
        setLastFaceBox(box);
        frameCounterRef.current = 0;
      } else if (lastFaceBox) {
        frameCounterRef.current++;
        if (frameCounterRef.current < 10) {
          box = lastFaceBox;
        } else {
          setLastFaceBox(null);
        }
      }

      if (box) {
        const x = box.x;
        const y = box.y;
        const w = box.width;
        const h = box.height;

        ctx.clearRect(x - 5, y - 5, w + 10, h + 40);

        if (frameCounterRef.current % 3 === 0) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = video.videoWidth;
          tempCanvas.height = video.videoHeight;
          tempCanvas.getContext('2d').drawImage(video, 0, 0);
          const imageDataUrl = tempCanvas.toDataURL('image/jpeg');

          const dlResult = await analyzeFatigueWithDL(imageDataUrl);

          if (dlResult) {
            const alertLevel = dlResult.alert_level || 'normal';
            const dlConfidence = dlResult.confidence || 0;
            const shouldAlert = dlResult.should_alert === true;

            let boxColor = '#00ff00';
            let boxText = '🟢 ACTIVE - Normal';
            
            if (alertLevel === 'warning') {
              boxColor = '#ffaa00';
              boxText = '🟡 WARNING - Eyes closing';
            } else if (alertLevel === 'critical') {
              boxColor = '#ff0000';
              boxText = '🔴 CRITICAL - FATIGUE!';
              
              if (audioRef.current && !isFatigued) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log('Audio error:', e));
                setTimeout(() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }, 5000);
              }
            }

            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            
            ctx.fillStyle = boxColor;
            ctx.font = 'bold 14px Arial';
            ctx.fillText(boxText, x, y - 8);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`Confidence: ${Math.round(dlConfidence * 100)}%`, x, y + h + 15);
            ctx.fillText(`Level: ${alertLevel}`, x, y + h + 30);

            if (shouldAlert && !isFatigued) {
              setIsFatigued(true);
              setAnalysisResult({ 
                prediction: 'fatigue', 
                confidence: dlConfidence,
                alert_level: alertLevel
              });

              const newAlert = {
                id: Date.now(),
                driverName: driver?.name,
                time: new Date().toLocaleTimeString(),
                confidence: Math.round(dlConfidence * 100),
                date: "Today"
              };
              setActiveAlerts(prev => [newAlert, ...prev]);
              setAlertHistory(prev => [newAlert, ...prev]);

              await sendAlertToBackend(dlConfidence);

              const now = Date.now();
              if (now - lastAlertTimeRef.current > 10000) {
                lastAlertTimeRef.current = now;
                setIsBeingCalled(true);
                setTimeout(() => setIsBeingCalled(false), 5000);
              }

              const statusPill = document.querySelector('.dd-status-pill');
              if (statusPill) {
                statusPill.className = 'dd-status-pill dd-status-pill--warn';
                statusPill.innerHTML = `<span class="dd-status-pill__dot"></span>⚠️ FATIGUE DETECTED!`;
              }
            } else if (!shouldAlert && isFatigued) {
              setIsFatigued(false);
              const statusPill = document.querySelector('.dd-status-pill');
              if (statusPill && statusPill.classList.contains('dd-status-pill--warn')) {
                statusPill.className = 'dd-status-pill dd-status-pill--ok';
                statusPill.innerHTML = `<span class="dd-status-pill__dot"></span>All Clear - Driving Alert`;
              }
              setAnalysisResult({ 
                prediction: 'active', 
                confidence: dlConfidence,
                alert_level: alertLevel
              });
            }
          }
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff6600';
        ctx.font = '16px Arial';
        ctx.fillText('❌ No face detected - Please look at camera', 20, 50);
      }

    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  const handleLogout = async () => {
    stopCamera();
    await api.logout();
    navigate("/login");
  };

  if (loading || !driver) {
    return (
      <div className="dd-loading">
        <div className="dd-spinner"></div>
        <p>Loading driver dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dd-root" onClick={() => setProfileOpen(false)}>
      {isBeingCalled && (
        <div className="dd-call-overlay">
          <div className="dd-call-modal">
            <div className="dd-call-ringing">
              <div className="dd-call-icon">📞</div>
              <h3>⚠️ FATIGUE DETECTED!</h3>
              <p>System Auto-Calling You...</p>
              <div className="dd-call-animation">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="dd-header">
        <div className="dd-header__brand">
          <div className="dd-brand-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="2.5" />
              <path d="M17 24 Q24 16.5 31 24 Q24 31.5 17 24Z" fill="white" />
              <circle cx="24" cy="24" r="3.2" fill="#6366f1" />
              <circle cx="24" cy="24" r="1.4" fill="white" />
              <line x1="24" y1="6" x2="24" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="24" y1="34" x2="24" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="6" y1="24" x2="14" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="34" y1="24" x2="42" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="dd-brand-name">DriverVigil</span>
        </div>

        <nav className="dd-nav">
          <button className={`dd-nav__item ${activePage === "dashboard" ? "dd-nav__item--active" : ""}`} onClick={() => setActivePage("dashboard")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </button>
          <button className={`dd-nav__item ${activePage === "history" ? "dd-nav__item--active" : ""}`} onClick={() => setActivePage("history")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>
            History
          </button>
        </nav>

        <div className="dd-header__right">
          <div className="dd-notif-wrap">
            <button className="dd-notif-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {activeAlertCount > 0 && <span className="dd-notif-badge">{activeAlertCount}</span>}
            </button>
          </div>

          <div className="dd-avatar-wrap">
            <button className={`dd-avatar-btn ${profileOpen ? "dd-avatar-btn--active" : ""}`} onClick={() => setProfileOpen(!profileOpen)}>
              <div className="dd-avatar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <div className="dd-avatar-info">
                <span className="dd-avatar-name">{driver?.name}</span>
                <span className="dd-avatar-id">{driver?.id}</span>
              </div>
            </button>
            {profileOpen && (
              <div className="dd-profile-drop">
                <div className="dd-profile-drop__head">
                  <div className="dd-profile-drop__avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="dd-profile-drop__name">{driver?.name}</p>
                    <p className="dd-profile-drop__id">{driver?.id}</p>
                  </div>
                </div>
                <div className="dd-profile-drop__divider"/>
                <button className="dd-profile-drop__item" onClick={() => { setActivePage("profile"); setProfileOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Profile
                </button>
                <div className="dd-profile-drop__divider"/>
                <button className="dd-profile-drop__item dd-profile-drop__item--danger" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dd-main">
        {activePage === "dashboard" && (
          <div className="dd-dashboard">
            <div className="dd-welcome">
              <div className="dd-welcome__text">
                <h1 className="dd-welcome__title">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {driver.name?.split(" ")[0]} 👋</h1>
                <p className="dd-welcome__sub">Stay alert, drive safe</p>
              </div>
              <div className="dd-status-pill dd-status-pill--ok">
                <span className="dd-status-pill__dot"/>
                {isFatigued ? "⚠️ FATIGUE DETECTED" : "All Clear - Driving Alert"}
              </div>
            </div>

            <div className="dd-card">
              <h3 className="dd-card__title">🎥 Face Tracking & Fatigue Detection</h3>
              {!cameraActive ? (
                <button className="dd-start-camera" onClick={startCamera} disabled={!modelsLoaded}>
                  {modelsLoaded ? "🎥 Start Camera" : "⏳ Loading models..."}
                </button>
              ) : (
                <div className="dd-camera-container">
                  <video ref={videoRef} className="dd-video" autoPlay playsInline muted />
                  <canvas ref={canvasRef} className="face-track-canvas" />
                  {analysisResult && (
                    <div className={`dd-analysis-badge ${analysisResult.alert_level === 'critical' ? 'fatigue' : analysisResult.alert_level === 'warning' ? 'warning' : 'active'}`}>
                      {analysisResult.alert_level === 'critical' ? '🔴 CRITICAL - FATIGUE!' : 
                       analysisResult.alert_level === 'warning' ? '🟡 WARNING - Eyes closing' : 
                       '🟢 ACTIVE - Normal'} : {Math.round(analysisResult.confidence * 100)}%
                    </div>
                  )}
                  <button className="dd-stop-camera" onClick={stopCamera}>
                    ⏹️ Stop Camera
                  </button>
                </div>
              )}
            </div>

            <div className="dd-stats">
              <div className="dd-stat">
                <div className="dd-stat__icon dd-stat__icon--red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <p className="dd-stat__val">{activeAlerts.length}</p>
                  <p className="dd-stat__label">Active Alerts</p>
                </div>
              </div>
              <div className="dd-stat">
                <div className="dd-stat__icon dd-stat__icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <p className="dd-stat__val">{todayAlerts}</p>
                  <p className="dd-stat__label">Alerts Today</p>
                </div>
              </div>
              <div className="dd-stat">
                <div className="dd-stat__icon dd-stat__icon--purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="dd-stat__val">{alertHistory.length}</p>
                  <p className="dd-stat__label">Total Alerts</p>
                </div>
              </div>
            </div>

            <div className="dd-card">
              <h3 className="dd-card__title">Recent Alerts</h3>
              <div className="dd-recent">
                {activeAlerts.length === 0 ? (
                  <div className="dd-no-alerts">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4M12 16h.01"/>
                    </svg>
                    <p>No active alerts</p>
                    <span>You're driving alertly! 🚗💨</span>
                  </div>
                ) : (
                  activeAlerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="dd-recent__item dd-recent__item--active">
                      <div className="dd-recent__dot dd-recent__dot--pulse"/>
                      <div className="dd-recent__body">
                        <p className="dd-recent__type">⚠️ Fatigue Alert</p>
                        <p className="dd-recent__meta">{alert.time} · {alert.confidence}%</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dd-card dd-tips">
              <h3 className="dd-card__title">Safety Tips</h3>
              <ul className="dd-tips__list">
                <li><span>💧</span> Stay hydrated</li>
                <li><span>⏸️</span> Take breaks every 2 hours</li>
                <li><span>🌙</span> Avoid driving 2-5 AM</li>
                <li><span>😴</span> Get 7-8 hours sleep</li>
              </ul>
            </div>
          </div>
        )}

        {activePage === "history" && (
          <div className="dd-history">
            <div className="dd-history__header">
              <h2 className="dd-page-title">Alert History</h2>
              <span className="dd-history__count">{alertHistory.length} total</span>
            </div>
            <div className="dd-table-wrap">
              <table className="dd-table">
                <thead>
                  <tr><th>Time</th><th>Alert Type</th><th>Confidence</th></tr>
                </thead>
                <tbody>
                  {alertHistory.length === 0 ? (
                    <tr><td colSpan="3" className="dd-empty-state">No alerts recorded</td></tr>
                  ) : (
                    [...alertHistory].reverse().map((alert) => (
                      <tr key={alert.id}>
                        <td className="dd-table__time">{alert.time}</td>
                        <td><span className="dd-alert-badge">FATIGUE</span></td>
                        <td>{alert.confidence}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activePage === "profile" && (
          <div className="dd-profile">
            <h2 className="dd-page-title">My Profile</h2>
            <div className="dd-profile__grid">
              {/* معلومات السائق */}
              <div className="dd-card dd-profile__info">
                <div className="dd-profile__avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </div>
                <p className="dd-profile__name">{driver.name}</p>
                <div className="dd-profile__divider"/>
                <div className="dd-info-row"><span>Driver ID</span><span>{driver.id}</span></div>
                <div className="dd-info-row"><span>Name</span><span>{driver.name}</span></div>
                <div className="dd-info-row"><span>Phone</span><span>{driver.phone}</span></div>
                <div className="dd-info-row"><span>Email</span><span>{driver.email}</span></div>
                <div className="dd-profile__divider"/>
                <button className="dd-profile-drop__item dd-profile-drop__item--danger" onClick={handleLogout} style={{ justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </div>

              {/* تغيير كلمة المرور */}
              <div className="dd-settings-card">
                <h4 className="dd-settings-card__title">🔐 Change Password</h4>
                
                <div className="dv-pf-field">
                  <label className="dv-pf-label">Current Password</label>
                  <div className="dv-pf-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                    <input 
                      className="dv-pf-input" 
                      type={showCurrentPw ? "text" : "password"} 
                      placeholder="Enter current password" 
                      value={currentPassword} 
                      onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }} 
                    />
                    <button type="button" className="dv-pf-toggle" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                      {showCurrentPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="dv-pf-field">
                  <label className="dv-pf-label">New Password</label>
                  <div className="dv-pf-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <input 
                      className="dv-pf-input" 
                      type={showNewPw ? "text" : "password"} 
                      placeholder="Min 6 characters" 
                      value={newPassword} 
                      onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }} 
                    />
                    <button type="button" className="dv-pf-toggle" onClick={() => setShowNewPw(!showNewPw)}>
                      {showNewPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="dv-pf-field">
                  <label className="dv-pf-label">Confirm New Password</label>
                  <div className="dv-pf-input-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <input 
                      className="dv-pf-input" 
                      type={showConfirmPw ? "text" : "password"} 
                      placeholder="Repeat new password" 
                      value={confirmPassword} 
                      onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} 
                    />
                    <button type="button" className="dv-pf-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                      {showConfirmPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                {passwordError && <p className="dv-pf-error">{passwordError}</p>}
                {passwordSuccess && <p className="dv-pf-success">✅ Password changed successfully!</p>}

                <button type="button" className="dv-save-btn" onClick={handleChangePassword}>
                  {passwordSuccess ? "✓ Updated!" : "Update Password"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .dd-settings-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
        }
        .dd-settings-card__title {
          font-family: 'Exo 2', sans-serif;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 20px;
          font-size: 1rem;
        }
        .dv-pf-field {
          margin-bottom: 16px;
        }
        .dv-pf-label {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .dv-pf-input-wrap {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(130, 100, 220, 0.3);
          border-radius: 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dv-pf-input-wrap:focus-within {
          border-color: rgba(130, 100, 220, 0.7);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .dv-pf-input-wrap svg {
          width: 17px;
          height: 17px;
          margin-left: 14px;
          flex-shrink: 0;
          stroke: var(--text-muted);
        }
        .dv-pf-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          padding: 12px 14px;
        }
        .dv-pf-input::placeholder {
          color: var(--text-muted);
        }
        .dv-pf-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .dv-pf-toggle:hover {
          color: var(--text-sec);
        }
        .dv-pf-error {
          font-size: 0.78rem;
          color: var(--red);
          margin-bottom: 12px;
        }
        .dv-pf-success {
          font-size: 0.78rem;
          color: var(--green);
          margin-bottom: 12px;
        }
        .dv-save-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(90deg, var(--accent-from), var(--accent-to));
          color: #fff;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 8px;
        }
        .dv-save-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .dd-profile__grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dd-profile__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}