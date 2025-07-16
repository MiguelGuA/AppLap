import { useState, useEffect, useMemo } from "react";
import api from "../api";
import { consultarDni } from "../services/apiPeru";
import { X, Save, Search, Loader2 } from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import { startOfToday } from "date-fns";

registerLocale('es', es);

export const CrearCitaOperadorModal = ({ locadores, proveedores, onClose, onCitaCreada }) => {
  const [data, setData] = useState({
    locatarioId: "",
    proveedorId: "",
    descripcion: "", 
    fechaCita: "",
    aceptoCondiciones: true,
    requiereConfirmacion: false,
    nombreChofer: "",
    dniChofer: "",
    placaVehiculo: "",
    acompanantes: [],
  });

  const [isApiLoading, setIsApiLoading] = useState(false);
  const [acompananteDni, setAcompananteDni] = useState("");
  const [acompananteNombre, setAcompananteNombre] = useState("");

  const proveedoresFiltrados = useMemo(() => {
    if (!data.locatarioId) {
      return [];
    }
    return proveedores.filter(p =>
      p.locatarios.some(l => l.locatarioId === parseInt(data.locatarioId))
    );
  }, [data.locatarioId, proveedores]);

  useEffect(() => {
    setData(prev => ({ ...prev, proveedorId: "" }));
  }, [data.locatarioId]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'placaVehiculo') {
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDniLookup = async (dni, targetField) => {
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

  const handleAddAcompanante = () => {
    if (!acompananteDni || !acompananteNombre) {
      alert("Debe buscar un DNI válido para agregar al acompañante.");
      return;
    }
    const nuevoAcompanante = `${acompananteNombre} (${acompananteDni})`;
    if (data.acompanantes.includes(nuevoAcompanante)) {
      alert("Este acompañante ya ha sido agregado.");
      return;
    }
    setData(prev => ({ ...prev, acompanantes: [...prev.acompanantes, nuevoAcompanante] }));
    setAcompananteDni("");
    setAcompananteNombre("");
  };

  const handleRemoveAcompanante = (acompananteToRemove) => {
    setData(prev => ({
      ...prev,
      acompanantes: prev.acompanantes.filter(a => a !== acompananteToRemove)
    }));
  };

  const handleSubmit = async () => {
    const { locatarioId, proveedorId, fechaCita, dniChofer, nombreChofer, placaVehiculo } = data;
    if (!locatarioId || !proveedorId || !fechaCita || !dniChofer || !nombreChofer || !placaVehiculo) {
      alert("Por favor, complete todos los campos requeridos (excepto Observaciones).");
      return;
    }

    const plateRegex = /^[A-Z0-9]{6}$/;
    if (!plateRegex.test(placaVehiculo)) {
      alert("La placa debe contener exactamente 6 caracteres alfanuméricos.");
      return;
    }

    setIsApiLoading(true);
    try {
      const { acompanantes, ...restOfData } = data; 
      const dataToSend = {
        ...restOfData,
        locatarioId: parseInt(data.locatarioId),
        proveedorId: parseInt(data.proveedorId),
        acompanantesJson: Array.isArray(acompanantes) ? acompanantes : [],
      };

      await api.post('/citas', dataToSend);
      alert("Cita creada exitosamente por el operador.");
      onCitaCreada();
    } catch (error) {
      console.error("Error al crear cita:", error);
      alert(error.response?.data?.error || "No se pudo crear la cita.");
    } finally {
      setIsApiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Crear Nueva Cita (Operador)</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Locatario</label>
              <select name="locatarioId" value={data.locatarioId} onChange={handleChange} className="w-full border p-2 rounded-md">
                <option value="">-- Seleccione --</option>
                {locadores.map(l => (<option key={l.id} value={l.id}>{l.nombre}</option>))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Proveedor</label>
              <select name="proveedorId" value={data.proveedorId} onChange={handleChange} className="w-full border p-2 rounded-md" disabled={!data.locatarioId}>
                <option value="">-- Seleccione --</option>
                {proveedoresFiltrados.map(p => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
              </select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-md border mt-4">
            <h3 className="font-semibold text-gray-600 mb-3">Datos del Conductor y Vehículo</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI del Chofer</label>
                <div className="flex gap-2">
                  <input name="dniChofer" value={data.dniChofer} onChange={handleChange} placeholder="DNI de 8 dígitos" className="w-full p-2 border rounded-md" maxLength="8" />
                  <button type="button" onClick={() => handleDniLookup(data.dniChofer, 'chofer')} disabled={isApiLoading} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">
                    {isApiLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Chofer</label>
                <input name="nombreChofer" value={data.nombreChofer} onChange={handleChange} placeholder="Nombre completo del chofer" className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placa del Vehículo</label>
                <input name="placaVehiculo" value={data.placaVehiculo} onChange={handleChange} placeholder="Ej: ABC123" className="w-full p-2 border rounded-md" maxLength="6" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-md border">
            <h3 className="font-semibold text-gray-600 mb-3">Acompañantes (Opcional)</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {data.acompanantes.map((nombre, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-200 p-2 rounded">
                  <span className="text-sm">{nombre}</span>
                  <button type="button" onClick={() => handleRemoveAcompanante(nombre)} className="font-bold text-red-500 px-2">&times;</button>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-2 mt-3 pt-3 border-t">
              <div className="flex-grow">
                <label className="block text-xs font-medium text-gray-600">DNI Acompañante</label>
                <input type="text" value={acompananteDni} onChange={(e) => setAcompananteDni(e.target.value)} maxLength="8" className="w-full border p-2 rounded-md" />
              </div>
              <button type="button" onClick={() => handleDniLookup(acompananteDni, 'acompanante')} disabled={isApiLoading} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">Buscar</button>
            </div>
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600">Nombre Acompañante</label>
              <input type="text" value={acompananteNombre} readOnly className="w-full border p-2 rounded-md bg-gray-100" />
            </div>
            <button type="button" onClick={handleAddAcompanante} className="w-full mt-2 bg-blue-100 text-blue-700 py-2 rounded-md hover:bg-blue-200 text-sm font-semibold">Agregar Acompañante a la lista</button>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Observaciones</label>
            <textarea name="descripcion" value={data.descripcion} onChange={handleChange} className="w-full border p-2 rounded-md" rows="2"></textarea>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Fecha y Hora de la Cita</label>
            <DatePicker
              selected={data.fechaCita ? new Date(data.fechaCita) : null}
              onChange={(date) => setData(prev => ({ ...prev, fechaCita: date }))}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={10}
              timeCaption="Hora"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full border p-2 rounded-md"
              locale={es}
              minDate={startOfToday()}
              required
            />
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end gap-4">
          <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 font-semibold">Cancelar</button>
          <button type="button" onClick={handleSubmit} disabled={isApiLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50">
            {isApiLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Guardar Cita
          </button>
        </div>
      </div>
    </div>
  );
};
