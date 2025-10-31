import { useDroppable } from "@dnd-kit/core";
import { Shift, Staff } from "@/types/shift";
import { DAYS, TIME_SLOTS, getTimeSlotIndex } from "@/lib/timeUtils";
import { ResizableShift } from "./ResizableShift";

interface ScheduleGridProps {
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
  onResizeShift: (shiftId: string, newEndTime: string) => void;
}

interface DroppableCellProps {
  day: string;
  time: string;
}

const DroppableCell = ({ day, time }: DroppableCellProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day}-${time}`,
    data: { day, time },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[3rem] border border-border transition-colors ${
        isOver ? "bg-accent/20" : "bg-card"
      }`}
    />
  );
};

export const ScheduleGrid = ({ shifts, staff, onRemoveShift, onResizeShift }: ScheduleGridProps) => {
  const getDayIndex = (day: string) => DAYS.indexOf(day);

  return (
    <div className="overflow-auto">
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] gap-0 border border-border rounded-lg overflow-hidden relative">
          {/* Header */}
          <div className="bg-primary text-primary-foreground font-semibold p-3 text-sm">
            Time
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="bg-primary text-primary-foreground font-semibold p-3 text-sm text-center"
            >
              {day}
            </div>
          ))}

          {/* Time slots */}
          {TIME_SLOTS.map((time) => (
            <>
              <div
                key={`time-${time}`}
                className="bg-secondary font-medium p-3 text-sm border-t border-border"
              >
                {time}
              </div>
              {DAYS.map((day) => (
                <DroppableCell
                  key={`${day}-${time}`}
                  day={day}
                  time={time}
                />
              ))}
            </>
          ))}

          {/* Render all shifts as grid overlays */}
          {shifts.map((shift) => {
            const staffMember = staff.find((s) => s.id === shift.staffId);
            if (!staffMember) return null;

            const startRow = getTimeSlotIndex(shift.startTime) + 2; // +2 for header row
            const endRow = getTimeSlotIndex(shift.endTime) + 2;
            const column = getDayIndex(shift.day) + 2; // +2 for time column

            return (
              <ResizableShift
                key={shift.id}
                shift={shift}
                staff={staffMember}
                day={shift.day}
                onResize={onResizeShift}
                onRemove={onRemoveShift}
                gridRow={`${startRow} / ${endRow}`}
                gridColumn={column}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
