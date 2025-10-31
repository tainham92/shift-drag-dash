import { useState } from "react";
import { Staff, Shift } from "@/types/shift";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { StaffList } from "@/components/StaffList";
import { StaffDialog } from "@/components/StaffDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { TIME_SLOTS, DAYS } from "@/lib/timeUtils";

const INITIAL_STAFF: Staff[] = [
  { id: "1", name: "Staff 1", colorIndex: 0, hourlyRate: 15 },
  { id: "2", name: "Staff 2", colorIndex: 1, hourlyRate: 16 },
  { id: "3", name: "Staff 3", colorIndex: 2, hourlyRate: 15.5 },
  { id: "4", name: "Staff 4", colorIndex: 3, hourlyRate: 17 },
  { id: "5", name: "Staff 5", colorIndex: 4, hourlyRate: 15 },
  { id: "6", name: "Staff 6", colorIndex: 5, hourlyRate: 16.5 },
];

export default function Schedule() {
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const handleStaffClick = (staffId: string) => {
    if (selectedCells.size === 0) {
      toast.error("Please select cells first");
      return;
    }

    const selectedStaff = staff.find((s) => s.id === staffId);
    if (!selectedStaff) return;

    // Group selected cells by day
    const cellsByDay = new Map<string, string[]>();
    selectedCells.forEach((cellId) => {
      const [day, time] = cellId.split("-");
      if (!cellsByDay.has(day)) {
        cellsByDay.set(day, []);
      }
      cellsByDay.get(day)!.push(time);
    });

    // Create shifts for each day
    const newShifts: Shift[] = [];
    cellsByDay.forEach((times, day) => {
      // Sort times and find continuous blocks
      const timeIndices = times.map((t) => TIME_SLOTS.indexOf(t)).sort((a, b) => a - b);
      
      let blockStart = timeIndices[0];
      let blockEnd = timeIndices[0];

      for (let i = 1; i <= timeIndices.length; i++) {
        if (i < timeIndices.length && timeIndices[i] === blockEnd + 1) {
          blockEnd = timeIndices[i];
        } else {
          // Create shift for this continuous block
          const startTime = TIME_SLOTS[blockStart];
          const endTime = TIME_SLOTS[blockEnd];
          
          const newShift: Shift = {
            id: `${staffId}-${day}-${startTime}-${Date.now()}-${newShifts.length}`,
            staffId: staffId,
            day: day,
            startTime: startTime,
            endTime: endTime,
          };
          newShifts.push(newShift);

          if (i < timeIndices.length) {
            blockStart = timeIndices[i];
            blockEnd = timeIndices[i];
          }
        }
      }
    });

    setShifts((prev) => [...prev, ...newShifts]);
    setSelectedCells(new Set());
    toast.success(`Assigned ${selectedStaff.name} to ${selectedCells.size} cell${selectedCells.size > 1 ? 's' : ''}`);
  };

  const handleResizeShift = (shiftId: string, newEndTime: string) => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === shiftId ? { ...shift, endTime: newEndTime } : shift
      )
    );
  };

  const handleRemoveShift = (shiftId: string) => {
    setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
    toast.success("Shift removed");
  };

  const handleAddStaff = (newStaff: Omit<Staff, "id">) => {
    const staff: Staff = {
      ...newStaff,
      id: Date.now().toString(),
    };
    setStaff((prev) => [...prev, staff]);
    toast.success(`${staff.name} added to staff`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Weekly Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Select cells in the schedule, then click a staff member to assign shifts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[280px_1fr] gap-6">
          <div className="space-y-4">
            <Card className="p-4">
              <Button
                onClick={() => setDialogOpen(true)}
                className="w-full"
                variant="default"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </Card>

            <Card className="p-4">
              <StaffList 
                staff={staff} 
                onStaffClick={handleStaffClick}
              />
            </Card>
          </div>

          <Card className="p-6">
            <ScheduleGrid
              shifts={shifts}
              staff={staff}
              onRemoveShift={handleRemoveShift}
              onResizeShift={handleResizeShift}
              selectedCells={selectedCells}
              onSelectionChange={setSelectedCells}
            />
          </Card>
        </div>
      </div>

      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleAddStaff}
      />
    </div>
  );
}
