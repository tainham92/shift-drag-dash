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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
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
  "bg-yellow-500",
  "bg-red-500",
  "bg-teal-500",
];

export const StaffDialog = ({ open, onOpenChange, onSave }: StaffDialogProps) => {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [employmentType, setEmploymentType] = useState<"full-time" | "part-time">("full-time");

  const handleSave = () => {
    if (!name || !rate) return;

    const staffData: Omit<Staff, "id"> = {
      name,
      colorIndex,
      employmentType,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    if (employmentType === "full-time") {
      staffData.monthlySalary = parseFloat(rate);
    } else {
      staffData.hourlyRate = parseFloat(rate);
    }

    onSave(staffData);

    setName("");
    setRate("");
    setColorIndex(0);
    setEmploymentType("full-time");
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
            <Label htmlFor="employment-type">Employment Type</Label>
            <Select value={employmentType} onValueChange={(value: "full-time" | "part-time") => setEmploymentType(value)}>
              <SelectTrigger id="employment-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">
              {employmentType === "full-time" ? "Monthly Salary (VND)" : "Hourly Rate (VND)"}
            </Label>
            <Input
              id="rate"
              type="number"
              step="1000"
              placeholder={employmentType === "full-time" ? "10000000" : "150000"}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
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
