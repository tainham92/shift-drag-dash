import { useDroppable } from "@dnd-kit/core";
import { Shift, Staff } from "@/types/shift";
import { DAYS, TIME_SLOTS, getTimeSlotIndex } from "@/lib/timeUtils";
import { ResizableShift } from "./ResizableShift";

interface ScheduleGridProps {
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
  onResizeShift: (shiftId: string, updates: { startTime?: string; endTime?: string; startDay?: string; endDay?: string }) => void;
}

interface DroppableCellProps {
  day: string;
  time: string;
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
  onResizeShift: (shiftId: string, updates: { startTime?: string; endTime?: string; startDay?: string; endDay?: string }) => void;
}

const DroppableCell = ({ 
  day, 
  time, 
  shifts, 
  staff, 
  onRemoveShift,
  onResizeShift 
}: DroppableCellProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day}-${time}`,
    data: { day, time },
  });

  const timeIndex = getTimeSlotIndex(time);
  const dayIndex = DAYS.indexOf(day);

  // Check if this cell is occupied by any shift
  const isOccupied = shifts.some((shift) => {
    const shiftStartTimeIndex = getTimeSlotIndex(shift.startTime);
    const shiftEndTimeIndex = getTimeSlotIndex(shift.endTime);
    const shiftStartDayIndex = DAYS.indexOf(shift.startDay);
    const shiftEndDayIndex = DAYS.indexOf(shift.endDay);
    
    return (
      timeIndex >= shiftStartTimeIndex &&
      timeIndex < shiftEndTimeIndex &&
      dayIndex >= shiftStartDayIndex &&
      dayIndex <= shiftEndDayIndex
    );
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[3rem] border border-border transition-colors ${
        isOver && !isOccupied ? "bg-accent/20" : "bg-card"
      }`}
    />
  );
};

export const ScheduleGrid = ({ shifts, staff, onRemoveShift, onResizeShift }: ScheduleGridProps) => {
  return (
    <div className="overflow-auto">
      <div className="inline-block min-w-full relative">
        <div className="grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] auto-rows-[3rem] gap-0 border border-border rounded-lg overflow-hidden">
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

          {/* Time slots and cells */}
          {TIME_SLOTS.flatMap((time) => [
            <div
              key={`time-${time}`}
              className="bg-secondary font-medium p-3 text-sm border-t border-border"
            >
              {time}
            </div>,
            ...DAYS.map((day) => (
              <DroppableCell
                key={`${day}-${time}`}
                day={day}
                time={time}
                shifts={shifts}
                staff={staff}
                onRemoveShift={onRemoveShift}
                onResizeShift={onResizeShift}
              />
            ))
          ])}

          {/* Render all shifts as direct children of the grid */}
          {shifts.map((shift) => {
            const staffMember = staff.find((s) => s.id === shift.staffId);
            if (!staffMember) return null;

            return (
              <ResizableShift
                key={shift.id}
                shift={shift}
                staff={staffMember}
                onResize={onResizeShift}
                onRemove={onRemoveShift}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
