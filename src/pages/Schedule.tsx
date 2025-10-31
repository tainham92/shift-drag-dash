import { useState } from "react";
import { Staff, Shift, ShiftType } from "@/types/shift";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { StaffDialog } from "@/components/StaffDialog";
import { ShiftDialog } from "@/components/ShiftDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { getDayOfWeek, getWeekRange } from "@/lib/timeUtils";

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
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const handleAddShift = (staffId: string, date: Date) => {
    setSelectedStaffId(staffId);
    setSelectedDate(date);
    setShiftDialogOpen(true);
  };

  const handleSaveShift = (startTime: string, endTime: string, type: ShiftType) => {
    if (!selectedDate || !selectedStaffId) return;

    const newShift: Shift = {
      id: `${selectedStaffId}-${selectedDate.toISOString()}-${Date.now()}`,
      staffId: selectedStaffId,
      day: getDayOfWeek(selectedDate),
      startTime,
      endTime,
      type,
    };

    setShifts((prev) => [...prev, newShift]);
    toast.success("Shift added");
  };

  const handleShiftClick = (shift: Shift) => {
    setShifts((prev) => prev.filter((s) => s.id !== shift.id));
    toast.success("Shift removed");
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() - 7);
    setWeekStartDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(weekStartDate.getDate() + 7);
    setWeekStartDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    setWeekStartDate(monday);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Shift Board</h1>
          <Button
            onClick={() => setStaffDialogOpen(true)}
            variant="outline"
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Week Navigation */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousWeek}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold">{getWeekRange(weekStartDate)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Today
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Schedule Grid */}
        <Card className="overflow-hidden">
          <ScheduleGrid
            shifts={shifts}
            staff={staff}
            weekStartDate={weekStartDate}
            onAddShift={handleAddShift}
            onShiftClick={handleShiftClick}
          />
        </Card>
      </div>

      <StaffDialog
        open={staffDialogOpen}
        onOpenChange={setStaffDialogOpen}
        onSave={handleAddStaff}
      />

      <ShiftDialog
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        onSave={handleSaveShift}
      />
    </div>
  );
}
