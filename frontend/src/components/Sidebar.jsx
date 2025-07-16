import { useNavigate } from "react-router-dom";
import { Building2, Truck, History, X, PlusCircle, ShieldAlert, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar({ isOpen, toggleSidebar, onNuevaCitaClick, handleLogout }) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    if (isOpen) {
      toggleSidebar();
    }
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      ></div>
      <div 
        className={cn(
          "flex flex-col",
          "fixed top-0 left-0 h-full bg-white shadow-lg p-4 z-40 transition-transform duration-300 ease-in-out",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex-grow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Menú</h2>
                <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-800">
                    <X size={24} />
                </button>
            </div>
            
            <nav>
                <ul className="space-y-2">
                    <li>
                        <button 
                            onClick={onNuevaCitaClick}
                            className="w-full text-left flex items-center gap-3 p-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <PlusCircle size={20} />
                            <span>Nueva Cita</span>
                        </button>
                    </li>
                    <hr className="my-4" />
                    <li>
                        <button onClick={() => handleNavigate("/gestionar/locadores")} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium">
                            <Building2 size={20} />
                            <span>Locadores</span>
                        </button>
                    </li>
                    <li>
                        <button onClick={() => handleNavigate("/gestionar/proveedores")} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium">
                            <Truck size={20} />
                            <span>Proveedores</span>
                        </button>
                    </li>
                    <li>
                        <button onClick={() => handleNavigate("/registro-citas")} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium">
                            <History size={20} />
                            <span>Registro de Citas</span>
                        </button>
                    </li>
                    <li>
                        <button onClick={() => handleNavigate("/incidentes")} className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium">
                            <ShieldAlert size={20} />
                            <span>Registro de Incidentes</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
        
        <div className="pt-4 border-t">
            <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-3 p-2 rounded-md text-red-600 hover:bg-red-50 font-medium"
            >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
            </button>
        </div>
      </div>
    </>
  );
}