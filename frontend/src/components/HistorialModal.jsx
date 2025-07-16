import { format, intervalToDuration, formatDuration } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Clock, Truck, CheckCircle, LogOut, LogIn } from 'lucide-react';

export const HistorialModal = ({ cita, onClose }) => {
  if (!cita) return null;

  const { horaIngreso, horaDescarga, horaFinaliza, horaSalida, placaVehiculo } = cita;

  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin) return null;
    const duracion = intervalToDuration({ start: new Date(inicio), end: new Date(fin) });
    return formatDuration(duracion, { format: ['hours', 'minutes', 'seconds'], locale: es });
  };
  
  const tiempoEspera = calcularDuracion(horaIngreso, horaDescarga);
  const tiempoDescarga = calcularDuracion(horaDescarga, horaFinaliza);
  const esperaRetiro = calcularDuracion(horaFinaliza, horaSalida);
  const tiempoTotal = calcularDuracion(horaIngreso, horaSalida);

  const renderTimelineEvent = (label, time, duration, icon, isLast = false) => (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${time ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {icon}
        </div>
        {!isLast && <div className="w-px h-16 bg-gray-200"></div>}
      </div>
      <div className="pb-8 pt-2">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-gray-600">{time ? format(new Date(time), 'dd/MM/yy hh:mm:ss a', { locale: es }) : 'Pendiente'}</p>
        {duration && <p className="text-xs text-gray-500 mt-1">Duración: <span className="font-semibold">{duration}</span></p>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Historial de la Cita</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="bg-gray-50 p-3 rounded-md border">
                <h3 className="font-semibold text-gray-700 mb-2">Detalles del Vehículo</h3>
                <p className="text-sm text-gray-600">Placa: <span className="font-bold text-lg text-blue-600">{placaVehiculo || 'No asignada'}</span></p>
                <p className="text-sm text-gray-600">Proveedor: <span className="font-semibold">{cita.proveedor?.nombre || 'N/A'}</span></p>
                <p className="text-sm text-gray-600">Locatario: <span className="font-semibold">{cita.locatario?.nombre || 'N/A'}</span></p>
            </div>
            <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-4">Línea de Tiempo</h3>
                {renderTimelineEvent("Llegó al Muelle", horaIngreso, tiempoEspera, <LogIn size={20} />, !horaDescarga && !horaFinaliza && !horaSalida)}
                {renderTimelineEvent("Inició Descarga", horaDescarga, tiempoDescarga, <Truck size={20} />, !horaFinaliza && !horaSalida)}
                {renderTimelineEvent("Finalizó Descarga", horaFinaliza, esperaRetiro, <CheckCircle size={20} />, !horaSalida)}
                {renderTimelineEvent("Se Retiró del Muelle", horaSalida, null, <LogOut size={20} />, true)}
            </div>
             {tiempoTotal && (
                <div className="border-t mt-4 pt-4 text-center">
                    <p className="text-sm font-semibold text-gray-700">Tiempo Total en Operación</p>
                    <p className="text-2xl font-bold text-blue-600">{tiempoTotal}</p>
                </div>
             )}
        </div>
      </div>
    </div>
  );
};
