import { useState } from 'react';
import api from '../api';
import { X, Send, Paperclip, Loader2 } from 'lucide-react';

export const IncidenteModal = ({ cita, onClose, onIncidenteCreado }) => {
  const [formData, setFormData] = useState({
    what: '', why: '', where: '', who: '', how: '', howMuch: ''
  });
  const [archivos, setArchivos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!cita) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setArchivos([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.what || !formData.why || !formData.where || !formData.who || !formData.how) {
      alert("Por favor, complete todos los campos requeridos del 5W2H.");
      return;
    }
    setIsSubmitting(true);

    const submissionData = new FormData();
    submissionData.append('citaId', cita.id);
    Object.keys(formData).forEach(key => {
        submissionData.append(key, formData[key]);
    });
    archivos.forEach(file => {
        submissionData.append('archivos', file);
    });

    try {
      await api.post('/incidentes', submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert("Incidente reportado exitosamente.");
      onIncidenteCreado(); 
    } catch (error) {
      console.error("Error al reportar incidente:", error);
      alert(error.response?.data?.error || "No se pudo reportar el incidente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTextarea = (name, label, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full p-2 border rounded-md text-sm"
        rows="2"
      ></textarea>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Reportar Incidente (5W2H)</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderTextarea("what", "¿Qué pasó?", "Descripción del incidente.")}
              {renderTextarea("why", "¿Por qué pasó?", "Causa raíz del problema.")}
              {renderTextarea("where", "¿Dónde pasó?", "Ubicación específica del incidente.")}
              {renderTextarea("who", "¿Quién(es) estuvieron involucrados?", "Personal, proveedores, etc.")}
              {renderTextarea("how", "¿Cómo se solucionó o qué acción se tomó?", "Acciones correctivas inmediatas.")}
              {renderTextarea("howMuch", "¿Cuánto costó? (Opcional)", "Impacto económico, si aplica.")}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Evidencia (Fotos, Documentos)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                <span>Subir archivos</span>
                                <input id="file-upload" name="archivos" type="file" className="sr-only" multiple onChange={handleFileChange} />
                            </label>
                            <p className="pl-1">o arrastrar y soltar</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
                        {archivos.length > 0 && <p className="text-sm text-green-600">{archivos.length} archivo(s) seleccionado(s)</p>}
                    </div>
                </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 rounded-b-lg flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 font-semibold">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold flex items-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={18} />}
              Reportar Incidente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};