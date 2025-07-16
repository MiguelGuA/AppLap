import { useState, useEffect } from 'react';
import api from '../api';
import { consultarDni } from '../services/apiPeru';
import { X, Save, Search, Loader2 } from 'lucide-react';

export function EditarCitaModal({ cita, onClose, onSave, proveedores }) {
  const [formData, setFormData] = useState({
    proveedorId: '',
    descripcion: '',
    placaVehiculo: '',
    nombreChofer: '',
    dniChofer: '',
    acompanantes: '',
  });
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    if (cita) {
      setFormData({
        proveedorId: cita.proveedorId || '',
        descripcion: cita.descripcion || '',
        placaVehiculo: cita.placaVehiculo || '',
        nombreChofer: cita.nombreChofer || '',
        dniChofer: cita.dniChofer || '',
        acompanantes: Array.isArray(cita.acompanantes) ? cita.acompanantes.join(', ') : '',
      });
    }
  }, [cita]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'placaVehiculo') {
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDniLookup = async () => {
    if (!formData.dniChofer || formData.dniChofer.length !== 8) {
      alert("Por favor, ingrese un DNI válido de 8 dígitos.");
      return;
    }
    setIsApiLoading(true);
    try {
      const datosPersona = await consultarDni(formData.dniChofer);
      setFormData(prev => ({ ...prev, nombreChofer: `${datosPersona.nombres} ${datosPersona.apellidoPaterno} ${datosPersona.apellidoMaterno}`.trim() }));
    } catch (error) {
      alert(`Error al consultar DNI: ${error.message}`);
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleGuardar = async () => {
    
    const plateRegex = /^[A-Z]{3}[0-9]{3}$/;
    if (!formData.placaVehiculo || !plateRegex.test(formData.placaVehiculo)) {
        alert("El formato de la placa no es válido. Debe ser 3 letras seguidas de 3 números (ej: ABC123).");
        return;
    }

    setIsApiLoading(true);
    const dataToSend = {
      ...formData,
      proveedorId: parseInt(formData.proveedorId),
      acompanantes: formData.acompanantes.split(',').map(s => s.trim()).filter(Boolean),
    };
    try {
      await onSave(cita.id, dataToSend);
      onClose(); 
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      
    } finally {
      setIsApiLoading(false);
    }
  };

  if (!cita) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Confirmar / Editar Cita</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
            <select name="proveedorId" value={formData.proveedorId} onChange={handleChange} className="w-full p-2 border rounded-md">
              <option value="">Seleccione un proveedor</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI del Chofer</label>
            <div className="flex gap-2">
              <input name="dniChofer" value={formData.dniChofer} onChange={handleChange} placeholder="DNI de 8 dígitos" className="w-full p-2 border rounded-md" maxLength="8" />
              <button type="button" onClick={handleDniLookup} disabled={isApiLoading} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">
                {isApiLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Chofer</label>
            <input name="nombreChofer" value={formData.nombreChofer} onChange={handleChange} placeholder="Nombre completo del chofer" className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placa del Vehículo</label>
            <input name="placaVehiculo" value={formData.placaVehiculo} onChange={handleChange} placeholder="Placa del vehículo (ABC123)" className="w-full p-2 border rounded-md" maxLength="6" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la Carga</label>
            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Descripción de la carga" className="w-full p-2 border rounded-md" rows="3"></textarea>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acompañantes (separados por coma)</label>
            <input name="acompanantes" value={formData.acompanantes} onChange={handleChange} placeholder="Ej: Juan Perez, Maria Gomez" className="w-full p-2 border rounded-md" />
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end gap-4">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 font-semibold">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={isApiLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50">
            {isApiLoading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}