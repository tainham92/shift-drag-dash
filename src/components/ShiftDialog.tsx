import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ShiftType } from "@/types/shift";
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
    selectedDays?: string[]
  ) => void;
  defaultType?: ShiftType;
}

export const ShiftDialog = ({ open, onOpenChange, onSave, defaultType = "regular" }: ShiftDialogProps) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [shiftType, setShiftType] = useState<ShiftType>(defaultType);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleSave = () => {
    if (isRecurring && startDate && endDate && selectedDays.length > 0) {
      onSave(startTime, endTime, shiftType, true, { startDate, endDate }, selectedDays);
    } else {
      onSave(startTime, endTime, shiftType);
    }
    onOpenChange(false);
    setStartTime("09:00");
    setEndTime("18:00");
    setShiftType("regular");
    setIsRecurring(false);
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedDays([]);
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
          <DialogTitle>Add Shift</DialogTitle>
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

          {shiftType === "regular" && (
            <>
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
            </>
          )}

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
            <>
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
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
