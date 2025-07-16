import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { format, endOfDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Filter, X, ArrowUpDown, ArrowLeft, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import Papa from 'papaparse';

const SortableHeader = ({ label, sortKey, requestSort, sortConfig }) => (
    <button onClick={() => requestSort(sortKey)} className="flex items-center gap-1 hover:text-gray-900">
        {label}
        <ArrowUpDown size={14} className={`transition-transform ${sortConfig.key === sortKey ? 'text-blue-600' : 'text-gray-400'} ${sortConfig.direction === 'ascending' ? 'rotate-180' : ''}`} />
    </button>
);

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

export default function RegistroIncidentes() {
    const navigate = useNavigate();
    const [incidentes, setIncidentes] = useState([]);
    const [locadores, setLocadores] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);

    const [filtros, setFiltros] = useState({
        fechaInicio: '',
        fechaFin: '',
        locatarioId: '',
        proveedorId: '',
        placa: '',
    });

    const [sortConfig, setSortConfig] = useState({ key: 'fechaHora', direction: 'descending' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [incRes, locRes, provRes] = await Promise.all([
                api.get('/incidentes'),
                api.get('/locadores'),
                api.get('/proveedores')
            ]);
            setIncidentes(incRes.data);
            setLocadores(locRes.data);
            setProveedores(provRes.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
            alert("No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFiltros({ fechaInicio: '', fechaFin: '', locatarioId: '', proveedorId: '', placa: '' });
    };

    const filteredIncidentes = useMemo(() => {
        return incidentes.filter(inc => {
            const fechaIncidente = new Date(inc.fechaHora);
            const filtroInicio = filtros.fechaInicio ? startOfDay(new Date(filtros.fechaInicio)) : null;
            const filtroFin = filtros.fechaFin ? endOfDay(new Date(filtros.fechaFin)) : null;

            if (filtroInicio && fechaIncidente < filtroInicio) return false;
            if (filtroFin && fechaIncidente > filtroFin) return false;
            if (filtros.locatarioId && inc.cita.locatarioId !== parseInt(filtros.locatarioId)) return false;
            if (filtros.proveedorId && inc.cita.proveedorId !== parseInt(filtros.proveedorId)) return false;
            if (filtros.placa && !inc.cita.placaVehiculo?.toLowerCase().includes(filtros.placa.toLowerCase())) return false;
            
            return true;
        });
    }, [incidentes, filtros]);

    const sortedIncidentes = useMemo(() => {
        let sortableItems = [...filteredIncidentes];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const valA = sortConfig.key.split('.').reduce((o, i) => o?.[i], a) || '';
                const valB = sortConfig.key.split('.').reduce((o, i) => o?.[i], b) || '';
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredIncidentes, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const exportToCSV = () => {
        const dataToExport = sortedIncidentes.map(inc => ({
            ID_Incidente: inc.id,
            Fecha_Incidente: format(new Date(inc.fechaHora), 'dd/MM/yyyy HH:mm'),
            ID_Cita: inc.cita.id,
            Vehiculo_Placa: inc.cita.placaVehiculo || 'N/A',
            Proveedor: inc.cita.proveedor?.nombre || 'N/A',
            Locatario: inc.cita.locatario?.nombre || 'N/A',
            Chofer: inc.cita.nombreChofer || 'N/A',
            Reportado_Por: inc.usuario.nombre,
            Que_Paso: inc.what,
            Por_Que: inc.why,
            Donde: inc.where,
            Quien_es: inc.who,
            Como_se_soluciono: inc.how,
            Cuanto_costo: inc.howMuch || 'N/A',
            Archivos_Adjuntos: inc.archivos.length,
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_incidentes_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    if (loading) {
        return <div className="p-4 text-center">Cargando incidentes...</div>;
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft size={16} /> Volver
                </button>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Registro de Incidentes</h1>
                    <button onClick={exportToCSV} className="flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <Download size={16} /> Exportar a CSV
                    </button>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm border mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                        <FilterInput label="Fecha Inicio" name="fechaInicio" type="date" value={filtros.fechaInicio} onChange={handleFilterChange} />
                        <FilterInput label="Fecha Fin" name="fechaFin" type="date" value={filtros.fechaFin} onChange={handleFilterChange} />
                        <FilterInput label="Placa del Vehículo" name="placa" placeholder="ABC-123" value={filtros.placa} onChange={handleFilterChange} />
                        <FilterSelect label="Locatario" name="locatarioId" value={filtros.locatarioId} onChange={handleFilterChange} options={locadores} />
                        <FilterSelect label="Proveedor" name="proveedorId" value={filtros.proveedorId} onChange={handleFilterChange} options={proveedores} />
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
                                    <th scope="col" className="px-6 py-3 w-min"></th>
                                    <th scope="col" className="px-6 py-3"><SortableHeader label="ID Inc." sortKey="id" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-6 py-3"><SortableHeader label="Cita ID" sortKey="cita.id" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-6 py-3"><SortableHeader label="Placa" sortKey="cita.placaVehiculo" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-6 py-3"><SortableHeader label="Proveedor" sortKey="cita.proveedor.nombre" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-6 py-3"><SortableHeader label="Locatario" sortKey="cita.locatario.nombre" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-6 py-3"><SortableHeader label="Chofer" sortKey="cita.nombreChofer" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                    <th scope="col" className="px-6 py-3"><SortableHeader label="Fecha Incidente" sortKey="fechaHora" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedIncidentes.map(inc => (
                                    <IncidentRow key={inc.id} inc={inc} expandedRow={expandedRow} toggleRow={toggleRow} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

const IncidentRow = ({ inc, expandedRow, toggleRow }) => {
    const isExpanded = expandedRow === inc.id;
    return (
        <>
            <tr className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(inc.id)}>
                <td className="px-6 py-4">
                    <button className="p-1 rounded-full hover:bg-gray-200">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </td>
                <td className="px-6 py-4 font-mono text-gray-500">#{inc.id}</td>
                <td className="px-6 py-4 font-mono text-gray-500">#{inc.cita.id}</td>
                <td className="px-6 py-4 font-bold text-blue-600">{inc.cita.placaVehiculo || 'N/A'}</td>
                <td className="px-6 py-4">{inc.cita.proveedor?.nombre || 'N/A'}</td>
                <td className="px-6 py-4">{inc.cita.locatario?.nombre || 'N/A'}</td>
                <td className="px-6 py-4">{inc.cita.nombreChofer || 'N/A'}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{format(new Date(inc.fechaHora), 'dd/MM/yy HH:mm')}</td>
            </tr>
            {isExpanded && (
                <tr className="bg-gray-50">
                    <td colSpan="8" className="p-4">
                        <div className="p-4 bg-white rounded border grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                           <DetailItem label="¿Qué Pasó?" value={inc.what} />
                           <DetailItem label="¿Por Qué Pasó?" value={inc.why} />
                           <DetailItem label="¿Dónde Pasó?" value={inc.where} />
                           <DetailItem label="¿Quién(es) Estuvieron Involucrados?" value={inc.who} />
                           <DetailItem label="¿Cómo se Solucionó?" value={inc.how} />
                           <DetailItem label="¿Cuánto Costó?" value={inc.howMuch || 'No especificado'} />
                           <div className="col-span-2">
                               <p className="text-xs font-bold text-gray-600 uppercase mb-1">Archivos Adjuntos</p>
                               {inc.archivos.length > 0 ? (
                                   <div className="flex flex-wrap gap-2">
                                       {inc.archivos.map(file => (
                                           <a key={file.id} href={`${api.defaults.baseURL}${file.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                               {file.nombre}
                                           </a>
                                       ))}
                                   </div>
                               ) : <p className="text-sm text-gray-500">No hay archivos.</p>}
                           </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const DetailItem = ({ label, value }) => (
    <div>
        <p className="text-xs font-bold text-gray-600 uppercase">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
    </div>
);
