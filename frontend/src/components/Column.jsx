import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useMemo } from "react";
import { CardCita } from "./CardCita";

export const Column = ({ id, title, citas, onCardClick, onUpdateState, onEditClick, onReportIncident, isOver, expandedCitaId, onExpandCita, isMobile }) => {
  const citasIds = useMemo(() => citas.map((c) => c.id), [citas]);
  const { setNodeRef } = useSortable({ id, data: { type: "Column" }, disabled: isMobile });

  return (
    <div ref={setNodeRef} className={`w-full lg:w-1/3 flex-shrink-0 flex flex-col bg-gray-100 rounded-lg transition-colors duration-200 ${isOver ? 'bg-blue-100' : ''}`}>
      <div className="text-md font-bold text-gray-700 mb-2 p-2 sticky top-0 bg-gray-100 z-10">{title} ({citas.length})</div>
      <div className="flex flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={citasIds} disabled={isMobile}>
          {citas.length > 0 ? citas.map(cita => (
            <CardCita 
              key={cita.id} 
              cita={cita} 
              onCardClick={onCardClick}
              onUpdateState={onUpdateState}
              onEditClick={onEditClick}
              onReportIncident={onReportIncident}
              isExpanded={expandedCitaId === cita.id}
              onExpand={onExpandCita}
            />
          )) : <p className="text-center text-sm text-gray-500 p-4">No hay citas en esta columna.</p>}
        </SortableContext>
      </div>
    </div>
  );
};
