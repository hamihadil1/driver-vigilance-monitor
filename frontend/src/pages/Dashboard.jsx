import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import api from "../services/api"; 

// Sample registered drivers data
// const REGISTERED_DRIVERS = [
//   { id: "DRV-2041", name: "Michael Chen", email: "michael.chen@example.com", phone: "+1 555 024 1000", status: "active", joinDate: "Jan 2025", route: "Highway 101 N" },
//   { id: "DRV-2038", name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1 555 024 1001", status: "active", joinDate: "Feb 2025", route: "Downtown Loop" },
//   { id: "DRV-2045", name: "David Martinez", email: "david.m@example.com", phone: "+1 555 024 1002", status: "inactive", joinDate: "Jan 2025", route: "Airport Express" },
//   { id: "DRV-2033", name: "Emma Wilson", email: "emma.w@example.com", phone: "+1 555 024 1003", status: "active", joinDate: "Mar 2025", route: "Route 66 W" },
//   { id: "DRV-2051", name: "James Park", email: "james.p@example.com", phone: "+1 555 024 1004", status: "active", joinDate: "Dec 2024", route: "Bay Bridge Rd" },
//   { id: "DRV-2029", name: "Robert Taylor", email: "robert.t@example.com", phone: "+1 555 024 1005", status: "active", joinDate: "Nov 2024", route: "Coastal Hwy" },
//   { id: "DRV-2060", name: "Lisa Anderson", email: "lisa.a@example.com", phone: "+1 555 024 1006", status: "active", joinDate: "Feb 2025", route: "Mountain View Rd" },
//   { id: "DRV-2072", name: "Thomas Wright", email: "thomas.w@example.com", phone: "+1 555 024 1007", status: "inactive", joinDate: "Mar 2025", route: "Industrial Blvd" },
// ];

