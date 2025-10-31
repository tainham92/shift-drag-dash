import { Staff } from "@/types/shift";
import { getStaffColor } from "@/lib/timeUtils";

interface StaffListProps {
  staff: Staff[];
  onStaffClick: (staffId: string) => void;
}

interface StaffItemProps {
  staff: Staff;
  onClick: () => void;
}

const StaffItem = ({ staff, onClick }: StaffItemProps) => {
  const color = getStaffColor(staff.colorIndex);

  return (
    <button
      onClick={onClick}
      style={{ 
        backgroundColor: `${color}15`,
        borderColor: color,
      }}
      className="w-full flex items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105 active:scale-95 hover:shadow-md"
    >
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium text-sm">{staff.name}</span>
    </button>
  );
};

export const StaffList = ({ staff, onStaffClick }: StaffListProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        STAFF MEMBERS
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Click to edit staff details or delete
      </p>
      {staff.map((member) => (
        <StaffItem 
          key={member.id} 
          staff={member} 
          onClick={() => onStaffClick(member.id)}
        />
      ))}
    </div>
  );
};
