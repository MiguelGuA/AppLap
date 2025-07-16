import { useDraggable } from "@dnd-kit/core";

export default function CitaCard({ cita }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: cita.id,
  });

  const style = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="bg-white p-2 rounded mb-2 shadow-sm"
    >
      <p className="font-semibold">{cita.proveedor.nombre}</p>
      <p className="text-sm">{cita.chofer.nombre} - {cita.chofer.placa}</p>
      <p className="text-xs text-gray-500">{new Date(cita.fechaCita).toLocaleTimeString()}</p>
    </div>
  );
}