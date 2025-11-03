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

  const getDayShiftSummary = (dayShifts: ShiftType[]) => {
    if (dayShifts.length === 0) return null;

    // Group by shift type and time
    const shiftGroups = dayShifts.reduce((acc, shift) => {
      const key = `${shift.type}-${shift.startTime}-${shift.endTime}`;
      if (!acc[key]) {
        acc[key] = {
          type: shift.type,
          startTime: shift.startTime,
          endTime: shift.endTime,
          dates: []
        };
      }
      acc[key].dates.push(shift.day);
      return acc;
    }, {} as Record<string, { type: ShiftTypeEnum; startTime: string; endTime: string; dates: string[] }>);

    // Get earliest and latest dates
    const allDates = dayShifts.map(s => s.day).sort();
    const startDate = allDates[0];
    const endDate = allDates[allDates.length - 1];

    return {
      groups: Object.values(shiftGroups),
      startDate,
      endDate,
      allShiftIds: dayShifts.map(s => s.id)
    };
  };

  const handleDeleteDayShifts = async (shiftIds: string[]) => {
    const { error } = await supabase
      .from("shifts")
      .delete()
      .in("id", shiftIds);

    if (error) {
      toast.error("Failed to delete shifts");
      return;
    }

    toast.success("Shifts deleted");
    onRefresh();
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
              <th className="text-left p-3 font-medium">Shift</th>
              <th className="text-left p-3 font-medium w-36">Start Date</th>
              <th className="text-left p-3 font-medium w-36">End Date</th>
              <th className="text-right p-3 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((dayName, idx) => {
              const dayShifts = filterShifts(groupedShifts[dayName]);
              const summary = getDayShiftSummary(dayShifts);
              
              return (
                <tr 
                  key={dayName} 
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <td className="p-3 font-medium align-top">{dayName}</td>
                  <td className="p-3">
                    {summary ? (
                      <div className="flex flex-col gap-2">
                        {summary.groups.map((group, gIdx) => (
                          <div key={gIdx} className="flex items-start gap-2">
                            {(group.type === "regular" || group.type === "flexible") && (
                              <span className="text-base font-medium">
                                {group.startTime} - {group.endTime}
                              </span>
                            )}
                            <Badge variant={getShiftTypeBadgeVariant(group.type)} className="text-[10px] h-4 px-1.5 py-0">
                              {group.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {summary ? (
                      <span className="text-sm">
                        {format(new Date(summary.startDate), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {summary ? (
                      <span className="text-sm">
                        {format(new Date(summary.endDate), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      {summary ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteDayShifts(summary.allShiftIds)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onAddShift}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
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
