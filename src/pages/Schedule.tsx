import { useState, useEffect } from "react";
import { Staff, Shift, ShiftType } from "@/types/shift";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { StaffDialog } from "@/components/StaffDialog";
import { ShiftDialog } from "@/components/ShiftDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, ChevronLeft, ChevronRight, RotateCcw, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getDayOfWeek, getWeekRange } from "@/lib/timeUtils";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
export default function Schedule() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
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
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user) {
      fetchStaff();
    }
  }, [user]);
  const fetchStaff = async () => {
    const {
      data,
      error
    } = await supabase.from("staff").select("*").order("created_at", {
      ascending: true
    });
    if (error) {
      toast.error("Failed to load staff");
      return;
    }
    const staffData: Staff[] = (data || []).map(s => ({
      id: s.id,
      name: s.name,
      colorIndex: s.color_index,
      hourlyRate: s.hourly_rate
    }));
    setStaff(staffData);
  };
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
      type
    };
    setShifts(prev => [...prev, newShift]);
    toast.success("Shift added");
  };
  const handleShiftClick = (shift: Shift) => {
    setShifts(prev => prev.filter(s => s.id !== shift.id));
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
  const handleAddStaff = async (newStaff: Omit<Staff, "id">) => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("staff").insert({
      user_id: user.id,
      name: newStaff.name,
      color_index: newStaff.colorIndex,
      hourly_rate: newStaff.hourlyRate
    }).select().single();
    if (error) {
      toast.error("Failed to add staff");
      return;
    }
    const staff: Staff = {
      id: data.id,
      name: data.name,
      colorIndex: data.color_index,
      hourlyRate: data.hourly_rate
    };
    setStaff(prev => [...prev, staff]);
    toast.success(`${staff.name} added to staff`);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>;
  }
  if (!user) {
    return <Auth />;
  }
  ;
  return <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Melinen Shift Board</h1>
          <div className="flex gap-2">
            <Button onClick={() => setStaffDialogOpen(true)} variant="outline" className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold">{getWeekRange(weekStartDate)}</span>
              <Button variant="ghost" size="sm" onClick={handleToday}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Today
              </Button>
            </div>

            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Schedule Grid */}
        <Card className="overflow-hidden">
          <ScheduleGrid shifts={shifts} staff={staff} weekStartDate={weekStartDate} onAddShift={handleAddShift} onShiftClick={handleShiftClick} />
        </Card>
      </div>

      <StaffDialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen} onSave={handleAddStaff} />

      <ShiftDialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen} onSave={handleSaveShift} />
    </div>;
}