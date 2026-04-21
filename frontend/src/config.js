// config.js - API configuration for frontend
// Update these URLs based on your deployment

const API_CONFIG = {
    // Development (local)
    dev: {
      API_GATEWAY: 'http://localhost:8000/api',
      AUTH_SERVICE: 'http://localhost:8001/auth',
      WS_URL: 'ws://localhost:8000/ws',
    },
    
    // Production (with Traefik)
    production: {
      API_GATEWAY: 'http://traefik:8080/api',
      AUTH_SERVICE: 'http://traefik:8080/auth',
      WS_URL: 'ws://traefik:8080/ws',
    },
    
    // Docker Compose
    docker: {
      API_GATEWAY: 'http://api-gateway:8000/api',
      AUTH_SERVICE: 'http://auth-service:8001/auth',
      WS_URL: 'ws://api-gateway:8000/ws',
    }
  };
  
  // Detect environment
  const env = process.env.NODE_ENV || 'development';
  const dockerMode = process.env.REACT_APP_DOCKER_MODE === 'true';
  
  let activeConfig;
  if (dockerMode) {
    activeConfig = API_CONFIG.docker;
  } else if (env === 'production') {
    activeConfig = API_CONFIG.production;
  } else {
    activeConfig = API_CONFIG.dev;
  }
  
  export const config = {
    API_GATEWAY: activeConfig.API_GATEWAY,
    AUTH_SERVICE: activeConfig.AUTH_SERVICE,
    WS_URL: activeConfig.WS_URL,
  };
  
  export default config;