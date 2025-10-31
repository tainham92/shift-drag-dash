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

const staffColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-cyan-500",
];

export const StaffDialog = ({ open, onOpenChange, onSave }: StaffDialogProps) => {
  const [name, setName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [colorIndex, setColorIndex] = useState(0);

  const handleSave = () => {
    if (!name || !hourlyRate) return;

    onSave({
      name,
      hourlyRate: parseFloat(hourlyRate),
      colorIndex,
    });

    setName("");
    setHourlyRate("");
    setColorIndex(0);
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
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-3">
              {staffColors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setColorIndex(index)}
                  className={`w-10 h-10 rounded-full ${color} transition-all ${
                    colorIndex === index
                      ? "ring-4 ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  aria-label={`Select color ${index + 1}`}
                />
              ))}
            </div>
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
