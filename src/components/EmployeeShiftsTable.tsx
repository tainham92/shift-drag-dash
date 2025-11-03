import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Filter, ArrowUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import { Shift as ShiftType, ShiftType as ShiftTypeEnum } from "@/types/shift";
import { format } from "date-fns";
import { TIME_SLOTS } from "@/lib/timeUtils";

interface EmployeeShiftsTableProps {
  shifts: ShiftType[];
  onRefresh: () => void;
  onEditShift: (shift: ShiftType) => void;
}

export const EmployeeShiftsTable = ({ shifts, onRefresh, onEditShift }: EmployeeShiftsTableProps) => {
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [editingShift, setEditingShift] = useState<string | null>(null);

  const handleSelectShift = (shiftId: string) => {
    const newSelected = new Set(selectedShifts);
    if (newSelected.has(shiftId)) {
      newSelected.delete(shiftId);
    } else {
      newSelected.add(shiftId);
    }
    setSelectedShifts(newSelected);
  };

  const handleSelectAll = () => {
    const filteredShifts = filterAndSortShifts();
    const allSelected = filteredShifts.every(s => selectedShifts.has(s.id));
    
    const newSelected = new Set(selectedShifts);
    if (allSelected) {
      filteredShifts.forEach(s => newSelected.delete(s.id));
    } else {
      filteredShifts.forEach(s => newSelected.add(s.id));
    }
    setSelectedShifts(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedShifts.size === 0) return;

    const { error } = await supabase
      .from("shifts")
      .delete()
      .in("id", Array.from(selectedShifts));

    if (error) {
      toast.error("Failed to delete shifts");
      return;
    }

    toast.success(`Deleted ${selectedShifts.size} shift(s)`);
    setSelectedShifts(new Set());
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

  const filterAndSortShifts = () => {
    let filtered = shifts;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(shift => shift.type === filterType);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.day.localeCompare(b.day);
        case "date-desc":
          return b.day.localeCompare(a.day);
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return sorted;
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

  const filteredShifts = filterAndSortShifts();

  if (shifts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No shifts scheduled for this employee
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedShifts.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedShifts.size} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-asc">Date (Oldest)</SelectItem>
              <SelectItem value="date-desc">Date (Newest)</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="w-10 p-2">
                <Checkbox
                  checked={
                    filteredShifts.length > 0 &&
                    filteredShifts.every(s => selectedShifts.has(s.id))
                  }
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="text-left p-2 font-medium">Day</th>
              <th className="text-left p-2 font-medium">Date</th>
              <th className="text-left p-2 font-medium">Type</th>
              <th className="text-left p-2 font-medium">Time</th>
              <th className="text-right p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShifts.map((shift, idx) => {
              const date = new Date(shift.day);
              const dayName = format(date, "EEEE");
              const isSelected = selectedShifts.has(shift.id);

              return (
                <tr 
                  key={shift.id} 
                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                >
                  <td className="p-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelectShift(shift.id)}
                    />
                  </td>
                  <td className="p-2 font-medium">{dayName}</td>
                  <td className="p-2">{format(date, "MMM d, yyyy")}</td>
                  <td className="p-2">
                    <Badge variant={getShiftTypeBadgeVariant(shift.type)}>
                      {shift.type}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {shift.type === "regular" || shift.type === "flexible" ? (
                      editingShift === shift.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            defaultValue={shift.startTime}
                            onValueChange={async (newStartTime) => {
                              const { error } = await supabase
                                .from("shifts")
                                .update({ start_time: newStartTime })
                                .eq("id", shift.id);
                              
                              if (!error) {
                                onRefresh();
                              }
                            }}
                          >
                            <SelectTrigger className="w-[100px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>-</span>
                          <Select
                            defaultValue={shift.endTime}
                            onValueChange={async (newEndTime) => {
                              const { error } = await supabase
                                .from("shifts")
                                .update({ end_time: newEndTime })
                                .eq("id", shift.id);
                              
                              if (!error) {
                                onRefresh();
                              }
                            }}
                          >
                            <SelectTrigger className="w-[100px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => setEditingShift(null)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingShift(shift.id)}
                          className="hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                        >
                          {shift.startTime} - {shift.endTime}
                        </button>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onEditShift(shift)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteShift(shift.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
