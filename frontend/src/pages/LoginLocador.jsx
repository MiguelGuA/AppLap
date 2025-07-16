import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

function LoginLocador() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    localStorage.removeItem("token");

    try {
      const res = await api.post('/auth/login', { username, password });
      const { token } = res.data;

      if (!token) {
        setError("Respuesta del servidor inválida.");
        setIsLoading(false);
        return;
      }

      const decoded = jwtDecode(token);

      if (decoded.rol === 'LOCATARIO') {
        localStorage.setItem("token", token);
        navigate('/panel-locatario', { replace: true });
      } else {
        setError("Acceso denegado. Esta cuenta no es de un locatario.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Credenciales inválidas.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Acceso para Locatarios</h1>
            <p className="text-gray-500 mt-2">Gestiona tus citas de forma rápida y segura.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-700">Usuario</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          {error && <p className="text-sm text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          <div>
            <button type="submit" disabled={isLoading} className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-all">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
        <div className="text-center">
            <button onClick={() => navigate('/')} className="text-sm text-gray-600 hover:underline">Volver a la selección de roles</button>
        </div>
      </div>
    </div>
  );
}

export default LoginLocador;
