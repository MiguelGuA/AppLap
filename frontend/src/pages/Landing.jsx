import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Building, HardHat } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.rol === 'OPERADOR' || decoded.rol === 'ADMIN') {
          navigate("/panel-operador", { replace: true });
        } else if (decoded.rol === 'LOCATARIO') {
          navigate("/panel-locatario", { replace: true });
        }
      } catch (e) {
        localStorage.removeItem("token");
      }
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Bienvenido al Sistema de Citas</h1>
        <p className="text-lg text-gray-600 mt-2">Por favor, selecciona tu tipo de acceso.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => navigate('/login-locatario', { replace: true })}
          className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
        >
          <Building className="h-16 w-16 text-blue-600 mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h2 className="text-2xl font-semibold text-gray-700">Soy Locatario</h2>
          <p className="text-gray-500 mt-1">Accede para programar y ver tus citas.</p>
        </button>

        <button
          onClick={() => navigate('/login-operador', { replace: true })}
          className="group flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
        >
          <HardHat className="h-16 w-16 text-orange-500 mb-4 transition-transform duration-300 group-hover:scale-110" />
          <h2 className="text-2xl font-semibold text-gray-700">Soy Operador</h2>
          <p className="text-gray-500 mt-1">Accede para gestionar el panel de operaciones.</p>
        </button>
      </div>
    </div>
  );
}

export default Landing;
