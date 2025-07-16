import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import LoginLocador from './pages/LoginLocador';
import LoginOperador from './pages/LoginOperador';
import PanelLocatario from './pages/PanelLocatario';
import PanelOperador from './pages/PanelOperador'; 
// ✅ CORRECCIÓN DEFINITIVA: La importación usa llaves {} para que coincida con la exportación.
import { PrivateRoute } from './components/PrivateRoute';
import GestionEntidad from './pages/GestionEntidad';
import RegistroCitas from "./pages/RegistroCitas";
import RegistroIncidentes from "./pages/RegistroIncidentes";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login-locatario" element={<LoginLocador />} />
        <Route path="/login-operador" element={<LoginOperador />} />
        
        {/* Rutas Privadas */}
        <Route 
          path="/panel-locatario" 
          element={
            <PrivateRoute role="LOCATARIO">
              <PanelLocatario />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/panel-operador" 
          element={
            <PrivateRoute role="OPERADOR">
              <PanelOperador />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/gestionar/:tipo" 
          element={
            <PrivateRoute role="OPERADOR">
              <GestionEntidad />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/registro-citas" 
          element={
            <PrivateRoute role="OPERADOR">
              <RegistroCitas />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/incidentes" 
          element={
            <PrivateRoute role="OPERADOR">
              <RegistroIncidentes />
            </PrivateRoute>
          } 
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
