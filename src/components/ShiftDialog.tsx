import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShiftType } from "@/types/shift";

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (startTime: string, endTime: string, type: ShiftType) => void;
  defaultType?: ShiftType;
}

export const ShiftDialog = ({ open, onOpenChange, onSave, defaultType = "regular" }: ShiftDialogProps) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [shiftType, setShiftType] = useState<ShiftType>(defaultType);

  const handleSave = () => {
    onSave(startTime, endTime, shiftType);
    onOpenChange(false);
    setStartTime("09:00");
    setEndTime("18:00");
    setShiftType("regular");
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