// Mock info for *status* and *route*
const generateMockDrivers = (driversFromBackend) => {
  const routes = [
    "Highway 101 - Northbound",
    "Downtown Express Route",
    "Coastal Highway",
    "Mountain Pass Route",
    "Industrial District Loop",
    "Airport Connector",
    "Suburban Transit Line",
    "Port Authority Route"
  ];
  
  const statuses = ["active", "inactive"];
  
  return driversFromBackend.map(driver => ({
    ...driver,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    route: routes[Math.floor(Math.random() * routes.length)]
  }));
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [callingDriver, setCallingDriver] = useState(null);

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check authentication and role
useEffect(() => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  if (!token) {
    navigate("/login");
    return;
  }
  if (userRole !== "admin") {
    // If not admin, redirect to driver dashboard
    navigate("/driver-dashboard");
    return;
  }
}, [navigate]);


  // Fetch drivers from *backend* API
  // useEffect(() => {
  //   const fetchDrivers = async () => {
  //     try {
  //       const data = await api.getDrivers();
  //       setDrivers(data);
  //       setLoading(false);
  //     } catch (error) {
  //       console.error('Error fetching drivers:', error);
  //       setLoading(false);
  //     }
  //   };
    
  //   fetchDrivers();
  // }, []);

  // Replace your existing fetchDrivers useEffect with this:
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await api.getDrivers();
        // Add random status and route to drivers from backend
        const driversWithMockData = generateMockDrivers(data);
        setDrivers(driversWithMockData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching drivers:', error);
        setLoading(false);
      }
    };
    
    fetchDrivers();
  }, []);
  
  //real-time alerts *backend*
  
  // Fetch active alerts from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await api.getActiveAlerts();
        setAlerts(data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };
    fetchAlerts();
    // Then fetch every 2 seconds (polling)
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);
  //*************************************/
   // WebSocket for real-time alerts
   useEffect(() => {
    const ws = api.connectAlertsWebSocket(
      // When a new alert arrives
      (newAlert) => {
        console.log('New alert received:', newAlert);
        setAlerts(prev => [newAlert, ...prev]);
        // Auto-call driver (phone rings)
        setCallingDriver(newAlert.driverName);
        setTimeout(() => {
          setCallingDriver(null);
        }, 3000);
      },
      (error) => {
        console.error('WebSocket error:', error);
      }
    );
    return () => ws.close();
  }, []);



  // Handle logout
  const handleLogout = async () => {
    await api.logout();
    navigate("/login");
  };

  const ADMIN = { name: "Admin User", email: "admin@drivervigil.com", role: "System Administrator" };
  const alertCount = alerts.length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "drivers",   label: "All Drivers", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: "history",   label: "History",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
    { id: "settings",  label: "Settings",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  ];

  if (loading) {
    return (
      <div className="dv-loading">
        <div className="dv-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  return (
    <div className="dv-layout">
      {/* Auto-call Notification Overlay - System automatically calls */}
      {callingDriver && (
        <div className="dv-call-overlay">
          <div className="dv-call-modal">
            <div className="dv-call-ringing">
              <div className="dv-call-icon">📞</div>
              <h3>System Auto-Calling Driver...</h3>
              <p>{callingDriver}</p>
              <div className="dv-call-animation">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`dv-sidebar ${sidebarOpen ? "" : "dv-sidebar--collapsed"}`}>
      <div className="dv-sidebar__brand">
      <div className="dv-brand-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="18" stroke="white" strokeWidth="2.5" />
          
          {/* Eye shape */}
          <path d="M17 24 Q24 16.5 31 24 Q24 31.5 17 24Z" fill="white" />
          <circle cx="24" cy="24" r="3.2" fill="#6366f1" />
          <circle cx="24" cy="24" r="1.4" fill="white" />
          
          <line x1="24" y1="6" x2="24" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="34" x2="24" y2="42" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="6" y1="24" x2="14" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34" y1="24" x2="42" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      {sidebarOpen && <span className="dv-brand-name">DriverVigil</span>}
    </div>

        <nav className="dv-sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`dv-nav-item ${activePage === item.id ? "dv-nav-item--active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="dv-nav-item__icon">{item.icon}</span>
              {sidebarOpen && <span className="dv-nav-item__label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button className="dv-sidebar__logout" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </aside>

      {/* Main */}
      <div className="dv-main">
        {/* Topbar */}
        <header className="dv-topbar">
          <div className="dv-topbar__left">
            <button className="dv-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6"  x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h2 className="dv-topbar__title">Driver Fatigue Monitoring System</h2>
          </div>
          <div className="dv-topbar__right">
            {/* Notifications - Shows 0 when no alerts */}
            <div className="dv-notif-wrap">
              <button className="dv-icon-btn" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {alertCount > 0 && <span className="dv-badge">{alertCount}</span>}
              </button>
              {notifOpen && (
                <div className="dv-notif-dropdown">
                  <p className="dv-notif-dropdown__title">
                    Active Fatigue Alerts {alertCount > 0 ? `(${alertCount})` : ""}
                  </p>
                  {alertCount === 0 ? (
                    <div className="dv-no-alerts-mini">
                      <p>✅ No active alerts</p>
                      <span>All drivers are alert</span>
                    </div>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="dv-notif-item">
                        <span className="dv-notif-item__dot" />
                        <div>
                          <p className="dv-notif-item__name">{a.name}</p>
                          <p className="dv-notif-item__msg">⚠️ Fatigue Detected - Auto-call initiated</p>
                        </div>
                        <span className="dv-notif-item__time">{a.time}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="dv-profile-wrap">
              <button
                className={`dv-icon-btn ${profileOpen ? "dv-icon-btn--active" : ""}`}
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </button>
              {profileOpen && (
                <div className="dv-profile-dropdown">
                  <div className="dv-profile-header">
                    <div className="dv-profile-avatar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                    </div>
                    <div>
                      <p className="dv-profile-name">{ADMIN.name}</p>
                      <p className="dv-profile-role">{ADMIN.role}</p>
                      <p className="dv-profile-email">{ADMIN.email}</p>
                    </div>
                  </div>
                  <div className="dv-profile-divider" />
                  <button className="dv-profile-item" onClick={() => { setActivePage("settings"); setProfileOpen(false); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Settings
                  </button>
                  <button className="dv-profile-item" onClick={() => { setActivePage("profile"); setProfileOpen(false); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Edit Profile
                  </button>
                  <div className="dv-profile-divider" />
                  <button className="dv-profile-item dv-profile-item--danger" onClick={() => navigate("/")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dv-content" onClick={() => { setNotifOpen(false); setProfileOpen(false); }}>
          {activePage === "dashboard" && <DashboardPage drivers={drivers} alerts={alerts} />}
          {activePage === "drivers"   && <AllDriversPage drivers={drivers} />}
          {activePage === "history"   && <HistoryPage alerts={alerts} resolvedAlerts={[]} />}
          {activePage === "settings"  && <SettingsPage />}
          {activePage === "profile"   && <ProfilePage admin={ADMIN} />}
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Page ── */
function DashboardPage({ drivers, alerts }) {
  const activeCount = drivers.filter(d => d.status === "active").length;
  const alertCount = alerts.length;
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Get drivers with active alerts
  const driversWithAlerts = drivers.filter(d => alerts.some(a => a.name === d.name));

  return (
    <div className="dv-dashboard">
      {selectedDriver && (
        <DriverModal
          driver={selectedDriver}
          alerts={alerts.filter(a => a.name === selectedDriver.name)}
          onClose={() => setSelectedDriver(null)}
        />
      )}

      {/* Stat Cards */}
      <div className="dv-stats">
        <div className="dv-stat-card">
          <p className="dv-stat-card__label">Active Drivers</p>
          <p className="dv-stat-card__value">{activeCount}</p>
          <p className="dv-stat-card__sub">Currently on road</p>
        </div>
        <div className="dv-stat-card dv-stat-card--alert">
          <span className="dv-stat-card__dot dv-stat-card__dot--red" />
          <p className="dv-stat-card__label">Active Fatigue Alerts</p>
          <p className="dv-stat-card__value">{alertCount}</p>
          <p className="dv-stat-card__sub">Auto-call initiated for each</p>
        </div>
        <div className="dv-stat-card dv-stat-card--online">
          <span className="dv-stat-card__dot dv-stat-card__dot--green" />
          <p className="dv-stat-card__label">Camera System</p>
          <p className="dv-stat-card__value dv-stat-card__value--online">Monitoring</p>
          <p className="dv-stat-card__sub">Capturing every 1 second</p>
        </div>
      </div>

      {/* Bottom */}
      <div className="dv-bottom">
        <div className="dv-drivers">
          <h3 className="dv-section-title">Driver Status</h3>
          <div className="dv-driver-grid">
            {drivers.map((d) => (
              <DriverCard 
                key={d.id} 
                driver={d} 
                onViewDetails={() => setSelectedDriver(d)} 
                hasAlert={alerts.some(a => a.name === d.name)}
              />
            ))}
          </div>
        </div>

        <div className="dv-alerts-panel">
          <h3 className="dv-section-title">Real-Time Alerts</h3>
          <div className="dv-alerts-list">
            {alerts.length === 0 ? (
              <div className="dv-no-alerts">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                <p>No active alerts</p>
                <span>All drivers are alert and focused</span>
              </div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="dv-alert-item">
                  <svg className="dv-alert-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div className="dv-alert-item__body">
                    <span className="dv-alert-item__time">{a.time}</span>
                    <p className="dv-alert-item__name">{a.name}</p>
                    <p className="dv-alert-item__msg">⚠️ Fatigue detected from camera feed</p>
                    <p className="dv-alert-item__auto-call">📞 System auto-call initiated</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Driver Card ── */
function DriverCard({ driver, onViewDetails, hasAlert }) {
  return (
    <div className={`dv-driver-card ${hasAlert ? "dv-driver-card--alert" : ""}`}>
      <div className="dv-driver-card__header">
        <div>
          <p className="dv-driver-card__name">{driver.name}</p>
          <p className="dv-driver-card__id">ID: {driver.id}</p>
        </div>
        <div className="dv-driver-card__status">
          <span className={`dv-status-dot ${driver.status === "active" ? "dv-status-active" : "dv-status-inactive"}`} />
          <span className="dv-status-text">{driver.status === "active" ? "On Route" : "Off Duty"}</span>
        </div>
      </div>
      <div className="dv-driver-card__body">
        {hasAlert && (
          <span className="dv-badge-status dv-badge-status--alert">⚠️ FATIGUE ALERT - AUTO-CALL ACTIVE</span>
        )}
        <p className="dv-driver-card__route">📍 {driver.route}</p>
        <p className="dv-driver-card__contact">📧 {driver.email}</p>
        <p className="dv-driver-card__contact">📞 {driver.phone}</p>
      </div>
      <button className="dv-driver-card__btn" onClick={onViewDetails}>View Details</button>
    </div>
  );
}

/* ── All Drivers Page ── */
function AllDriversPage({ drivers }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          driver.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          driver.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dv-all-drivers">
      <div className="dv-page-header">
        <h3 className="dv-section-title">All Registered Drivers</h3>
        <div className="dv-drivers-stats">
          <span>Total: {drivers.length}</span>
          <span>Active: {drivers.filter(d => d.status === "active").length}</span>
        </div>
      </div>

      <div className="dv-filters-bar">
        <div className="dv-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by name, ID, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="dv-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="dv-drivers-table-container">
        <table className="dv-drivers-table">
          <thead>
            <tr>
              <th>Driver ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Route</th>
              <th>Status</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => (
              <tr key={driver.id}>
                <td className="dv-table-id">{driver.id}</td>
                <td className="dv-table-name">{driver.name}</td>
                <td>{driver.email}</td>
                <td>{driver.phone}</td>
                <td>{driver.route}</td>
                <td>
                  <span className={`dv-status-badge ${driver.status === "active" ? "dv-status-active-badge" : "dv-status-inactive-badge"}`}>
                    {driver.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{driver.joinDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Driver Modal ── */
function DriverModal({ driver, alerts, onClose }) {
  return (
    <div className="dv-modal-overlay" onClick={onClose}>
      <div className="dv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dv-modal__header">
          <div className="dv-modal__title-wrap">
            <div className="dv-modal__avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div>
              <h2 className="dv-modal__name">{driver.name}</h2>
              <p className="dv-modal__id">ID: {driver.id}</p>
            </div>
          </div>
          <div className="dv-modal__header-right">
            {alerts.length > 0 && (
              <span className="dv-badge-status dv-badge-status--alert">ACTIVE ALERT - AUTO-CALL ACTIVE</span>
            )}
            <button className="dv-modal__close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="dv-modal__info">
          <div className="dv-modal__info-item">
            <span className="dv-modal__info-label">Route</span>
            <span className="dv-modal__info-val">{driver.route}</span>
          </div>
          <div className="dv-modal__info-item">
            <span className="dv-modal__info-label">Status</span>
            <span className={`dv-modal__info-val ${driver.status === "active" ? "dv-info-green" : "dv-info-gray"}`}>
              {driver.status === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="dv-modal__info-item">
            <span className="dv-modal__info-label">Active Alerts</span>
            <span className="dv-modal__info-val dv-modal__info-val--red">{alerts.length}</span>
          </div>
        </div>

        <div className="dv-modal__auto-call-info">
          <p>📞 System automatically calls driver when fatigue is detected</p>
        </div>

        <h4 className="dv-modal__section-title">Recent Fatigue Alerts</h4>
        {alerts.length === 0 ? (
          <p className="dv-modal__empty">No active fatigue alerts.</p>
        ) : (
          <div className="dv-modal__alerts">
            {alerts.map((a) => (
              <div key={a.id} className="dv-modal__alert-row">
                <span className="dv-modal__alert-time">{a.time}</span>
                <div className="dv-modal__alert-details">
                  <span>⚠️ Fatigue Detected</span>
                  <span>📞 Auto-call initiated</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── History Page ── */
function HistoryPage({ alerts, resolvedAlerts }) {
  // Combine active and resolved alerts for history
  const allHistory = [...alerts, ...resolvedAlerts].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="dv-history">
      <div className="dv-history__header">
        <h3 className="dv-section-title" style={{ margin: 0 }}>Alert History</h3>
        <div className="dv-history__filters">
          <select className="dv-select">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="dv-history-table-wrap">
        <table className="dv-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Driver</th>
              <th>Alert Type</th>
              <th>System Action</th>
            </tr>
          </thead>
          <tbody>
            {allHistory.length === 0 ? (
              <tr>
                <td colSpan="4" className="dv-empty-state">No alerts recorded</td>
              </tr>
            ) : (
              allHistory.map((alert) => (
                <tr key={alert.id}>
                  <td className="dv-table__time">{alert.time}</td>
                  <td className="dv-table__name">{alert.name}</td>
                  <td><span className="dv-badge-status dv-badge-status--alert">FATIGUE ALERT</span></td>
                  <td>📞 Auto-call initiated</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Settings Page ── */
function SettingsPage() {
  const [fatigue, setFatigue] = useState(3);
  const [autoCall, setAutoCall] = useState(true);
  const [sound, setSound] = useState(true);
  const [saved, setSaved] = useState(false);

  //Update SettingsPage save *backend*
  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fatigue, autoCall, sound })
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="dv-settings">
      <h3 className="dv-section-title">System Settings</h3>
      <div className="dv-settings-grid">
        <div className="dv-settings-card">
          <h4 className="dv-settings-card__title">Alert Configuration</h4>
          <div className="dv-settings-row">
            <label className="dv-settings-label">Fatigue sensitivity</label>
            <div className="dv-slider-wrap">
              <input type="range" min="1" max="5" value={fatigue} onChange={(e) => setFatigue(+e.target.value)} className="dv-slider" />
              <span className="dv-slider-val">{fatigue}/5</span>
            </div>
          </div>
          <div className="dv-settings-info">
            <p>📸 Camera captures every 1 second</p>
            <p>⚠️ Alert triggers when fatigue detected</p>
            <p>📞 System automatically calls driver on alert</p>
          </div>
        </div>

        <div className="dv-settings-card">
          <h4 className="dv-settings-card__title">Emergency Actions</h4>
          <div className="dv-settings-row">
            <label className="dv-settings-label">Auto-call on alert</label>
            <button type="button" className={`dv-toggle ${autoCall ? "dv-toggle--on" : ""}`} onClick={() => setAutoCall(!autoCall)}>
              <span className="dv-toggle__knob" />
            </button>
          </div>
          <div className="dv-settings-row">
            <label className="dv-settings-label">Sound alerts</label>
            <button type="button" className={`dv-toggle ${sound ? "dv-toggle--on" : ""}`} onClick={() => setSound(!sound)}>
              <span className="dv-toggle__knob" />
            </button>
          </div>
          <div className="dv-settings-info">
            <p>✅ Auto-call is enabled by default for driver safety</p>
          </div>
        </div>

        <div className="dv-settings-card">
          <h4 className="dv-settings-card__title">System Info</h4>
          <div className="dv-info-row"><span>Version</span><span className="dv-info-val">v3.0.0</span></div>
          <div className="dv-info-row"><span>Camera status</span><span className="dv-info-val dv-info-val--green">Active (1s interval)</span></div>
          <div className="dv-info-row"><span>ML Model</span><span className="dv-info-val">Fatigue Detection v2</span></div>
          <div className="dv-info-row"><span>Auto-call system</span><span className="dv-info-val dv-info-val--green">Active</span></div>
          <div className="dv-info-row"><span>Last updated</span><span className="dv-info-val">2026-04-05</span></div>
        </div>
      </div>
      <button type="button" className="dv-save-btn" onClick={handleSave}>
        {saved ? "✓ Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

/* ── Profile Page ── */
function ProfilePage({ admin }) {
  const [form, setForm] = useState({ name: admin.name, email: admin.email, phone: "+1 555 000 1234" });
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  //update profile saved *backend*
  const handleSaveProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };


  //save change password *backend*
  const handleChangePassword = async () => {
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    
    try {
      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      
      if (response.ok) {
        setPwError("");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setPwSaved(true);
        setTimeout(() => setPwSaved(false), 2500);
      } else {
        const error = await response.json();
        setPwError(error.message);
      }
    } catch (error) {
      setPwError("Error changing password");
    }
  };



  return (
    <div className="dv-profile-page">
      <h3 className="dv-section-title">My Profile</h3>
      <div className="dv-profile-grid">
        <div className="dv-settings-card">
          <div className="dv-profile-page__avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <p className="dv-profile-page__name">{form.name}</p>
          <p className="dv-profile-page__role">{admin.role}</p>
          <div className="dv-profile-divider" style={{ margin: "20px 0" }} />
          <div className="dv-info-row"><span>Email</span><span className="dv-info-val">{form.email}</span></div>
          <div className="dv-info-row"><span>Phone</span><span className="dv-info-val">{form.phone}</span></div>
          <div className="dv-info-row"><span>Role</span><span className="dv-info-val dv-info-val--green">{admin.role}</span></div>
          <div className="dv-info-row"><span>Member since</span><span className="dv-info-val">Jan 2025</span></div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="dv-settings-card">
            <h4 className="dv-settings-card__title">Edit Information</h4>
            <div className="dv-pf-field">
              <label className="dv-pf-label">Full Name</label>
              <div className="dv-pf-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                <input className="dv-pf-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="dv-pf-field">
              <label className="dv-pf-label">Email Address</label>
              <div className="dv-pf-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
                <input className="dv-pf-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="dv-pf-field">
              <label className="dv-pf-label">Phone Number</label>
              <div className="dv-pf-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <input className="dv-pf-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <button type="button" className="dv-save-btn" style={{ marginTop: "8px" }} onClick={handleSaveProfile}>
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
          </div>

          <div className="dv-settings-card">
            <h4 className="dv-settings-card__title">Change Password</h4>
            <div className="dv-pf-field">
              <label className="dv-pf-label">Current Password</label>
              <div className="dv-pf-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                <input className="dv-pf-input" type="password" placeholder="••••••••" value={currentPw} onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); }} />
              </div>
            </div>
            <div className="dv-pf-field">
              <label className="dv-pf-label">New Password</label>
              <div className="dv-pf-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <input className="dv-pf-input" type={showNew ? "text" : "password"} placeholder="Min 6 characters" value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwError(""); }} />
                <button type="button" className="dv-pf-toggle" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C6 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
            <div className="dv-pf-field">
              <label className="dv-pf-label">Confirm New Password</label>
              <div className="dv-pf-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <input className="dv-pf-input" type={showConfirm ? "text" : "password"} placeholder="Repeat new password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }} />
                <button type="button" className="dv-pf-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C6 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
            {pwError && <p className="dv-pf-error">{pwError}</p>}
            <button type="button" className="dv-save-btn" style={{ marginTop: "8px" }} onClick={handleChangePassword}>
              {pwSaved ? "✓ Password Updated!" : "Update Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}