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
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
  onResizeShift: (shiftId: string, newEndTime: string) => void;
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

  // Find shifts that start at this time slot
  const cellShifts = shifts.filter(
    (shift) => shift.day === day && shift.startTime === time
  );

  // Check if this cell is occupied by a shift that started earlier
  const isOccupied = shifts.some((shift) => {
    if (shift.day !== day) return false;
    const shiftStartIndex = getTimeSlotIndex(shift.startTime);
    const shiftEndIndex = getTimeSlotIndex(shift.endTime);
    return timeIndex > shiftStartIndex && timeIndex < shiftEndIndex;
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[3rem] border border-border transition-colors ${
        isOver && !isOccupied ? "bg-accent/20" : "bg-card"
      }`}
      style={{ position: "relative" }}
    >
      {cellShifts.map((shift) => {
        const staffMember = staff.find((s) => s.id === shift.staffId);
        if (!staffMember) return null;

        return (
          <ResizableShift
            key={shift.id}
            shift={shift}
            staff={staffMember}
            day={day}
            onResize={onResizeShift}
            onRemove={onRemoveShift}
          />
        );
      })}
    </div>
  );
};

export const ScheduleGrid = ({ shifts, staff, onRemoveShift, onResizeShift }: ScheduleGridProps) => {
  return (
    <div className="overflow-auto">
      <div className="inline-block min-w-full">
        <div className="grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] gap-0 border border-border rounded-lg overflow-hidden">
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
                  shifts={shifts}
                  staff={staff}
                  onRemoveShift={onRemoveShift}
                  onResizeShift={onResizeShift}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
};
