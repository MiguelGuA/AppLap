import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


export const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    
    
    if (role && decoded.rol !== role) {
  
      if (role === "OPERADOR" && decoded.rol === "ADMIN") {
        return children; 
      }
      return <Navigate to="/" replace />;
    }
    
    
    return children;

  } catch (error) {
    
    console.error("Token inválido:", error);
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }
};
