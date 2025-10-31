import { useState, useRef, useEffect } from "react";
import { Shift, Staff } from "@/types/shift";
import { DAYS, TIME_SLOTS, getTimeSlotIndex } from "@/lib/timeUtils";
import { ResizableShift } from "./ResizableShift";

interface ScheduleGridProps {
  shifts: Shift[];
  staff: Staff[];
  onRemoveShift: (shiftId: string) => void;
  onResizeShift: (shiftId: string, newEndTime: string) => void;
  selectedCells: Set<string>;
  onSelectionChange: (cells: Set<string>) => void;
}

interface CellProps {
  day: string;
  time: string;
  isSelected: boolean;
  onMouseDown: (day: string, time: string) => void;
  onMouseEnter: (day: string, time: string) => void;
}

const Cell = ({ day, time, isSelected, onMouseDown, onMouseEnter }: CellProps) => {
  return (
    <div
      className={`relative min-h-[3rem] border border-border transition-colors cursor-crosshair ${
        isSelected ? "bg-accent/40" : "bg-card hover:bg-accent/10"
      }`}
      onMouseDown={() => onMouseDown(day, time)}
      onMouseEnter={() => onMouseEnter(day, time)}
    />
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
  const [selectionStart, setSelectionStart] = useState<{ day: string; time: string } | null>(null);
  const getDayIndex = (day: string) => DAYS.indexOf(day);

  const handleMouseDown = (day: string, time: string) => {
    setIsSelecting(true);
    setSelectionStart({ day, time });
    onSelectionChange(new Set([`${day}-${time}`]));
  };

  const handleMouseEnter = (day: string, time: string) => {
    if (!isSelecting || !selectionStart) return;

    const startDayIndex = DAYS.indexOf(selectionStart.day);
    const endDayIndex = DAYS.indexOf(day);
    const startTimeIndex = TIME_SLOTS.indexOf(selectionStart.time);
    const endTimeIndex = TIME_SLOTS.indexOf(time);

    const minDay = Math.min(startDayIndex, endDayIndex);
    const maxDay = Math.max(startDayIndex, endDayIndex);
    const minTime = Math.min(startTimeIndex, endTimeIndex);
    const maxTime = Math.max(startTimeIndex, endTimeIndex);

    const newSelection = new Set<string>();
    for (let d = minDay; d <= maxDay; d++) {
      for (let t = minTime; t <= maxTime; t++) {
        newSelection.add(`${DAYS[d]}-${TIME_SLOTS[t]}`);
      }
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
      <div className="inline-block min-w-full relative">
        <div 
          className="grid grid-cols-[100px_repeat(7,minmax(120px,1fr))] gap-0 border border-border rounded-lg overflow-hidden select-none"
          onMouseLeave={() => setIsSelecting(false)}
        >
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
                <Cell
                  key={`${day}-${time}`}
                  day={day}
                  time={time}
                  isSelected={selectedCells.has(`${day}-${time}`)}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                />
              ))}
            </>
          ))}
        </div>

        {/* Render all shifts as absolute overlays */}
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="grid gap-0"
            style={{
              gridTemplateColumns: '100px repeat(7, minmax(120px, 1fr))',
              gridTemplateRows: `auto repeat(${TIME_SLOTS.length}, minmax(3rem, auto))`
            }}
          >
            {/* Match the exact structure of the main grid */}
            {/* Header row - 8 cells */}
            <div />
            {DAYS.map((day) => <div key={`header-${day}`} />)}
            
            {/* Time slot rows */}
            {TIME_SLOTS.map((time) => (
              <>
                {/* Time label cell */}
                <div key={`time-${time}`} />
                {/* Day cells */}
                {DAYS.map((day) => (
                  <div key={`cell-${day}-${time}`} />
                ))}
              </>
            ))}
            
            {/* Render shifts */}
            {shifts.map((shift) => {
              const staffMember = staff.find((s) => s.id === shift.staffId);
              if (!staffMember) return null;

              const startRow = getTimeSlotIndex(shift.startTime) + 2;
              const endRow = getTimeSlotIndex(shift.endTime) + 3;
              const column = getDayIndex(shift.day) + 2;

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
    </div>
  );
};
