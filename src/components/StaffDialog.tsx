import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Staff } from "@/types/shift";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (staff: Omit<Staff, "id">) => void;
}

export const StaffDialog = ({ open, onOpenChange, onSave }: StaffDialogProps) => {
  const [name, setName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const handleSave = () => {
    if (!name || !hourlyRate) return;

    onSave({
      name,
      hourlyRate: parseFloat(hourlyRate),
      colorIndex: Math.floor(Math.random() * 6),
    });

    setName("");
    setHourlyRate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter staff name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly Rate ($)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              placeholder="15.00"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Staff</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
