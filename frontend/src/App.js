import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";

// Protected Route (محمية حسب الدور)
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate
      to={userRole === "admin" ? "/dashboard" : "/driver-dashboard"}
      replace
    />;
  }

  return children;
};

// دالة التنبيه عند اكتشاف التعب (Fatigue)
export const showFatigueAlert = (confidence) => {
  // إشعار المتصفح
  if (Notification.permission === "granted") {
    new Notification("⚠️ ALERTE CONDUCTEUR FATIGUE ⚠️", {
      body: `Confiance: ${confidence}% - Veuillez vous arrêter immédiatement !`,
      icon: "/alert-icon.png",
      vibrate: [200, 100, 200],
      requireInteraction: true,
    });
  }

  const audio = new Audio("/alert.mp3");
  audio.play().catch(() => {});

  // تنبيه بصري (فلاش أحمر)
  document.body.style.backgroundColor = "#ff0000";
  setTimeout(() => {
    document.body.style.backgroundColor = "";
  }, 3000);
};

export default function App() {
  // طلب إذن الإشعارات عند تحميل التطبيق
  useEffect(() => {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Admin Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Driver Route */}
        <Route
          path="/driver-dashboard"
          element={
            <ProtectedRoute allowedRole="driver">
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch all - إعادة توجيه لأي مسار غير موجود */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}