// services/api.js - Centralized API communication

// ============================================
// PART 1: Configuration
// ============================================

const API_CONFIG = {
    development: {
      API_GATEWAY: 'http://localhost:8001',
      AUTH_SERVICE: 'http://localhost:8002',
      WS_URL: 'ws://localhost:8001',
    },
    production: {
      API_GATEWAY: 'http://localhost:8001',
      AUTH_SERVICE: 'http://localhost:8002',
      WS_URL: 'ws://localhost:8001',
    },
    docker: {
      API_GATEWAY: 'http://localhost:8001',
      AUTH_SERVICE: 'http://localhost:8002',
      WS_URL: 'ws://localhost:8001',
    }
};
  
const getEnvironment = () => {
  return 'development';
};

const env = getEnvironment();
const config = API_CONFIG[env];

// ============================================
// PART 2: API Service Class
// ============================================

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${config.API_GATEWAY}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        window.location.href = '/login';
        return null;
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // ============================================
  // PART 3: AUTHENTICATION ENDPOINTS
  // ============================================

  
  async login(email, password) {
  let url;
  if (email === 'admin@test.com') {
    url = `http://localhost:8002/admin/login`;
    console.log('🔐 Admin login detected, using:', url);
  } else {
    url = `http://localhost:8002/login`;
    console.log('🔐 Driver login detected, using:', url);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  console.log('📦 Login response:', data);

  if (response.ok && (data.token || data.access)) {
    this.token = data.token || data.access;
    localStorage.setItem("token", this.token);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("userId", data.userId || data.email);  // ✅ إضافة هذا السطر
    localStorage.setItem("userName", data.name || "");
    console.log('✅ Saved userId:', localStorage.getItem('userId'));
  }

  return data;
}
  async register(userData) {
    const url = `${config.AUTH_SERVICE}/register`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    return response.json();
  }

  async logout() {
    const url = `${config.AUTH_SERVICE}/logout`;
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    this.token = null;
  }

  async changePassword(data) {
    return this.request('/api/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // PART 4: ADMIN ENDPOINTS
  // ============================================

  async getDrivers() {
    try {
     // جلب جميع المستخدمين من auth-service
     const response = await fetch('http://localhost:8002/users');
     const data = await response.json();
     return data;
    } catch (error) {
     console.error('Error fetching drivers:', error);
     // بيانات وهمية كحل مؤقت
     return [
       { id: "DRV-001", name: "Test Driver", email: "driver@test.com", phone: "+1234567890", status: "active", route: "Highway 101", joinDate: "Jan 2025" },
       { id: "DRV-002", name: "Ahmed", email: "driver1@test.com", phone: "+1234567891", status: "active", route: "Downtown", joinDate: "Feb 2025" },
      ];
    }
  }

  async getDriverDetails(driverId) {
    return this.request(`/api/drivers/${driverId}`);
  }

 async getActiveAlerts() {
   return this.request('/api/alerts/active');
  }

  async getAlertHistory(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/api/alerts/history?${queryString}` : '/api/alerts/history';
    return this.request(endpoint);
  }

  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ============================================
  // PART 5: DRIVER ENDPOINTS
  // ============================================

 async getDriverProfile(driverId) {
  // driverId قد يكون رقماً أو بريداً إلكترونياً
  // نستخدم البريد الإلكتروني المخزن في localStorage
  const email = localStorage.getItem('userId');
  return this.request(`/api/drivers/${email}/profile`);
}

async getDriverAlerts(driverId) {
  const email = localStorage.getItem('userId');
  return this.request(`/api/drivers/${email}/alerts`);
}

async getDriverStats(driverId) {
  const email = localStorage.getItem('userId');
  return this.request(`/api/drivers/${email}/stats`);
}
  // ============================================
  // PART 6: WEBSOCKET CONNECTIONS
  // ============================================

  connectAlertsWebSocket(onMessage, onError) {
    const token = localStorage.getItem('token');
    const wsUrl = `${config.WS_URL}/ws/alerts?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => console.log('Admin WebSocket connected');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Admin WebSocket error:', error);
      if (onError) onError(error);
    };
    
    ws.onclose = () => console.log('Admin WebSocket disconnected');
    
    return ws;
  }

  connectDriverAlertsWebSocket(driverId, onMessage, onError) {
    const token = localStorage.getItem('token');
    const wsUrl = `${config.WS_URL}/ws/driver/${driverId}/alerts?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => console.log(`Driver ${driverId} WebSocket connected`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('Driver WebSocket error:', error);
      if (onError) onError(error);
    };
    
    ws.onclose = () => console.log(`Driver ${driverId} WebSocket disconnected`);
    
    return ws;
  }
}

// ============================================
// PART 7: EXPORT
// ============================================

const api = new ApiService();
export default api;