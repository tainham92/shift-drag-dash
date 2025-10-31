import { useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Staff, Shift } from "@/types/shift";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { StaffList } from "@/components/StaffList";
import { StaffDialog } from "@/components/StaffDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { getNextTimeSlot, getTimeSlotIndex } from "@/lib/timeUtils";

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const staffData = active.data.current?.staff as Staff;
    const cellData = over.data.current as { day: string; time: string };

    if (staffData && cellData) {
      // Check if the cell is already occupied
      const timeIndex = getTimeSlotIndex(cellData.time);
      const isOccupied = shifts.some((shift) => {
        if (shift.day !== cellData.day) return false;
        const shiftStartIndex = getTimeSlotIndex(shift.startTime);
        const shiftEndIndex = getTimeSlotIndex(shift.endTime);
        return timeIndex >= shiftStartIndex && timeIndex < shiftEndIndex;
      });

      if (isOccupied) {
        toast.error("This time slot is already occupied");
        return;
      }

      const newShift: Shift = {
        id: `${staffData.id}-${cellData.day}-${cellData.time}-${Date.now()}`,
        staffId: staffData.id,
        day: cellData.day,
        startTime: cellData.time,
        endTime: getNextTimeSlot(cellData.time),
      };

      setShifts((prev) => [...prev, newShift]);
      toast.success(`Assigned ${staffData.name} to ${cellData.day} at ${cellData.time}`);
    }
  };

  const handleResizeShift = (
    shiftId: string,
    updates: { startTime?: string; endTime?: string; day?: string }
  ) => {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === shiftId ? { ...shift, ...updates } : shift
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
    <DndContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Weekly Schedule</h1>
              <p className="text-muted-foreground mt-1">
                Drag and drop staff members to assign shifts
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
                <StaffList staff={staff} />
              </Card>
            </div>

            <Card className="p-6">
              <ScheduleGrid
                shifts={shifts}
                staff={staff}
                onRemoveShift={handleRemoveShift}
                onResizeShift={handleResizeShift}
              />
            </Card>
          </div>
        </div>
      </div>

      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleAddStaff}
      />
    </DndContext>
  );
}
