import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { format, endOfDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Filter, X, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { HistorialModal } from '../components/HistorialModal';
import Papa from 'papaparse';
import { jwtDecode } from "jwt-decode";

const ESTILOS_ESTADO = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    LLEGO: 'bg-blue-100 text-blue-800',
    DESCARGANDO: 'bg-purple-100 text-purple-800',
    FINALIZADO: 'bg-green-100 text-green-800',
    RETIRADO: 'bg-gray-200 text-gray-800',
};

const getTurno = (fecha) => {
    if (!fecha) return 'N/A';
    const hora = new Date(fecha).getHours();
    return (hora >= 7 && hora < 19) ? 'Día' : 'Noche';
};

export default function RegistroCitas() {
    const navigate = useNavigate();
    const [citas, setCitas] = useState([]);
    const [locadores, setLocadores] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'descending' });

    const [filtros, setFiltros] = useState({
        fechaInicio: '',
        fechaFin: '',
        locatarioId: '',
        proveedorId: '',
        estado: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }
            const decoded = jwtDecode(token);
            if (decoded.rol !== 'OPERADOR' && decoded.rol !== 'ADMIN') {
                alert("Acceso denegado.");
                navigate("/");
                return;
            }

            const [citasRes, locadoresRes, proveedoresRes] = await Promise.all([
                api.get('/citas'),
                api.get('/locadores'),
                api.get('/proveedores')
            ]);
            setCitas(citasRes.data);
            setLocadores(locadoresRes.data);
            setProveedores(proveedoresRes.data);
        } catch (error) {
            console.error("Error cargando datos iniciales:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFiltros({ fechaInicio: '', fechaFin: '', locatarioId: '', proveedorId: '', estado: '' });
    };

    const filteredCitas = useMemo(() => {
        return citas.filter(cita => {
            const fechaCita = new Date(cita.fechaCita);
            const filtroInicio = filtros.fechaInicio ? startOfDay(new Date(filtros.fechaInicio)) : null;
            const filtroFin = filtros.fechaFin ? endOfDay(new Date(filtros.fechaFin)) : null;

            if (filtroInicio && fechaCita < filtroInicio) return false;
            if (filtroFin && fechaCita > filtroFin) return false;
            if (filtros.locatarioId && cita.locatarioId !== parseInt(filtros.locatarioId)) return false;
            if (filtros.proveedorId && cita.proveedorId !== parseInt(filtros.proveedorId)) return false;
            if (filtros.estado && cita.estado !== filtros.estado) return false;
            
            return true;
        });
    }, [citas, filtros]);

    const sortedCitas = useMemo(() => {
        let sortableItems = [...filteredCitas];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = sortConfig.key.split('.').reduce((o, i) => o?.[i], a) || '';
                const valB = sortConfig.key.split('.').reduce((o, i) => o?.[i], b) || '';
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredCitas, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const exportToCSV = () => {
        const dataToExport = sortedCitas.map(c => ({
            'ID': c.id,
            'Vehiculo': c.placaVehiculo || 'N/A',
            'Fecha de Cita': format(new Date(c.fechaCita), 'dd/MM/yyyy'),
            'Proveedor': c.proveedor?.nombre || 'N/A',
            'RUC Proveedor': c.proveedor?.ruc || 'N/A',
            'Locatario': c.locatario?.nombre || 'N/A',
            'RUC Locatario': c.locatario?.ruc || 'N/A',
            'DNI Chofer': c.dniChofer || 'N/A',
            'Chofer': c.nombreChofer || 'N/A',
            'Auxiliares': Array.isArray(c.acompanantes) ? c.acompanantes.join(', ') : '',
            'Fecha Ingreso': c.horaIngreso ? format(new Date(c.horaIngreso), 'dd/MM/yyyy HH:mm:ss') : 'N/A',
            'Inicio Descarga': c.horaDescarga ? format(new Date(c.horaDescarga), 'HH:mm:ss') : 'N/A',
            'Fin Descarga': c.horaFinaliza ? format(new Date(c.horaFinaliza), 'HH:mm:ss') : 'N/A',
            'Fecha Salida': c.horaSalida ? format(new Date(c.horaSalida), 'HH:mm:ss') : 'N/A',
            'Turno': getTurno(c.horaIngreso),
            'Observaciones': c.incidentes?.[0]?.what || '',
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_operaciones_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <div className="p-4 text-center">Cargando datos...</div>;
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-screen-2xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft size={16} /> Volver
                </button>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Registro de Operaciones</h1>
                    <button onClick={exportToCSV} className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <Download size={16} /> Exportar a CSV
                    </button>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm border mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <FilterInput label="Fecha Inicio" name="fechaInicio" type="date" value={filtros.fechaInicio} onChange={handleFilterChange} />
                        <FilterInput label="Fecha Fin" name="fechaFin" type="date" value={filtros.fechaFin} onChange={handleFilterChange} />
                        <FilterSelect label="Locatario" name="locatarioId" value={filtros.locatarioId} onChange={handleFilterChange} options={locadores} />
                        <FilterSelect label="Proveedor" name="proveedorId" value={filtros.proveedorId} onChange={handleFilterChange} options={proveedores} />
                        <FilterSelect label="Estado" name="estado" value={filtros.estado} onChange={handleFilterChange} options={Object.keys(ESTILOS_ESTADO).map(k => ({id: k, nombre: k}))} />
                    </div>
                     <div className="flex gap-4 mt-4">
                        <button onClick={clearFilters} className="flex items-center gap-2 text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-300">
                            <X size={16} /> Limpiar Filtros
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="ID" sortKey="id" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Vehículo" sortKey="placaVehiculo" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Fecha Cita" sortKey="fechaCita" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Proveedor" sortKey="proveedor.nombre" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Locatario" sortKey="locatario.nombre" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Fecha Ingreso" sortKey="horaIngreso" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Inicio Descarga" sortKey="horaDescarga" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Fin Descarga" sortKey="horaFinaliza" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3"><SortableHeader label="Fecha Salida" sortKey="horaSalida" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-4 py-3">Turno</th>
                                    <th scope="col" className="px-4 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCitas.map(cita => (
                                    <tr key={cita.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{cita.id}</td>
                                        <td className="px-4 py-3 font-bold text-blue-600">{cita.placaVehiculo || 'N/A'}</td>
                                        <td className="px-4 py-3">{format(new Date(cita.fechaCita), 'dd/MM/yy')}</td>
                                        <td className="px-4 py-3">{cita.proveedor?.nombre || 'N/A'}</td>
                                        <td className="px-4 py-3">{cita.locatario?.nombre || 'N/A'}</td>
                                        <td className="px-4 py-3">{cita.horaIngreso ? format(new Date(cita.horaIngreso), 'dd/MM/yy HH:mm') : 'N/A'}</td>
                                        <td className="px-4 py-3">{cita.horaDescarga ? format(new Date(cita.horaDescarga), 'HH:mm:ss') : 'N/A'}</td>
                                        <td className="px-4 py-3">{cita.horaFinaliza ? format(new Date(cita.horaFinaliza), 'HH:mm:ss') : 'N/A'}</td>
                                        <td className="px-4 py-3">{cita.horaSalida ? format(new Date(cita.horaSalida), 'HH:mm:ss') : 'N/A'}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTurno(cita.horaIngreso) === 'Día' ? 'bg-blue-100 text-blue-800' : 'bg-gray-700 text-white'}`}>{getTurno(cita.horaIngreso)}</span></td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setCitaSeleccionada(cita)} className="font-medium text-blue-600 hover:underline">Detalles</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {citaSeleccionada && <HistorialModal cita={citaSeleccionada} onClose={() => setCitaSeleccionada(null)} />}
        </div>
    );
}

const FilterInput = ({ label, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border rounded-md text-sm" />
    </div>
);

const FilterSelect = ({ label, name, value, onChange, options }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <select name={name} value={value} onChange={onChange} className="w-full p-2 border rounded-md text-sm">
            <option value="">Todos</option>
            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.nombre}</option>)}
        </select>
    </div>
);

const SortableHeader = ({ label, sortKey, requestSort, sortConfig }) => (
    <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1 hover:text-gray-900">
        {label}
        <ArrowUpDown size={14} className={`transition-transform ${sortConfig.key === sortKey ? 'text-blue-600' : 'text-gray-400'} ${sortConfig.direction === 'ascending' ? 'rotate-180' : ''}`} />
    </button>
);
