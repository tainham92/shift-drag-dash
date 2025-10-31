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
}

export const ResizableShift = ({
  shift,
  staff,
  day,
  onResize,
  onRemove,
}: ResizableShiftProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const shiftRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const initialEndTime = useRef<string>(shift.endTime);

  const startIndex = getTimeSlotIndex(shift.startTime);
  const endIndex = getTimeSlotIndex(shift.endTime);
  const rowSpan = Math.max(1, endIndex - startIndex);

  const color = getStaffColor(staff.colorIndex);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!shiftRef.current) return;

      const gridCell = shiftRef.current.parentElement;
      if (!gridCell) return;

      const cellHeight = gridCell.offsetHeight;
      const deltaY = e.clientY - startY.current;
      const cellsMoved = Math.round(deltaY / cellHeight);

      const newEndIndex = Math.min(
        TIME_SLOTS.length - 1,
        Math.max(startIndex + 1, getTimeSlotIndex(initialEndTime.current) + cellsMoved)
      );

      onResize(shift.id, TIME_SLOTS[newEndIndex]);
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
  }, [isResizing, shift.id, startIndex, onResize]);

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
      className="absolute inset-0 group cursor-pointer"
      style={{
        backgroundColor: color,
        gridRow: `span ${rowSpan}`,
        zIndex: isResizing ? 50 : 10,
        opacity: isResizing ? 0.8 : 1,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-medium text-white bg-black/30 px-2 py-1 rounded">
          Double-click to remove
        </span>
      </div>
      
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors"
        onMouseDown={handleResizeStart}
      >
        <GripVertical className="h-3 w-3 text-white/70" />
      </div>
    </div>
  );
};
