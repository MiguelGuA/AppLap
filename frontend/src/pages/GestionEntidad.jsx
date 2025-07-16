import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { consultarRuc } from "../services/apiPeru";
import { ArrowLeft, Building, Truck, PlusCircle, Search, Trash2, Edit, Loader2 } from 'lucide-react';

const ESTRUCTURAS = {
  Locadores: { nombre: "", empresa: "", ruc: "" },
  Proveedores: { nombre: "", ruc: "", locatarioIds: [] },
};

const GestionForm = ({ tipo, form, setForm, handleSubmit, handleCancelar, editandoId, locatarios, isApiLoading, setIsApiLoading }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'locatarioIds') {
      const locatarioId = parseInt(value);
      const newLocatarioIds = checked
        ? [...form.locatarioIds, locatarioId]
        : form.locatarioIds.filter(id => id !== locatarioId);
      setForm({ ...form, locatarioIds: newLocatarioIds });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleRucLookup = async () => {
    if (!form.ruc || form.ruc.length !== 11) {
      alert("Por favor, ingrese un RUC válido de 11 dígitos.");
      return;
    }
    setIsApiLoading(true);
    try {
      const data = await consultarRuc(form.ruc);
      if (tipo === "Locadores") {
        setForm(prev => ({
          ...prev,
          nombre: data.nombreComercial || data.razonSocial, // Nombre Comercial
          empresa: data.razonSocial, // Razón Social
        }));
      } else { // Para Proveedores
        setForm(prev => ({
          ...prev,
          nombre: data.razonSocial,
        }));
      }
    } catch (error) {
      alert(`Error al consultar RUC: ${error.message}`);
    } finally {
      setIsApiLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (tipo) {
      case "Locadores":
        return (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC del Locatario</label>
              <div className="flex gap-2">
                <input name="ruc" value={form.ruc || ''} onChange={handleChange} placeholder="RUC de 11 dígitos" className="w-full p-2 border rounded-md" maxLength="11" />
                <button type="button" onClick={handleRucLookup} disabled={isApiLoading} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">
                  {isApiLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
              <input name="nombre" value={form.nombre || ''} onChange={handleChange} placeholder="Ej: Starbucks" className="w-full p-2 border rounded-md" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
              <input name="empresa" value={form.empresa || ''} placeholder="Se autocompleta con RUC" className="w-full p-2 border rounded-md bg-gray-100" readOnly />
            </div>
          </>
        );
      case "Proveedores":
        return (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC del Proveedor</label>
              <div className="flex gap-2">
                <input name="ruc" value={form.ruc || ''} onChange={handleChange} placeholder="RUC de 11 dígitos" className="w-full p-2 border rounded-md" maxLength="11" />
                <button type="button" onClick={handleRucLookup} disabled={isApiLoading} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50">
                  {isApiLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Razón Social</label>
              <input name="nombre" value={form.nombre || ''} placeholder="Se autocompleta con RUC" className="w-full p-2 border rounded-md bg-gray-100" readOnly />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Asociar a Locatarios</label>
              <div className="grid grid-cols-2 gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
                {locatarios.map(l => (
                  <label key={l.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="locatarioIds" value={l.id} checked={form.locatarioIds.includes(l.id)} onChange={handleChange} />
                    {l.nombre}
                  </label>
                ))}
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle size={22} className="text-blue-600" />
        {editandoId ? `Editando ${tipo.slice(0, -1)}` : `Crear Nuevo ${tipo}`}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderFormFields()}
      </div>
      <div className="flex gap-4 mt-6">
        <button onClick={handleSubmit} disabled={isApiLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isApiLoading ? 'Guardando...' : (editandoId ? 'Guardar Cambios' : 'Crear Registro')}
        </button>
        {editandoId && (
          <button onClick={handleCancelar} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

const GestionList = ({ tipo, lista, handleEditar, handleEliminar }) => {
  const getIcon = () => {
    switch (tipo) {
      case "Locadores": return <Building className="text-gray-500 w-6 h-6" />;
      case "Proveedores": return <Truck className="text-gray-500 w-6 h-6" />;
      default: return null;
    }
  };

  const renderItemDetails = (item) => {
    switch (tipo) {
      case "Locadores":
        return (
          <>
            <p className="text-sm text-gray-600">Razón Social: <span className="font-medium text-gray-800">{item.nombre}</span></p>
          <p className="text-sm text-gray-600">RUC: <span className="font-medium text-gray-800">{item.ruc || 'No asignado'}</span></p>
          <p className="text-sm text-gray-600">Usuario: <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${item.usuario ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.usuario?.username || 'No Asignado'}</span></p>
          </>
        );
      case "Proveedores":
        return (
          <>
            <p className="text-sm text-gray-600">RUC: <span className="font-medium text-gray-800">{item.ruc || 'No asignado'}</span></p>
            <p className="text-sm text-gray-600">Asociado a: <span className="font-medium text-gray-800">{item.locatarios?.map(l => l.locatario.nombre).join(', ') || 'Ninguno'}</span></p>
          </>
        );
      default:
        return null;
    }
  };

return (
  <div className="space-y-3">
    {lista.map(item => (
      <div key={item.id} className="bg-white p-4 rounded-lg shadow-md border flex justify-between items-center transition-shadow hover:shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div>
        
            <p className="font-bold text-gray-900">
              {tipo === 'Proveedores' ? item.nombre : item.empresa}
            </p>
            {renderItemDetails(item)}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleEditar(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full">
            <Edit size={18} />
          </button>
          <button onClick={() => handleEliminar(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    ))}
  </div>
);
};

function GestionEntidad() {
  const { tipo: tipoParam } = useParams();
  const tipo = tipoParam.charAt(0).toUpperCase() + tipoParam.slice(1);
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(ESTRUCTURAS[tipo] || {});
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [locatarios, setLocatarios] = useState([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  const urlBase = tipo?.toLowerCase();

  const fetchData = useCallback(async () => {
    if (!urlBase) return;
    try {
      const { data } = await api.get(`/${urlBase}`);
      setLista(data);
    } catch (e) {
      console.error("Error cargando datos:", e);
      setError("No se pudieron cargar los datos.");
    }
  }, [urlBase]);

  const fetchDependencias = useCallback(async () => {
    if (tipo === "Proveedores") {
      try {
        const { data } = await api.get("/locadores");
        setLocatarios(data);
      } catch (e) {
        console.error("Error cargando locatarios:", e);
      }
    }
  }, [tipo]);

  useEffect(() => {
    if (!ESTRUCTURAS[tipo]) return;
    setForm(ESTRUCTURAS[tipo]);
    setEditandoId(null);
    fetchData();
    fetchDependencias();
  }, [tipo, fetchData, fetchDependencias]);

  const handleSubmit = async () => {
    setError("");
    setMensaje("");
    setIsApiLoading(true);

    try {
      const dataToSend = { ...form };
      if (editandoId) {
        await api.patch(`/${urlBase}/${editandoId}`, dataToSend);
      } else {
        await api.post(`/${urlBase}`, dataToSend);
      }
      setMensaje(editandoId ? "Cambios guardados." : "Registro creado.");
      handleCancelar();
      fetchData();
    } catch (e) {
      console.error("Error guardando:", e);
      setError(e.response?.data?.error || "Error al guardar.");
    } finally {
      setIsApiLoading(false);
    }
  };

const handleEditar = (item) => {
  let formState = { ...(ESTRUCTURAS[tipo] || {}), ...item };

  if (tipo === "Locadores") {
    
    formState.nombre = item.empresa;  
    formState.empresa = item.nombre; 
  }

  if (tipo === "Proveedores" && item.locatarios) {
    formState.locatarioIds = item.locatarios.map(l => l.locatarioId);
  }
  
  setForm(formState);
  setEditandoId(item.id);
};

  const handleCancelar = () => {
    setForm(ESTRUCTURAS[tipo] || {});
    setEditandoId(null);
    setError("");
    setMensaje("");
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este registro?")) return;
    try {
      await api.delete(`/${urlBase}/${id}`);
      setMensaje("Registro eliminado.");
      fetchData();
    } catch (e) {
      console.error("Error eliminando:", e);
      setError(e.response?.data?.error || "No se pudo eliminar.");
    }
  };

  if (!ESTRUCTURAS[tipo]) {
    return <div className="p-4 text-red-500">Tipo de entidad no válido: {tipo}</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/panel-operador")} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={16} />
          Volver al panel
        </button>
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de {tipo}</h2>

        <GestionForm
          tipo={tipo}
          form={form}
          setForm={setForm}
          handleSubmit={handleSubmit}
          handleCancelar={handleCancelar}
          editandoId={editandoId}
          locatarios={locatarios}
          isApiLoading={isApiLoading}
          setIsApiLoading={setIsApiLoading}
        />

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4" role="alert">{error}</div>}
        {mensaje && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md relative mb-4" role="alert">{mensaje}</div>}

        <GestionList
          tipo={tipo}
          lista={lista}
          handleEditar={handleEditar}
          handleEliminar={handleEliminar}
        />
      </div>
    </div>
  );
}

export default GestionEntidad;
