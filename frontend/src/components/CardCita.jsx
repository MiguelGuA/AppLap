import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GripVertical, User, Building, Clock, Edit, History, AlertCircle, LogIn, Truck, CheckCircle, LogOut, ShieldAlert } from 'lucide-react';

const ESTILOS_ESTADO = {
  PENDIENTE: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-l-4 border-yellow-400', icon: <Clock size={12} /> },
  LLEGO: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-l-4 border-blue-400', icon: <LogIn size={12} /> },
  DESCARGANDO: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-l-4 border-purple-400', icon: <Truck size={12} /> },
  FINALIZADO: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-l-4 border-green-400', icon: <CheckCircle size={12} /> },
  RETIRADO: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-l-4 border-gray-400', icon: <LogOut size={12} /> },
};

export const CardCita = ({ cita, onCardClick, onUpdateState, onEditClick, onReportIncident, isExpanded, onExpand }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: cita.id, 
    data: { type: "Cita", cita },
    disabled: cita.requiereConfirmacion
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const estiloEstado = ESTILOS_ESTADO[cita.estado] || ESTILOS_ESTADO.PENDIENTE;

  const renderActionButton = () => {
    if (cita.requiereConfirmacion) return null;
    switch (cita.estado) {
      case 'PENDIENTE':
        return <button onClick={(e) => { e.stopPropagation(); onUpdateState(cita.id, 'LLEGO'); }} className="w-full mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600">Marcar Llegó</button>;
      case 'LLEGO':
        return <button onClick={(e) => { e.stopPropagation(); onUpdateState(cita.id, 'DESCARGANDO'); }} className="w-full mt-2 text-xs bg-purple-500 text-white px-2 py-1 rounded-md hover:bg-purple-600">Iniciar Descarga</button>;
      case 'DESCARGANDO':
        return <button onClick={(e) => { e.stopPropagation(); onUpdateState(cita.id, 'FINALIZADO'); }} className="w-full mt-2 text-xs bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600">Finalizar</button>;
      case 'FINALIZADO':
        return <button onClick={(e) => { e.stopPropagation(); onUpdateState(cita.id, 'RETIRADO'); }} className="w-full mt-2 text-xs bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600">Retirar</button>;
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onExpand(cita.id)}
      className={`bg-white rounded-lg shadow-sm border touch-none relative overflow-hidden transition-all duration-200 ${estiloEstado.border} ${isDragging ? 'opacity-50 scale-105' : 'hover:shadow-md'} ${cita.requiereConfirmacion ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {cita.requiereConfirmacion && (
        <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-[10px] font-bold text-center py-0.5"
             onClick={(e) => { e.stopPropagation(); onEditClick(cita); }}>
          REQUIERE CONFIRMACIÓN
        </div>
      )}
      <div className={`p-2.5 ${cita.requiereConfirmacion ? 'pt-5' : ''}`}>
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span>{cita.placaVehiculo || 'Placa no asignada'}</span>
              <span className="font-mono text-xs text-gray-400">N° Cita: {cita.id}</span>
            </p>
            <p className="text-xs font-semibold text-gray-600">{cita.proveedor?.nombre || 'Proveedor no definido'}</p>
          </div>
          <div {...attributes} {...listeners} className={`p-1 ${cita.requiereConfirmacion ? 'cursor-not-allowed' : 'cursor-grab'}`}>
            <GripVertical size={18} className="text-gray-400" />
          </div>
        </div>

        <div className="mt-2 space-y-1 text-[11px] text-gray-600">
            <div className="flex items-center gap-1.5">
                <Building size={12} />
                <span>{cita.locatario?.nombre || 'Locatario no definido'}</span>
            </div>
        </div>

        <div className={`transition-all duration-300 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100 pt-2' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
                <div className="border-t my-2"></div>
                 <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mb-2">
                    <User size={12} />
                    <span>{cita.nombreChofer || 'Chofer no asignado'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${estiloEstado.bg} ${estiloEstado.text}`}>
                        {estiloEstado.icon}
                        {cita.estado}
                    </span>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1"><Clock size={12} />{format(new Date(cita.fechaCita), "p", { locale: es })}</span>
                        <button onClick={(e) => { e.stopPropagation(); onReportIncident(cita); }} className="p-1 text-red-500 hover:bg-red-100 rounded-full" title="Reportar Incidente"><ShieldAlert size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onCardClick(cita); }} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full" title="Ver Historial"><History size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onEditClick(cita); }} className="p-1 text-gray-500 hover:bg-gray-200 rounded-full" title="Editar Cita"><Edit size={14} /></button>
                    </div>
                </div>
                {renderActionButton()}
            </div>
        </div>
      </div>
    </div>
  );
};
