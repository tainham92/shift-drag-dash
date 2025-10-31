import { useState, useRef, useEffect } from "react";
import { Staff, Shift } from "@/types/shift";
import { getStaffColor, TIME_SLOTS, getTimeSlotIndex, DAYS } from "@/lib/timeUtils";
import { GripVertical, GripHorizontal } from "lucide-react";

interface ResizableShiftProps {
  shift: Shift;
  staff: Staff;
  day: string;
  onResize: (shiftId: string, updates: { startTime?: string; endTime?: string; day?: string }) => void;
  onRemove: (shiftId: string) => void;
}

type ResizeEdge = "top" | "bottom" | "left" | "right" | null;

export const ResizableShift = ({
  shift,
  staff,
  day,
  onResize,
  onRemove,
}: ResizableShiftProps) => {
  const [resizingEdge, setResizingEdge] = useState<ResizeEdge>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialState = useRef<{ startTime: string; endTime: string; day: string }>({
    startTime: shift.startTime,
    endTime: shift.endTime,
    day: shift.day,
  });

  const startIndex = getTimeSlotIndex(shift.startTime);
  const endIndex = getTimeSlotIndex(shift.endTime);
  const rowSpan = Math.max(1, endIndex - startIndex);

  const color = getStaffColor(staff.colorIndex);

  useEffect(() => {
    if (!resizingEdge) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!shiftRef.current) return;

      const gridCell = shiftRef.current.parentElement;
      if (!gridCell) return;

      const updates: { startTime?: string; endTime?: string; day?: string } = {};

      if (resizingEdge === "bottom" || resizingEdge === "top") {
        // Vertical resize (time)
        const cellHeight = gridCell.offsetHeight;
        const deltaY = e.clientY - startPos.current.y;
        const cellsMoved = Math.round(deltaY / cellHeight);

        if (resizingEdge === "bottom") {
          const newEndIndex = Math.min(
            TIME_SLOTS.length - 1,
            Math.max(startIndex + 1, getTimeSlotIndex(initialState.current.endTime) + cellsMoved)
          );
          updates.endTime = TIME_SLOTS[newEndIndex];
        } else {
          const newStartIndex = Math.max(
            0,
            Math.min(endIndex - 1, getTimeSlotIndex(initialState.current.startTime) + cellsMoved)
          );
          updates.startTime = TIME_SLOTS[newStartIndex];
        }
      } else if (resizingEdge === "left" || resizingEdge === "right") {
        // Horizontal resize (day)
        const cellWidth = gridCell.offsetWidth;
        const deltaX = e.clientX - startPos.current.x;
        const cellsMoved = Math.round(deltaX / cellWidth);

        const currentDayIndex = DAYS.indexOf(initialState.current.day);
        let newDayIndex = currentDayIndex;

        if (resizingEdge === "right") {
          newDayIndex = Math.min(DAYS.length - 1, currentDayIndex + cellsMoved);
        } else {
          newDayIndex = Math.max(0, currentDayIndex + cellsMoved);
        }

        updates.day = DAYS[newDayIndex];
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
  }, [resizingEdge, shift.id, startIndex, endIndex, onResize]);

  const handleResizeStart = (edge: ResizeEdge) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingEdge(edge);
    startPos.current = { x: e.clientX, y: e.clientY };
    initialState.current = {
      startTime: shift.startTime,
      endTime: shift.endTime,
      day: shift.day,
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
      className="absolute inset-0 group cursor-pointer"
      style={{
        backgroundColor: color,
        gridRow: `span ${rowSpan}`,
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
