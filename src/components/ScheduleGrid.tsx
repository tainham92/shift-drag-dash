import { useState, useEffect } from "react";
import { Shift, Staff } from "@/types/shift";
import { DAYS, TIME_SLOTS, getTimeSlotIndex } from "@/lib/timeUtils";
import { ResizableShift } from "./ResizableShift";
import { getStaffColor } from "@/lib/timeUtils";

interface ScheduleGridProps {
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
  onResizeShift: (shiftId: string, newEndTime: string) => void;
  selectedCells: Set<string>;
  onSelectionChange: (cells: Set<string>) => void;
}

interface DayCellProps {
  staffId: string;
  day: string;
  shifts: Shift[];
  staff: Staff;
  isSelecting: boolean;
  selectionStart: { staffId: string; day: string; time: string } | null;
  selectedCells: Set<string>;
  onMouseDown: (staffId: string, day: string, time: string) => void;
  onMouseMove: (staffId: string, day: string, time: string) => void;
  onRemoveShift: (shiftId: string) => void;
  onResizeShift: (shiftId: string, newEndTime: string) => void;
}

const DayCell = ({
  staffId,
  day,
  shifts,
  staff,
  isSelecting,
  selectionStart,
  selectedCells,
  onMouseDown,
  onMouseMove,
  onRemoveShift,
  onResizeShift,
}: DayCellProps) => {
  const dayShifts = shifts.filter((s) => s.staffId === staffId && s.day === day);
  const color = getStaffColor(staff.colorIndex);

  return (
    <div className="relative h-full min-h-[120px] border-r border-border bg-card">
      {/* Time-based selection overlay */}
      <div className="absolute inset-0 grid grid-rows-[repeat(26,1fr)]">
        {TIME_SLOTS.map((time) => {
          const cellKey = `${staffId}-${day}-${time}`;
          const isSelected = selectedCells.has(cellKey);
          
          return (
            <div
              key={time}
              className={`border-b border-border/30 cursor-crosshair transition-colors ${
                isSelected ? "bg-accent/40" : "hover:bg-accent/20"
              }`}
              onMouseDown={() => onMouseDown(staffId, day, time)}
              onMouseEnter={() => onMouseMove(staffId, day, time)}
            />
          );
        })}
      </div>

      {/* Render shifts */}
      {dayShifts.map((shift) => {
        const startIndex = getTimeSlotIndex(shift.startTime);
        const endIndex = getTimeSlotIndex(shift.endTime);
        const totalSlots = TIME_SLOTS.length;
        
        const top = `${(startIndex / totalSlots) * 100}%`;
        const height = `${((endIndex - startIndex) / totalSlots) * 100}%`;

        return (
          <div
            key={shift.id}
            className="absolute left-0 right-0 px-1"
            style={{
              top,
              height,
            }}
          >
            <ResizableShift
              shift={shift}
              staff={staff}
              day={day}
              onResize={onResizeShift}
              onRemove={onRemoveShift}
              gridRow=""
              gridColumn={0}
            />
          </div>
        );
      })}
    </div>
  );
};

export const ScheduleGrid = ({ 
  shifts, 
  staff, 
  onRemoveShift, 
  onResizeShift, 
  selectedCells, 
  onSelectionChange 
}: ScheduleGridProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ staffId: string; day: string; time: string } | null>(null);

  const handleMouseDown = (staffId: string, day: string, time: string) => {
    setIsSelecting(true);
    setSelectionStart({ staffId, day, time });
    onSelectionChange(new Set([`${staffId}-${day}-${time}`]));
  };

  const handleMouseMove = (staffId: string, day: string, time: string) => {
    if (!isSelecting || !selectionStart || selectionStart.staffId !== staffId) return;

    const startTimeIndex = TIME_SLOTS.indexOf(selectionStart.time);
    const endTimeIndex = TIME_SLOTS.indexOf(time);

    const minTime = Math.min(startTimeIndex, endTimeIndex);
    const maxTime = Math.max(startTimeIndex, endTimeIndex);

    const newSelection = new Set<string>();
    for (let t = minTime; t <= maxTime; t++) {
      newSelection.add(`${staffId}-${day}-${TIME_SLOTS[t]}`);
    }
    onSelectionChange(newSelection);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false);
    };

    if (isSelecting) {
      document.addEventListener("mouseup", handleMouseUp);
      return () => document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isSelecting]);

  return (
    <div className="overflow-auto">
      <div 
        className="inline-block min-w-full border border-border rounded-lg overflow-hidden select-none"
        onMouseLeave={() => setIsSelecting(false)}
      >
        {/* Header Row */}
        <div className="grid grid-cols-[180px_repeat(7,minmax(140px,1fr))] bg-primary text-primary-foreground">
          <div className="p-3 font-semibold text-sm border-r border-primary-foreground/20">
            Staff Member
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="p-3 font-semibold text-sm text-center border-r border-primary-foreground/20 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Staff Rows */}
        {staff.map((staffMember) => {
          const color = getStaffColor(staffMember.colorIndex);
          
          return (
            <div
              key={staffMember.id}
              className="grid grid-cols-[180px_repeat(7,minmax(140px,1fr))] border-t border-border"
            >
              {/* Staff Name Cell */}
              <div
                className="p-3 font-medium text-sm flex items-center gap-2 border-r border-border bg-secondary/50"
                style={{
                  borderLeftColor: color,
                  borderLeftWidth: '4px',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{staffMember.name}</span>
              </div>

              {/* Day Cells */}
              {DAYS.map((day) => (
                <DayCell
                  key={`${staffMember.id}-${day}`}
                  staffId={staffMember.id}
                  day={day}
                  shifts={shifts}
                  staff={staffMember}
                  isSelecting={isSelecting}
                  selectionStart={selectionStart}
                  selectedCells={selectedCells}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onRemoveShift={onRemoveShift}
                  onResizeShift={onResizeShift}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
