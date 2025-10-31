import { useDraggable } from "@dnd-kit/core";
import { Staff } from "@/types/shift";
import { getStaffColor } from "@/lib/timeUtils";
import { GripVertical } from "lucide-react";

interface StaffListProps {
  staff: Staff[];
}

interface DraggableStaffProps {
  staff: Staff;
}

const DraggableStaff = ({ staff }: DraggableStaffProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
    data: { staff },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const colors = [
    "hsl(var(--staff-1))",
    "hsl(var(--staff-2))",
    "hsl(var(--staff-3))",
    "hsl(var(--staff-4))",
    "hsl(var(--staff-5))",
    "hsl(var(--staff-6))",
  ];
  const color = colors[staff.colorIndex % colors.length];

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: `${color}15`,
        borderColor: color,
      }}
      className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-move transition-all hover:shadow-md"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium text-sm">{staff.name}</span>
    </div>
  );
};

export const StaffList = ({ staff }: StaffListProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        STAFF MEMBERS
      </h3>
      {staff.map((member) => (
        <DraggableStaff key={member.id} staff={member} />
      ))}
    </div>
  );
};
