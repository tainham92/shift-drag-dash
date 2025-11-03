import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Filter, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Shift as ShiftType, ShiftType as ShiftTypeEnum } from "@/types/shift";
import { format } from "date-fns";

interface EmployeeShiftsTableProps {
  shifts: ShiftType[];
  onRefresh: () => void;
  onEditShift: (shift: ShiftType) => void;
  onAddShift: () => void;
}

export const EmployeeShiftsTable = ({ shifts, onRefresh, onEditShift, onAddShift }: EmployeeShiftsTableProps) => {
  const [filterType, setFilterType] = useState<string>("all");

  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const groupShiftsByDay = () => {
    const grouped: Record<string, ShiftType[]> = {};
    
    // Initialize all days with empty arrays
    WEEKDAYS.forEach(day => {
      grouped[day] = [];
    });

    // Group shifts by day of week
    shifts.forEach(shift => {
      const date = new Date(shift.day);
      const dayName = format(date, "EEEE");
      if (grouped[dayName]) {
        grouped[dayName].push(shift);
      }
    });

    return grouped;
  };

  const handleDeleteShift = async (shiftId: string) => {
    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("id", shiftId);

    if (error) {
      toast.error("Failed to delete shift");
      return;
    }

    toast.success("Shift deleted");
    onRefresh();
  };

  const filterShifts = (dayShifts: ShiftType[]) => {
    if (filterType === "all") return dayShifts;
    return dayShifts.filter(shift => shift.type === filterType);
  };

  const getShiftTypeBadgeVariant = (type: ShiftTypeEnum) => {
    switch (type) {
      case "regular":
        return "default";
      case "flexible":
        return "secondary";
      case "leave":
        return "outline";
      case "week-off":
        return "outline";
      default:
        return "default";
    }
  };

  const groupedShifts = groupShiftsByDay();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="flexible">Flexible</SelectItem>
            <SelectItem value="leave">Leave</SelectItem>
            <SelectItem value="week-off">Week Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium w-32">Day</th>
              <th className="text-left p-3 font-medium">Shifts</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((dayName, idx) => {
              const dayShifts = filterShifts(groupedShifts[dayName]);
              
              return (
                <tr 
                  key={dayName} 
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <td className="p-3 font-medium align-top">{dayName}</td>
                  <td className="p-3">
                    {dayShifts.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {dayShifts.map(shift => {
                          const date = new Date(shift.day);
                          return (
                            <div 
                              key={shift.id}
                              className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getShiftTypeBadgeVariant(shift.type)} className="text-xs">
                                    {shift.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(date, "MMM d")}
                                  </span>
                                </div>
                                {(shift.type === "regular" || shift.type === "flexible") && (
                                  <span className="text-sm">
                                    {shift.startTime} - {shift.endTime}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteShift(shift.id)}
                                className="ml-2 hover:bg-destructive/20 rounded-full p-1 transition-colors"
                              >
                                <X className="h-3.5 w-3.5 text-destructive" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAddShift}
                        className="text-muted-foreground"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add shift
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
