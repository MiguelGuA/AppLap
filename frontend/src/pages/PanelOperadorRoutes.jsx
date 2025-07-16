

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import PanelOperador from "./pages/PanelOperador.jsx";
import GestionEntidad from "@/pages/GestionEntidad";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/panel" element={<PanelOperador />} />
        <Route path="/gestionar/:tipo" element={<GestionEntidad />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);



import { useNavigate } from "react-router-dom";

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <div className="w-64 bg-gray-100 h-screen p-4">
      <h2 className="text-lg font-bold mb-4">Menú</h2>
      <ul className="space-y-2">
        <li>
          <button onClick={() => navigate("/gestionar/locadores")} className="w-full text-left">Locadores</button>
        </li>
        <li>
          <button onClick={() => navigate("/gestionar/proveedores")} className="w-full text-left">Proveedores</button>
        </li>
        <li>
          <button onClick={() => navigate("/gestionar/choferes")} className="w-full text-left">Choferes</button>
        </li>
      </ul>
    </div>
  );
}



import { useParams } from "react-router-dom";

export function GestionEntidad() {
  const { tipo } = useParams();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestionar {tipo}</h1>
    
    </div>
  );
}
