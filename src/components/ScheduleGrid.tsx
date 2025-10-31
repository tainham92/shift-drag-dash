import { useDroppable } from "@dnd-kit/core";
import { Shift, Staff } from "@/types/shift";
import { DAYS, TIME_SLOTS, getStaffColor } from "@/lib/timeUtils";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface ScheduleGridProps {
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
}

interface DroppableCellProps {
  day: string;
  time: string;
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
}

const DroppableCell = ({ day, time, shifts, staff, onRemoveShift }: DroppableCellProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day}-${time}`,
    data: { day, time },
  });

  const cellShifts = shifts.filter(
    (shift) => shift.day === day && shift.startTime === time
  );

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[3rem] border border-border p-1 transition-colors ${
        isOver ? "bg-accent/20" : "bg-card"
      }`}
    >
      {cellShifts.map((shift) => {
        const staffMember = staff.find((s) => s.id === shift.staffId);
        if (!staffMember) return null;

        const colors = [
          "hsl(var(--staff-1))",
          "hsl(var(--staff-2))",
          "hsl(var(--staff-3))",
          "hsl(var(--staff-4))",
          "hsl(var(--staff-5))",
          "hsl(var(--staff-6))",
        ];
        const color = colors[staffMember.colorIndex % colors.length];

        return (
          <div
            key={shift.id}
            className="group relative flex items-center gap-1 p-1.5 rounded text-xs font-medium mb-1"
            style={{
              backgroundColor: `${color}33`,
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: `${color}66`,
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="truncate flex-1">{staffMember.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemoveShift(shift.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export const ScheduleGrid = ({ shifts, staff, onRemoveShift }: ScheduleGridProps) => {
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
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
};
