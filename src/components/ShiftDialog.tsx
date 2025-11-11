import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ShiftType, Shift } from "@/types/shift";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DAYS } from "@/lib/timeUtils";

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    startTime: string,
    endTime: string,
    type: ShiftType,
    isRecurring?: boolean,
    dateRange?: { startDate: Date; endDate: Date },
    selectedDays?: string[],
    shiftId?: string,
    editScope?: "single" | "all"
  ) => void;
  onDelete?: (shiftId: string) => void;
  defaultType?: ShiftType;
  editShift?: Shift | null;
  editingGroupShifts?: Shift[];
  isPartOfRecurringGroup?: boolean;
  selectedDate?: Date;
}

export const ShiftDialog = ({ open, onOpenChange, onSave, onDelete, defaultType = "regular", editShift, editingGroupShifts, isPartOfRecurringGroup = false, selectedDate }: ShiftDialogProps) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [shiftType, setShiftType] = useState<ShiftType>(defaultType);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [editScope, setEditScope] = useState<"single" | "all">("single");

  useEffect(() => {
    if (editingGroupShifts && editingGroupShifts.length > 0) {
      // Editing a group of recurring shifts
      const firstShift = editingGroupShifts[0];
      setStartTime(firstShift.startTime);
      setEndTime(firstShift.endTime);
      setShiftType(firstShift.type);
      setIsRecurring(true);
      
      // Get all unique day names from the group
      const uniqueDays = [...new Set(editingGroupShifts.map(s => {
        const date = new Date(s.day);
        const localDay = date.getDay();
        return DAYS[localDay === 0 ? 6 : localDay - 1];
      }))];
      setSelectedDays(uniqueDays);
      
      // Set date range
      const dates = editingGroupShifts.map(s => new Date(s.day)).sort((a, b) => a.getTime() - b.getTime());
      setStartDate(dates[0]);
      setEndDate(dates[dates.length - 1]);
    } else if (editShift) {
      setStartTime(editShift.startTime);
      setEndTime(editShift.endTime);
      setShiftType(editShift.type);
      setIsRecurring(false);
      
      // Parse the date - it could be a date string (YYYY-MM-DD) or use selectedDate as fallback
      let shiftDate = selectedDate || new Date();
      if (editShift.day && editShift.day.includes('-')) {
        // It's a date string
        const [year, month, day] = editShift.day.split('-').map(Number);
        shiftDate = new Date(year, month - 1, day);
      }
      
      setStartDate(shiftDate);
      setEndDate(shiftDate);
      setSelectedDays([]);
    } else {
      setStartTime("09:00");
      setEndTime("18:00");
      setShiftType(defaultType);
      setIsRecurring(false);
      setStartDate(selectedDate || undefined);
      setEndDate(selectedDate || undefined);
      setSelectedDays([]);
    }
  }, [editShift, editingGroupShifts, defaultType]);

  const handleSave = () => {
    if (isRecurring && startDate && endDate && selectedDays.length > 0) {
      onSave(startTime, endTime, shiftType, true, { startDate, endDate }, selectedDays, editShift?.id, editScope);
    } else {
      onSave(startTime, endTime, shiftType, false, undefined, undefined, editShift?.id, editScope);
    }
    onOpenChange(false);
    setStartTime("09:00");
    setEndTime("18:00");
    setShiftType("regular");
    setIsRecurring(false);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedDays([]);
    setEditScope("single");
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectWeekdays = () => {
    setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  };

  const selectWeekend = () => {
    setSelectedDays(["Sat", "Sun"]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{(editShift || editingGroupShifts) ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Shift Type</Label>
            <Select value={shiftType} onValueChange={(value) => setShiftType(value as ShiftType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Shift</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
                <SelectItem value="week-off">Week Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(shiftType === "regular" || shiftType === "flexible") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
            />
            <Label htmlFor="recurring" className="font-normal cursor-pointer">
              Repeat shift (recurring)
            </Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectWeekdays}
                >
                  Weekdays
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectWeekend}
                >
                  Weekend
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex flex-col items-center gap-1"
                  >
                    <Checkbox
                      id={day}
                      checked={selectedDays.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                    />
                    <Label
                      htmlFor={day}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPartOfRecurringGroup && editShift && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Edit Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="edit-single"
                    name="edit-scope"
                    value="single"
                    checked={editScope === "single"}
                    onChange={(e) => setEditScope(e.target.value as "single")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-single" className="font-normal cursor-pointer">
                    Edit only this day ({new Date(editShift.day).toLocaleDateString()})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="edit-all"
                    name="edit-scope"
                    value="all"
                    checked={editScope === "all"}
                    onChange={(e) => setEditScope(e.target.value as "all")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-all" className="font-normal cursor-pointer">
                    Edit all recurring shifts in this series
                  </Label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <div className="flex w-full justify-between items-center gap-2">
            {editShift && onDelete && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  onDelete(editShift.id);
                  onOpenChange(false);
                }}
              >
                Delete Shift
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Shift
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
