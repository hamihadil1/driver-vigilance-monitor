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
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [fatigueImages, setFatigueImages] = useState([]);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  const driverId = localStorage.getItem("userId");

  // --- 1. التحقق من الصلاحيات ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    if (!token || userRole !== "driver") {
      navigate("/login");
    }
  }, [navigate]);

  // --- 2. جلب بيانات السائق ---
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!driverId) return;
      try {
        const [profile, alerts, stats] = await Promise.all([
          api.getDriverProfile(driverId),
          api.getDriverAlerts(driverId),
          api.getDriverStats(driverId)
        ]);
        setDriver(profile);
        setAlertHistory(alerts);
        setWeeklyStats(stats.weekly || []);
        setTodayAlerts(stats.today || 0);
        setWeeklyTotal(stats.weeklyTotal || 0);
        
        const savedImages = localStorage.getItem(`fatigue_images_${driverId}`);
        if (savedImages) setFatigueImages(JSON.parse(savedImages));
        setLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setLoading(false);
      }
    };
    fetchDriverData();
  }, [driverId]);

  // --- 3. إدارة الكاميرات المتاحة ---
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === "videoinput");
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };

  useEffect(() => {
    getAvailableCameras();
    navigator.mediaDevices.addEventListener("devicechange", getAvailableCameras);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", getAvailableCameras);
      stopCamera();
    };
  }, []);

  // --- 4. منطق تشغيل/إيقاف الكاميرا (الحل الجذري للمشكلة) ---
  const startCamera = () => setCameraActive(true);

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setAnalysisResult(null);
  };

  // مراقبة ظهور عنصر الفيديو لربط الـ Stream
  useEffect(() => {
    let isMounted = true;

    const initStream = async () => {
      if (cameraActive && videoRef.current && !streamRef.current) {
        try {
          const constraints = {
            video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (!isMounted) return;

          streamRef.current = stream;
          videoRef.current.srcObject = stream;
          
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(captureAndAnalyze, 1000);
          };
        } catch (error) {
          console.error("Stream init error:", error);
          alert("Camera access denied.");
          setCameraActive(false);
        }
      }
    };

    initStream();
    return () => { isMounted = false; };
  }, [cameraActive, selectedCameraId]);

  // --- 5. التقاط الصور والتحليل ---
  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'frame.jpg');

      try {
        const response = await fetch('http://localhost:8001/api/predict', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        setAnalysisResult(result);

        if (result.prediction === 'fatigue' && result.confidence > 70) {
          handleFatigueDetected(canvas.toDataURL('image/jpeg'), result.confidence);
        }
      } catch (error) {
        console.error("API Analysis error:", error);
      }
    }, 'image/jpeg');
  };

  const handleFatigueDetected = (imgData, conf) => {
    const newAlert = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      confidence: Math.round(conf),
    };
    
    setActiveAlerts(prev => [newAlert, ...prev].slice(0, 5));
    setAlertHistory(prev => [newAlert, ...prev]);
    setIsBeingCalled(true);
    setTimeout(() => setIsBeingCalled(false), 4000);

    // حفظ الصورة
    const newImgEntry = { ...newAlert, image: imgData, timestamp: new Date().toLocaleString() };
    const updatedImages = [newImgEntry, ...fatigueImages].slice(0, 20);
    setFatigueImages(updatedImages);
    localStorage.setItem(`fatigue_images_${driverId}`, JSON.stringify(updatedImages));
  };

  const handleLogout = () => {
    stopCamera();
    api.logout();
    navigate("/login");
  };

  if (loading || !driver) return <div className="dd-loading"><div className="dd-spinner"></div></div>;

  return (
    <div className="dd-root" onClick={() => setProfileOpen(false)}>
      {/* Overlay Call */}
      {isBeingCalled && (
        <div className="dd-call-overlay">
          <div className="dd-call-modal">
            <div className="dd-call-ringing">
              <div className="dd-call-icon">📞</div>
              <h3>⚠️ FATIGUE DETECTED!</h3>
              <p>Wake up! Auto-calling support...</p>
              <div className="dd-call-animation"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <header className="dd-header">
        <div className="dd-header__brand">
          <div className="dd-brand-icon">👁️</div>
          <span className="dd-brand-name">DriverVigil</span>
        </div>
        <nav className="dd-nav">
          {["dashboard", "history", "fatigue-images"].map(page => (
            <button 
              key={page}
              className={`dd-nav__item ${activePage === page ? "dd-nav__item--active" : ""}`}
              onClick={() => setActivePage(page)}
            >
              {page.replace("-", " ").toUpperCase()}
            </button>
          ))}
        </nav>
        <div className="dd-header__right">
          <button className="dd-avatar-btn" onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
            <span>{driver.name}</span>
          </button>
          {profileOpen && (
            <div className="dd-profile-drop">
              <button onClick={() => setActivePage("profile")}>Profile</button>
              <button onClick={handleLogout} className="dd-danger">Sign Out</button>
            </div>
          )}
        </div>
      </header>

      <main className="dd-main">
        {activePage === "dashboard" && (
          <div className="dd-dashboard">
            <div className="dd-welcome">
              <h1>Welcome, {driver.name}</h1>
              <div className={`dd-status-pill ${activeAlerts.length > 0 ? "dd-status-pill--warn" : "dd-status-pill--ok"}`}>
                {activeAlerts.length > 0 ? "⚠️ Danger: Fatigue" : "✅ All Clear"}
              </div>
            </div>

            <div className="dd-card">
              <h3>🎥 Monitoring System</h3>
              <div className="dd-camera-selector">
                <select value={selectedCameraId} onChange={(e) => setSelectedCameraId(e.target.value)} disabled={cameraActive}>
                  {availableCameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || "Camera"}</option>)}
                </select>
              </div>

              {!cameraActive ? (
                <button className="dd-start-camera" onClick={startCamera}>Start Monitoring</button>
              ) : (
                <div className="dd-camera-container">
                  <video ref={videoRef} className="dd-video" autoPlay playsInline muted />
                  <button className="dd-stop-camera" onClick={stopCamera}>Stop</button>
                  {analysisResult && (
                    <div className={`dd-analysis ${analysisResult.prediction}`}>
                      {analysisResult.prediction.toUpperCase()}: {analysisResult.confidence}%
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="dd-stats">
              <div className="dd-stat"><h4>{todayAlerts}</h4><p>Today</p></div>
              <div className="dd-stat"><h4>{weeklyTotal}</h4><p>This Week</p></div>
            </div>
          </div>
        )}

        {activePage === "history" && (
          <div className="dd-card">
            <h2>Alert History</h2>
            <table className="dd-table">
              <thead><tr><th>Time</th><th>Status</th><th>Confidence</th></tr></thead>
              <tbody>
                {alertHistory.map(h => (
                  <tr key={h.id}><td>{h.time}</td><td>FATIGUE</td><td>{h.confidence}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activePage === "fatigue-images" && (
          <div className="dd-images-grid">
            {fatigueImages.map(img => (
              <div key={img.id} className="dd-image-card">
                <img src={img.image} alt="fatigue" />
                <p>{img.timestamp} ({img.confidence}%)</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}