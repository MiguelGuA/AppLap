import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import LoginLocador from "./LoginLocador";
import { format, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { consultarDni, consultarRuc } from "../services/apiPeru";
import { PlusCircle, X, ChevronDown, ChevronUp, AlertTriangle, LogOut, Search, Loader2 } from "lucide-react";

registerLocale('es', es);

const ESTILOS_ESTADO = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  LLEGO: 'bg-blue-100 text-blue-800',
  DESCARGANDO: 'bg-purple-100 text-purple-800',
  FINALIZADO: 'bg-green-100 text-green-800',
  RETIRADO: 'bg-gray-200 text-gray-800'
};

const initialFormState = {
  proveedorId: "",
  descripcion: "",
  fechaCita: "",
  aceptoCondiciones: false,
  usaFilm: false,
  nombreChofer: "",
  dniChofer: "",
  placaVehiculo: "",
  acompanantes: []
};

function PanelLocatario() {
  const navigate = useNavigate();

  const [verificando, setVerificando] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [locatarioId, setLocatarioId] = useState(null);
  const [misCitas, setMisCitas] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [esSolicitud, setEsSolicitud] = useState(false);
  const [data, setData] = useState(initialFormState);
  const [acompananteDni, setAcompananteDni] = useState("");
  const [acompananteNombre, setAcompananteNombre] = useState("");
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [nuevoProveedorRUC, setNuevoProveedorRUC] = useState("");
  const [nuevoNombreProveedor, setNuevoNombreProveedor] = useState("");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [expandedCitaId, setExpandedCitaId] = useState(null);

  const verificarToken = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setVerificando(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setShowLogin(true);
      setVerificando(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.rol !== "LOCATARIO") {
        setShowLogin(true);
        setVerificando(false);
        return;
      }
      
      const res = await api.get("/locadores/mi-locatario");
      if (!res.data?.id) {
        alert("No se encontró el locatario del usuario.");
        setShowLogin(true);
        setVerificando(false);
        return;
      }
      
      setNombreUsuario(res.data.nombre || "Usuario");
      setLocatarioId(res.data.id);

      const [provRes, citasRes] = await Promise.all([
        api.get("/proveedores/mis-proveedores"),
        api.get('/citas/mis-citas')
      ]);
      setProveedores(provRes.data);
      setMisCitas(citasRes.data);

    } catch (e) {
      console.error("Error al verificar token o cargar datos:", e);
      setShowLogin(true);
    } finally {
      if (isInitialLoad) setVerificando(false);
    }
  }, [navigate]);

  useEffect(() => {
    verificarToken(true);
    const intervalId = setInterval(() => verificarToken(false), 20000);
    return () => clearInterval(intervalId);
  }, [verificarToken]);
  
  const handleConsultaDNI = async (dni, targetField) => {
    if (String(dni).length !== 8) {
      alert("Por favor, ingrese un DNI de 8 dígitos.");
      return;
    }
    setIsApiLoading(true);
    try {
      const datosPersona = await consultarDni(dni);
      const nombreCompleto = `${datosPersona.nombres} ${datosPersona.apellidoPaterno} ${datosPersona.apellidoMaterno}`.trim();
      if (targetField === 'chofer') {
        setData(prev => ({ ...prev, nombreChofer: nombreCompleto }));
      } else if (targetField === 'acompanante') {
        setAcompananteNombre(nombreCompleto);
      }
    } catch (error) {
      alert(`Error al consultar DNI: ${error.message}`);
      if (targetField === 'chofer') setData(prev => ({ ...prev, nombreChofer: "" }));
      else setAcompananteNombre("");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleConsultaRUC = async () => {
    if (!nuevoProveedorRUC || nuevoProveedorRUC.length !== 11) {
      alert("Por favor, ingrese un RUC válido de 11 dígitos.");
      return;
    }
    setIsApiLoading(true);
    try {
      const data = await consultarRuc(nuevoProveedorRUC);
      setNuevoNombreProveedor(data.razonSocial);
    } catch (error) {
      alert(`Error al consultar RUC: ${error.message}`);
      setNuevoNombreProveedor("");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleGuardarProveedor = async () => {
    if (!nuevoNombreProveedor.trim()) {
      alert("Consulte un RUC válido para obtener el nombre del proveedor.");
      return;
    }
    setIsApiLoading(true);
    try {
      const nuevoProveedor = await api.post('/proveedores/para-locatario', { 
        nombre: nuevoNombreProveedor, 
        ruc: nuevoProveedorRUC 
      });
      alert("Proveedor creado y asociado exitosamente.");
      setShowProveedorModal(false);
      setNuevoNombreProveedor("");
      setNuevoProveedorRUC("");
      await verificarToken(false);
      setData(prev => ({ ...prev, proveedorId: nuevoProveedor.data.id }));
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      alert(error.response?.data?.error || "No se pudo guardar el proveedor.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleAddAcompanante = () => {
    if (!acompananteDni || !acompananteNombre) {
      alert("Debe buscar un DNI válido para agregar al acompañante.");
      return;
    }
    const nuevoAcompanante = { dni: acompananteDni, nombre: acompananteNombre };
    if (data.acompanantes.some(a => a.dni === nuevoAcompanante.dni)) {
        alert("Este acompañante ya ha sido agregado.");
        return;
    }
    setData(prev => ({ ...prev, acompanantes: [...prev.acompanantes, nuevoAcompanante] }));
    setAcompananteDni("");
    setAcompananteNombre("");
  };

  const handleRemoveAcompanante = (dniToRemove) => {
    setData(prev => ({
      ...prev,
      acompanantes: prev.acompanantes.filter(a => a.dni !== dniToRemove)
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.fechaCita) {
      alert("La fecha de cita es requerida.");
      return;
    }
    if (!data.aceptoCondiciones) {
      alert("Debe aceptar el compromiso de uso de implementos de seguridad.");
      return;
    }
    if (!esSolicitud && !data.proveedorId) {
      alert("Debe seleccionar un proveedor para una cita completa.");
      return;
    }

    try {
      const citaParaEnviar = {
        locatarioId,
        proveedorId: data.proveedorId ? parseInt(data.proveedorId) : null,
        fechaCita: new Date(data.fechaCita).toISOString(),
        aceptoCondiciones: data.aceptoCondiciones,
        usaFilm: data.usaFilm,
        requiereConfirmacion: esSolicitud,
        descripcion: data.descripcion,
        nombreChofer: esSolicitud ? "" : data.nombreChofer,
        dniChofer: esSolicitud ? "" : data.dniChofer,
        placaVehiculo: esSolicitud ? "" : data.placaVehiculo,
        acompanantes: esSolicitud ? [] : data.acompanantes 
      };

      await api.post("/citas", citaParaEnviar);
      alert(esSolicitud ? "Solicitud de ingreso creada correctamente." : "Cita creada correctamente.");
      
      setData(initialFormState);
      setEsSolicitud(false);
      verificarToken();
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Error al crear la cita: " + (err.response?.data?.error || err.message));
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/"); 
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'placaVehiculo') {
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const citasOrdenadas = misCitas.sort((a, b) => new Date(b.fechaCita) - new Date(a.fechaCita));

  if (verificando) return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
  if (showLogin) return <LoginLocador onClose={() => navigate("/")} onLogin={() => { setShowLogin(false); verificarToken(true); }} />;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Panel de Locatario</h1>
              <p className="text-md text-gray-600">Usuario: <span className="font-semibold">{nombreUsuario}</span></p>
          </div>
          <button 
            className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors" 
            onClick={cerrarSesion}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">{/*Cerrar sesión*/}</span>
          </button>
        </div>

        <div className={`grid grid-cols-1 ${showForm ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 lg:gap-12`}>
          
          {showForm ? (
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <div className="flex justify-between items-center border-b pb-3 mb-6">
                  <h2 className="text-xl font-semibold text-gray-700">Programar Nueva Cita</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                      <X size={24} />
                  </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Proveedor {esSolicitud && '(Opcional)'}</label>
                    <div className="flex items-center gap-2">
                      <select name="proveedorId" onChange={handleChange} className="w-full border p-2 rounded-md" value={data.proveedorId} required={!esSolicitud}>
                        <option value="">Seleccione...</option>
                        {proveedores.map((p) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
                      </select>
                      <button type="button" onClick={() => setShowProveedorModal(true)} className="bg-blue-100 text-blue-700 font-semibold px-4 py-2 rounded-md hover:bg-blue-200 whitespace-nowrap">(+) Nuevo</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Fecha y hora de cita</label>
                    <DatePicker
                      selected={data.fechaCita ? new Date(data.fechaCita) : null}
                      onChange={(date) => setData(prev => ({ ...prev, fechaCita: date }))}
                      showTimeSelect timeIntervals={10} dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full border p-2 rounded-md" locale={es} minDate={startOfToday()} required
                    />
                  </div>
                </div>

                {!esSolicitud && (
                  <>
                    <div className="p-4 bg-gray-50 rounded-md border">
                      <h3 className="font-semibold text-gray-600 mb-3">Datos del Conductor y Vehículo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">DNI del Chofer</label>
                          <div className="flex items-center gap-2">
                            <input type="text" name="dniChofer" value={data.dniChofer} onChange={handleChange} maxLength="8" required={!esSolicitud} className="w-full border p-2 rounded-md"/>
                            <button type="button" onClick={() => handleConsultaDNI(data.dniChofer, 'chofer')} disabled={isApiLoading} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Buscar</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Nombre del Chofer</label>
                          <input type="text" name="nombreChofer" value={data.nombreChofer} readOnly className="w-full border p-2 rounded-md bg-gray-100"/>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-600">Placa del Vehículo</label>
                          <input type="text" name="placaVehiculo" value={data.placaVehiculo} onChange={handleChange} maxLength="6" required={!esSolicitud} className="w-full border p-2 rounded-md"/>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-md border">
                      <h3 className="font-semibold text-gray-600 mb-3">Acompañantes (Opcional)</h3>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {data.acompanantes.map((p) => (
                          <div key={p.dni} className="flex justify-between items-center bg-gray-200 p-2 rounded">
                            <span className="text-sm">{p.nombre} (DNI: {p.dni})</span>
                            <button type="button" onClick={() => handleRemoveAcompanante(p.dni)} className="font-bold text-red-500 px-2">&times;</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-end gap-2 mt-3 pt-3 border-t">
                        <div className="flex-grow">
                          <label className="block text-xs font-medium text-gray-600">DNI Acompañante</label>
                          <input type="text" value={acompananteDni} onChange={(e) => setAcompananteDni(e.target.value)} maxLength="8" className="w-full border p-2 rounded-md"/>
                        </div>
                        <button type="button" onClick={() => handleConsultaDNI(acompananteDni, 'acompanante')} disabled={isApiLoading} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Buscar</button>
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600">Nombre Acompañante</label>
                        <input type="text" value={acompananteNombre} readOnly className="w-full border p-2 rounded-md bg-gray-100"/>
                      </div>
                      <button type="button" onClick={handleAddAcompanante} className="w-full mt-2 bg-blue-100 text-blue-700 py-2 rounded-md hover:bg-blue-200 text-sm font-semibold">Agregar Acompañante a la lista</button>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Observaciones (Opcional)</label>
                  <textarea name="descripcion" value={data.descripcion} onChange={handleChange} className="w-full border p-2 rounded-md" rows="2"></textarea>
                </div>
                
                <label className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md cursor-pointer">
                  <input type="checkbox" checked={esSolicitud} onChange={(e) => setEsSolicitud(e.target.checked)} className="mr-3 h-5 w-5 rounded text-blue-600 focus:ring-blue-500" />
                  <div>
                    <span className="font-semibold text-gray-800">Marcar como Solicitud de Ingreso</span>
                    <p className="text-gray-600 text-xs">El operador completará los datos del vehículo y conductor a su llegada.</p>
                  </div>
                </label>
                
                <div className="pt-4 border-t">
                    <label className="flex items-center">
                        <input type="checkbox" name="aceptoCondiciones" checked={data.aceptoCondiciones} onChange={handleChange} className="mr-2 h-4 w-4" required/>
                        <span className="text-sm text-gray-700">Me comprometo a usar los implementos de seguridad requeridos (manta y film).</span>
                    </label>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700">{esSolicitud ? 'Crear Solicitud' : 'Programar Cita'}</button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-2 flex justify-center items-center">
              <button 
                onClick={() => setShowForm(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 font-semibold text-blue-600 px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all"
              >
                <PlusCircle size={22}/>
                Programar Nueva Cita
              </button>
            </div>
          )}

          <div className={!showForm ? 'lg:col-span-2' : ''}>
            <div className="bg-white p-6 rounded-lg shadow-lg border h-full">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">Mis Citas Programadas</h2>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  {citasOrdenadas.length > 0 ? citasOrdenadas.map(cita => (
                      <div key={cita.id} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className="font-bold text-gray-800">{cita.proveedor?.nombre || 'Solicitud de Ingreso'} - {cita.placaVehiculo || 'Sin Placa'}</p>
                                  <p className="text-sm text-gray-600 capitalize">{format(new Date(cita.fechaCita), "eeee, dd 'de' MMMM, hh:mm a", { locale: es })}</p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${ESTILOS_ESTADO[cita.estado] || 'bg-gray-200'}`}>{cita.estado}</span>
                          </div>
                          <button onClick={() => setExpandedCitaId(expandedCitaId === cita.id ? null : cita.id)} className="text-blue-600 text-sm mt-2 flex items-center gap-1">
                             {expandedCitaId === cita.id ? 'Ocultar Detalles' : 'Ver Detalles'} {expandedCitaId === cita.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                          </button>
                          {expandedCitaId === cita.id && (
                              <div className="mt-4 pt-4 border-t space-y-3 text-sm">
                                  <p><span className="font-semibold">Chofer:</span> {cita.nombreChofer || 'No asignado'}</p>
                                  <p><span className="font-semibold">Observaciones:</span> {cita.descripcion || 'Ninguna'}</p>
                                  <p><span className="font-semibold">Acompañantes:</span> {cita.acompanantes?.length > 0 ? cita.acompanantes.map(a => `${a.nombre} (${a.dni})`).join(', ') : 'Ninguno'}</p>
                                  <p><span className="font-semibold">Implementos:</span>
                                      {cita.aceptoCondiciones ? " Manta Oscura/Film" : " Ninguno"}
                                  </p>
                                  
                                  {cita.incidentes?.length > 0 && (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-md mt-2">
                                          <h4 className="font-semibold text-red-800 flex items-center gap-2"><AlertTriangle size={16}/> Incidentes Reportados</h4>
                                          <ul className="list-disc list-inside mt-2 text-sm text-red-700">
                                              {cita.incidentes.map(inc => <li key={inc.id}>{inc.what}</li>)}
                                          </ul>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                  )) : <div className="text-center text-gray-500 py-8">No tienes citas programadas.</div>}
              </div>
            </div>
          </div>
        </div>

        {showProveedorModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Añadir Nuevo Proveedor por RUC</h2>
                <div className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium">Número de RUC</label>
                    <div className="flex items-center gap-2">
                    <input type="text" value={nuevoProveedorRUC} onChange={(e) => setNuevoProveedorRUC(e.target.value)} className="w-full border p-2 rounded-md" placeholder="Ingrese RUC (11 dígitos)" maxLength="11" />
                    <button type="button" onClick={handleConsultaRUC} disabled={isApiLoading} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50">
                        {isApiLoading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
                    </button>
                    </div>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium">Nombre / Razón Social</label>
                    <input type="text" value={nuevoNombreProveedor} className="w-full border p-2 rounded-md bg-gray-100" readOnly placeholder="Se completará automáticamente"/>
                </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setShowProveedorModal(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="button" onClick={handleGuardarProveedor} disabled={isApiLoading || !nuevoNombreProveedor} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {isApiLoading ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
                </div>
            </div>
            </div>
        )}

      </div>
    </div>
  );
}

export default PanelLocatario;