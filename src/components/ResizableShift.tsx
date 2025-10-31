import { useState, useRef, useEffect } from "react";
import { Staff, Shift } from "@/types/shift";
import { getStaffColor, TIME_SLOTS, getTimeSlotIndex } from "@/lib/timeUtils";
import { GripVertical } from "lucide-react";

interface ResizableShiftProps {
  shift: Shift;
  staff: Staff;
  day: string;
  onResize: (shiftId: string, newEndTime: string) => void;
  onRemove: (shiftId: string) => void;
  gridRow: string;
  gridColumn: number;
}

export const ResizableShift = ({
  shift,
  staff,
  day,
  onResize,
  onRemove,
  gridRow,
  gridColumn,
}: ResizableShiftProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const shiftRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const initialEndTime = useRef<string>(shift.endTime);
  const startRowRef = useRef<number>(0);

  const startIndex = getTimeSlotIndex(shift.startTime);
  const color = getStaffColor(staff.colorIndex);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!shiftRef.current) return;

      // Calculate how many rows we've moved based on pixel distance
      const rowHeight = 48; // min-h-[3rem] = 48px
      const deltaY = e.clientY - startY.current;
      const rowsMoved = Math.round(deltaY / rowHeight);

      const initialEndIndex = getTimeSlotIndex(initialEndTime.current);
      const newEndIndex = Math.min(
        TIME_SLOTS.length - 1,
        Math.max(startIndex + 1, initialEndIndex + rowsMoved)
      );

      if (newEndIndex !== getTimeSlotIndex(shift.endTime)) {
        onResize(shift.id, TIME_SLOTS[newEndIndex]);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, shift.id, shift.endTime, startIndex, onResize]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startY.current = e.clientY;
    initialEndTime.current = shift.endTime;
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
      className="group cursor-pointer border border-white/20 flex flex-col"
      style={{
        backgroundColor: color,
        gridRow: gridRow,
        gridColumn: gridColumn,
        zIndex: isResizing ? 50 : 10,
        opacity: isResizing ? 0.8 : 1,
      }}
    >
      <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
        <span className="text-xs font-medium text-white bg-black/30 px-2 py-1 rounded">
          Double-click to remove
        </span>
      </div>
      
      <div
        className="h-3 cursor-ns-resize bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart}
      >
        <GripVertical className="h-3 w-3 text-white/70" />
      </div>
    </div>
  );
};
