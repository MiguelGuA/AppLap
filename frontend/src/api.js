import axios from 'axios';

// Define la URL base de tu API
const API_URL = 'http://localhost:3000';

// Crea una instancia de Axios con la configuración base
const api = axios.create({
  baseURL: API_URL,
});

// --- INTERCEPTOR DE PETICIONES ---
// Esta función se ejecuta ANTES de que cada petición sea enviada.
api.interceptors.request.use(
  (config) => {
    // Obtiene el token del localStorage
    const token = localStorage.getItem('token');
    
    // Si el token existe, lo añade al encabezado 'Authorization'
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config; // Devuelve la configuración modificada para que la petición continúe
  },
  (error) => {
    // Si hay un error al configurar la petición, lo rechaza
    return Promise.reject(error);
  }
);

export default api;
