import { DragOverlay, DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api"; 
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { HistorialModal } from "../components/HistorialModal";
import { EditarCitaModal } from "../components/EditarCitaModal";
import { CrearCitaOperadorModal } from "../components/CrearCitaOperadorModal";
import { Menu, CalendarDays, Search, LogOut } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Column } from "../components/Column";
import { CardCita } from "../components/CardCita";
import { IncidenteModal } from "../components/IncidenteModal";
import { jwtDecode } from "jwt-decode";

registerLocale('es', es);

const COLUMNAS = [
  { id: "PENDIENTE", title: "CITAS PENDIENTES" },
  { id: "EN OPERACIÓN", title: "EN OPERACIÓN" },
  { id: "RETIRADO", title: "RETIRADO" },
];

export default function PanelOperador() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState([]);
  const [activeCita, setActiveCita] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [citaParaEditar, setCitaParaEditar] = useState(null);
  const [citaParaIncidente, setCitaParaIncidente] = useState(null);
  const [locadores, setLocadores] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCrearCitaModal, setShowCrearCitaModal] = useState(false);
  const [expandedCitaId, setExpandedCitaId] = useState(null);
  const [viewMode, setViewMode] = useState('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState("PENDIENTE");

  const cargarDatos = useCallback(async (fecha, vista) => {
    setLoading(true);
    try {
      let inicio, fin;
      if (vista === 'week') {
        inicio = startOfWeek(fecha, { weekStartsOn: 1 });
        fin = endOfWeek(fecha, { weekStartsOn: 1 });
      } else {
        inicio = startOfDay(fecha);
        fin = endOfDay(fecha);
      }
      
      const params = { fechaInicio: inicio.toISOString(), fechaFin: fin.toISOString() };
      const [citasRes, locadoresRes, proveedoresRes] = await Promise.all([
        api.get("/citas", { params }),
        api.get("/locadores"),
        api.get("/proveedores"),
      ]);
      
      setCitas(citasRes.data);
      setLocadores(locadoresRes.data);
      setProveedores(proveedoresRes.data);

    } catch (err) {
      console.error("Error cargando datos", err);
      if (err.response?.status === 401 || err.response?.status === 403) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            setUsuario(jwtDecode(token));
        } catch (e) {
            navigate("/login");
        }
    } else {
        navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    cargarDatos(currentDate, viewMode);
  }, [currentDate, viewMode, cargarDatos]);

  const citasFiltradas = useMemo(() => {
    if (!searchTerm) return citas;
    const busqueda = searchTerm.toLowerCase();
    return citas.filter(cita =>
      cita.placaVehiculo?.toLowerCase().includes(busqueda) ||
      cita.proveedor?.nombre.toLowerCase().includes(busqueda) ||
      cita.locatario?.nombre.toLowerCase().includes(busqueda) ||
      cita.nombreChofer?.toLowerCase().includes(busqueda)
    );
  }, [citas, searchTerm]);

  const citasPorColumna = useMemo(() => {
    const citasOrdenadas = citasFiltradas.sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));
    return {
      "PENDIENTE": citasOrdenadas.filter(c => c.estado === 'PENDIENTE'),
      "EN OPERACIÓN": citasOrdenadas.filter(c => ['LLEGO', 'DESCARGANDO', 'FINALIZADO'].includes(c.estado)),
      "RETIRADO": citasOrdenadas.filter(c => c.estado === 'RETIRADO'),
    };
  }, [citasFiltradas]);

  const handleUpdateState = useCallback((citaId, nuevoEstado) => {
    api.patch(`/citas/${citaId}`, { estado: nuevoEstado }).then(() => cargarDatos(currentDate, viewMode));
  }, [cargarDatos, currentDate, viewMode]);

  const handleSaveConfirmation = async (citaId, formData) => {
    await api.patch(`/citas/${citaId}/confirmar`, formData);
    setCitaParaEditar(null);
    cargarDatos(currentDate, viewMode);
  };
  
  const handleCitaCreada = () => {
    setShowCrearCitaModal(false);
    cargarDatos(currentDate, viewMode);
  };
  
  const handleIncidenteCreado = () => setCitaParaIncidente(null);

  const handleDragStart = (event) => {
    setActiveCita(event.active.data.current?.cita);
    setExpandedCitaId(null);
  };

  // --- FUNCIÓN CORREGIDA ---
  const handleDragOver = (event) => {
    const { over } = event;
    const overId = over?.id;
    setActiveColumn(overId && COLUMNAS.some(c => c.id === overId) ? overId : null);
  };

  const handleDragEnd = (event) => {
    setActiveCita(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const citaArrastrada = active.data.current?.cita;
    if (citaArrastrada?.requiereConfirmacion) return;

    const citaId = active.id;
    const columnaDestinoId = over.id;
    let columnaOrigenId = Object.keys(citasPorColumna).find(col => citasPorColumna[col].some(c => c.id === citaId));
    
    if (columnaOrigenId === columnaDestinoId) return;

    let nuevoEstadoDb = "";
    if (columnaOrigenId === 'PENDIENTE' && columnaDestinoId === 'EN OPERACIÓN') nuevoEstadoDb = 'LLEGO';
    else if (columnaOrigenId === 'EN OPERACIÓN' && columnaDestinoId === 'RETIRADO') nuevoEstadoDb = 'RETIRADO';
    else return;
    
    if (nuevoEstadoDb === 'RETIRADO' && !window.confirm("¿Estás seguro?")) return;
    
    handleUpdateState(citaId, nuevoEstadoDb);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleExpandCita = (citaId) => setExpandedCitaId(prevId => (prevId === citaId ? null : citaId));

  const formattedDateRange = viewMode === 'week' 
    ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM', { locale: es })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM, yy', { locale: es })}`
    : format(currentDate, "eeee, dd 'de' MMMM", { locale: es });

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onNuevaCitaClick={() => setShowCrearCitaModal(true)} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md hover:bg-gray-100">
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Panel Operador</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors" title="Cerrar sesión">
            <LogOut size={16} />
            <span className="hidden md:inline">Cerrar sesión</span>
          </button>
        </header>

        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0 border-b bg-white z-20">
            <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('day')} className={`px-3 py-1 rounded-md text-sm font-semibold ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Día</button>
                <button onClick={() => setViewMode('week')} className={`px-3 py-1 rounded-md text-sm font-semibold ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Semana</button>
            </div>
            <DatePicker
              selected={currentDate}
              onChange={(date) => setCurrentDate(date)}
              locale="es"
              popperClassName="z-50"
              customInput={
                <button className="font-semibold text-gray-700 flex items-center gap-2 p-2 rounded-md hover:bg-gray-200">
                  <CalendarDays size={20} />
                  <span>{formattedDateRange}</span>
                </button>
              }
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full md:w-64 border rounded-md"/>
            </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? ( <div className="text-center p-10">Cargando...</div> ) : (
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} sensors={sensors}>
              {/* VISTA MÓVIL (TABS) */}
              <div className="lg:hidden">
                <div className="sticky top-0 z-10 flex justify-around bg-white/90 backdrop-blur-sm border-b shadow-sm">
                  {COLUMNAS.map(col => (
                    <button key={col.id} onClick={() => setActiveMobileTab(col.id)} className={`flex-1 p-3 text-xs font-bold transition-colors ${activeMobileTab === col.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700'}`}>
                      <span className="truncate">{col.title} ({citasPorColumna[col.id]?.length || 0})</span>
                    </button>
                  ))}
                </div>
                <div className="p-2">
                  <Column
                    id={activeMobileTab}
                    title={COLUMNAS.find(c => c.id === activeMobileTab)?.title}
                    citas={citasPorColumna[activeMobileTab] || []}
                    onCardClick={cita => setCitaSeleccionada(cita)}
                    onUpdateState={handleUpdateState}
                    onEditClick={cita => setCitaParaEditar(cita)}
                    onReportIncident={cita => setCitaParaIncidente(cita)}
                    expandedCitaId={expandedCitaId}
                    onExpandCita={handleExpandCita}
                    isMobile={true}
                  />
                </div>
              </div>

              {/* VISTA DESKTOP (KANBAN) */}
              <div className="hidden lg:flex lg:flex-row lg:space-x-4 p-4 h-full">
                {COLUMNAS.map((columna) => (
                  <Column 
                    key={columna.id} 
                    id={columna.id} 
                    title={columna.title}
                    citas={citasPorColumna[columna.id] || []}
                    onCardClick={cita => setCitaSeleccionada(cita)}
                    onUpdateState={handleUpdateState}
                    onEditClick={cita => setCitaParaEditar(cita)}
                    onReportIncident={cita => setCitaParaIncidente(cita)}
                    isOver={activeColumn === columna.id}
                    expandedCitaId={expandedCitaId}
                    onExpandCita={handleExpandCita}
                    isMobile={false}
                  />
                ))}
              </div>
              <DragOverlay>{activeCita ? <CardCita cita={activeCita} /> : null}</DragOverlay>
            </DndContext>
          )}
        </div>
      </main>

      {/* Modales */}
      {citaSeleccionada && ( <HistorialModal cita={citaSeleccionada} onClose={() => setCitaSeleccionada(null)} /> )}
      {citaParaEditar && ( <EditarCitaModal cita={citaParaEditar} proveedores={proveedores} onClose={() => setCitaParaEditar(null)} onSave={handleSaveConfirmation} /> )}
      {showCrearCitaModal && ( <CrearCitaOperadorModal locadores={locadores} proveedores={proveedores} onClose={() => setShowCrearCitaModal(false)} onCitaCreada={handleCitaCreada} /> )}
      {citaParaIncidente && ( <IncidenteModal cita={citaParaIncidente} onClose={() => setCitaParaIncidente(null)} onIncidenteCreado={handleIncidenteCreado} /> )}
    </div>
  );
}
