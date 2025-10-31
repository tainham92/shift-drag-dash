import { useState, useRef, useEffect } from "react";
import { Staff, Shift } from "@/types/shift";
import { getStaffColor, TIME_SLOTS, getTimeSlotIndex, DAYS, getDayIndex } from "@/lib/timeUtils";
import { GripVertical, GripHorizontal } from "lucide-react";

interface ResizableShiftProps {
  shift: Shift;
  staff: Staff;
  onResize: (shiftId: string, updates: { startTime?: string; endTime?: string; startDay?: string; endDay?: string }) => void;
  onRemove: (shiftId: string) => void;
}

type ResizeEdge = "top" | "bottom" | "left" | "right" | null;

export const ResizableShift = ({
  shift,
  staff,
  onResize,
  onRemove,
}: ResizableShiftProps) => {
  const [resizingEdge, setResizingEdge] = useState<ResizeEdge>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialState = useRef<{ startTime: string; endTime: string; startDay: string; endDay: string }>({
    startTime: shift.startTime,
    endTime: shift.endTime,
    startDay: shift.startDay,
    endDay: shift.endDay,
  });

  const startTimeIndex = getTimeSlotIndex(shift.startTime);
  const endTimeIndex = getTimeSlotIndex(shift.endTime);
  const startDayIndex = getDayIndex(shift.startDay);
  const endDayIndex = getDayIndex(shift.endDay);

  // Grid positioning: +2 because of header row and time column
  const gridRowStart = startTimeIndex + 2;
  const gridRowEnd = endTimeIndex + 2;
  const gridColumnStart = startDayIndex + 2;
  const gridColumnEnd = endDayIndex + 3;

  const color = getStaffColor(staff.colorIndex);

  useEffect(() => {
    if (!resizingEdge) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!shiftRef.current) return;

      const grid = shiftRef.current.parentElement;
      if (!grid) return;

      // Get a reference cell to calculate dimensions
      const firstCell = grid.querySelector('[class*="min-h-"]');
      if (!firstCell) return;

      const updates: { startTime?: string; endTime?: string; startDay?: string; endDay?: string } = {};

      if (resizingEdge === "bottom" || resizingEdge === "top") {
        // Vertical resize (time)
        const cellHeight = (firstCell as HTMLElement).offsetHeight;
        const deltaY = e.clientY - startPos.current.y;
        const cellsMoved = Math.round(deltaY / cellHeight);

        if (resizingEdge === "bottom") {
          const newEndIndex = Math.min(
            TIME_SLOTS.length,
            Math.max(startTimeIndex + 1, getTimeSlotIndex(initialState.current.endTime) + cellsMoved)
          );
          updates.endTime = TIME_SLOTS[newEndIndex - 1] || TIME_SLOTS[TIME_SLOTS.length - 1];
        } else {
          const newStartIndex = Math.max(
            0,
            Math.min(endTimeIndex - 1, getTimeSlotIndex(initialState.current.startTime) + cellsMoved)
          );
          updates.startTime = TIME_SLOTS[newStartIndex];
        }
      } else if (resizingEdge === "left" || resizingEdge === "right") {
        // Horizontal resize (day)
        const cellWidth = (firstCell as HTMLElement).offsetWidth;
        const deltaX = e.clientX - startPos.current.x;
        const cellsMoved = Math.round(deltaX / cellWidth);

        if (resizingEdge === "right") {
          const newEndDayIndex = Math.min(
            DAYS.length - 1,
            Math.max(startDayIndex, getDayIndex(initialState.current.endDay) + cellsMoved)
          );
          updates.endDay = DAYS[newEndDayIndex];
        } else {
          const newStartDayIndex = Math.max(
            0,
            Math.min(endDayIndex, getDayIndex(initialState.current.startDay) + cellsMoved)
          );
          updates.startDay = DAYS[newStartDayIndex];
        }
      }

      if (Object.keys(updates).length > 0) {
        onResize(shift.id, updates);
      }
    };

    const handleMouseUp = () => {
      setResizingEdge(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingEdge, shift.id, startTimeIndex, endTimeIndex, startDayIndex, endDayIndex, onResize]);

  const handleResizeStart = (edge: ResizeEdge) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingEdge(edge);
    startPos.current = { x: e.clientX, y: e.clientY };
    initialState.current = {
      startTime: shift.startTime,
      endTime: shift.endTime,
      startDay: shift.startDay,
      endDay: shift.endDay,
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click to remove
      onRemove(shift.id);
    }
  };

  return (
    <div
      ref={shiftRef}
      onClick={handleClick}
      className="group cursor-pointer border border-white/20"
      style={{
        backgroundColor: color,
        gridRowStart,
        gridRowEnd,
        gridColumnStart,
        gridColumnEnd,
        zIndex: resizingEdge ? 50 : 10,
        opacity: resizingEdge ? 0.8 : 1,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-medium text-white bg-black/30 px-2 py-1 rounded">
          Double-click to remove
        </span>
      </div>
      
      {/* Top resize handle */}
      <div
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart("top")}
      >
        <GripVertical className="h-3 w-3 text-white/70" />
      </div>

      {/* Bottom resize handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart("bottom")}
      >
        <GripVertical className="h-3 w-3 text-white/70" />
      </div>

      {/* Left resize handle */}
      <div
        className="absolute top-0 left-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart("left")}
      >
        <GripHorizontal className="h-3 w-3 text-white/70 rotate-90" />
      </div>

      {/* Right resize handle */}
      <div
        className="absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart("right")}
      >
        <GripHorizontal className="h-3 w-3 text-white/70 rotate-90" />
      </div>
    </div>
  );
};
