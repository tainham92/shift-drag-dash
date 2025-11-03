import { useState, useEffect } from "react";
import { Staff, Shift, ShiftType } from "@/types/shift";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { StaffDialog } from "@/components/StaffDialog";
import { ShiftDialog } from "@/components/ShiftDialog";
import { MonthlyDashboard } from "@/components/MonthlyDashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserPlus, ChevronLeft, ChevronRight, RotateCcw, LogOut, Calendar, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { getDayOfWeek, getWeekRange } from "@/lib/timeUtils";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
export default function Schedule() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
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
      fetchShifts();
      checkAdminRole();
    }
  }, [user]);
  const fetchShifts = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("shifts").select("*").order("created_at", {
      ascending: true
    });
    if (error) {
      toast.error("Failed to load shifts");
      return;
    }
    const shiftsData: Shift[] = (data || []).map(s => ({
      id: s.id,
      staffId: s.staff_id,
      day: s.day,
      startTime: s.start_time,
      endTime: s.end_time,
      type: s.type as ShiftType
    }));
    setShifts(shiftsData);
  };
  const checkAdminRole = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
    if (!error && data) {
      setIsAdmin(data.role === "admin");
    }
  };
  const fetchStaff = async () => {
    const {
      data,
      error
    } = await supabase.from("staff").select("*").order("display_order", {
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
      hourlyRate: s.hourly_rate,
      monthlySalary: s.monthly_salary,
      employmentType: s.employment_type as "full-time" | "part-time",
      joinedDate: s.joined_date,
      dateOfBirth: s.date_of_birth,
      nationalId: s.national_id,
      education: s.education,
      avatarUrl: s.avatar_url,
      phone: s.phone,
      email: s.email,
      position: s.position,
      displayOrder: s.display_order,
      team: s.team,
      isActive: s.is_active ?? true
    }));
    setStaff(staffData);
  };

  const handleStaffReorder = async (reorderedStaff: Staff[]) => {
    setStaff(reorderedStaff);
    
    // Update display_order in database
    const updates = reorderedStaff.map((staff, index) => 
      supabase
        .from("staff")
        .update({ display_order: index })
        .eq("id", staff.id)
    );
    
    const results = await Promise.all(updates);
    const hasError = results.some(result => result.error);
    
    if (hasError) {
      toast.error("Failed to save order");
      fetchStaff(); // Revert to database state
    } else {
      toast.success("Order updated");
    }
  };
  const handleAddShift = (staffId: string, date: Date) => {
    setSelectedStaffId(staffId);
    setSelectedDate(date);
    setShiftDialogOpen(true);
  };
  const handleSaveShift = async (startTime: string, endTime: string, type: ShiftType) => {
    if (!selectedDate || !selectedStaffId || !user) return;
    const {
      data,
      error
    } = await supabase.from("shifts").insert({
      user_id: user.id,
      staff_id: selectedStaffId,
      day: getDayOfWeek(selectedDate),
      start_time: startTime,
      end_time: endTime,
      type: type
    }).select().single();
    if (error) {
      toast.error("Failed to add shift");
      return;
    }
    const newShift: Shift = {
      id: data.id,
      staffId: data.staff_id,
      day: data.day,
      startTime: data.start_time,
      endTime: data.end_time,
      type: data.type as ShiftType
    };
    setShifts(prev => [...prev, newShift]);
    toast.success("Shift added");
  };
  const handleShiftClick = async (shift: Shift) => {
    const {
      error
    } = await supabase.from("shifts").delete().eq("id", shift.id);
    if (error) {
      toast.error("Failed to remove shift");
      return;
    }
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
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };
  const handleThisMonth = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
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
      hourly_rate: newStaff.hourlyRate,
      employment_type: newStaff.employmentType
    }).select().single();
    if (error) {
      toast.error("Failed to add staff");
      return;
    }
    const staff: Staff = {
      id: data.id,
      name: data.name,
      colorIndex: data.color_index,
      hourlyRate: data.hourly_rate,
      employmentType: data.employment_type as "full-time" | "part-time",
      joinedDate: data.joined_date,
      dateOfBirth: data.date_of_birth,
      nationalId: data.national_id,
      education: data.education,
      avatarUrl: data.avatar_url
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
          <h1 className="text-3xl font-bold text-foreground">Shift Board</h1>
          <div className="flex gap-2">
            {isAdmin && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {viewMode === "week" ? <>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Week View
                      </> : <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Month View
                      </>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem onClick={() => setViewMode("week")}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Week View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode("month")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Month View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>}
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

        {viewMode === "week" ? <>
            {/* Week Navigation */}
            <Card className="px-4 py-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold">{getWeekRange(weekStartDate)}</span>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleToday}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Today
                  </Button>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
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
                onStaffReorder={handleStaffReorder}
              />
            </Card>
          </> : <>
            {/* Month Navigation */}
            <Card className="px-4 py-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold">
                    {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric"
                })}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleThisMonth}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    This Month
                  </Button>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            {/* Monthly Dashboard */}
            <MonthlyDashboard shifts={shifts} staff={staff} currentMonth={currentMonth} onAddShift={handleAddShift} />
          </>}
      </div>

      <StaffDialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen} onSave={handleAddStaff} />

      <ShiftDialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen} onSave={handleSaveShift} />
    </div>;
}