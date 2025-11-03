import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Staff, Shift } from "@/types/shift";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calculateHours, getStaffColor } from "@/lib/timeUtils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [loading]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
      return;
    }
    setLoading(false);
  };

  const normalizeTime = (time: string): string => {
    // Convert "09:00" to "9:00" to match TIME_SLOTS format
    const [hours, minutes] = time.split(":");
    return `${parseInt(hours)}:${minutes}`;
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [staffData, shiftsData] = await Promise.all([
      supabase.from("staff").select("*").eq("user_id", user.id).order("display_order", { ascending: true }),
      supabase.from("shifts").select("*").eq("user_id", user.id),
    ]);

    if (staffData.data) {
      setStaff(staffData.data.map(s => ({
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
      })));
    }
    
    if (shiftsData.data) {
      setShifts(shiftsData.data.map(s => ({
        id: s.id,
        staffId: s.staff_id,
        day: s.day,
        startTime: normalizeTime(s.start_time),
        endTime: normalizeTime(s.end_time),
        type: s.type as "regular" | "flexible" | "leave" | "week-off",
      })));
    }
  };

  // Filter shifts for the selected month
  const selectedMonthShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.day);
    return shiftDate.getMonth() === selectedDate.getMonth() && 
           shiftDate.getFullYear() === selectedDate.getFullYear();
  });

  const staffHours = staff.map((member) => {
    const memberShifts = selectedMonthShifts.filter(
      (shift) => shift.staffId === member.id && (shift.type === "regular" || shift.type === "flexible")
    );
    const totalHours = memberShifts.reduce((sum, shift) => {
      return sum + calculateHours(shift.startTime, shift.endTime);
    }, 0);
    
    // Calculate number of unique days worked
    const uniqueDays = new Set(memberShifts.map(shift => shift.day)).size;
    
    // Calculate salary based on employment type
    const salary = member.employmentType === "full-time" 
      ? (member.monthlySalary || 0)
      : totalHours * (member.hourlyRate || 0);

    return {
      ...member,
      totalHours,
      salary,
      shiftCount: memberShifts.length,
      daysWorked: uniqueDays,
    };
  });

  const totalSalary = staffHours.reduce((sum, s) => sum + s.salary, 0);
  const totalHours = staffHours.reduce((sum, s) => sum + s.totalHours, 0);
  const currentMonth = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Monthly Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              View hours worked and calculate salaries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] text-center">
              <p className="text-lg font-semibold">{currentMonth}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Hours ({currentMonth})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{totalHours.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">₫{totalSalary.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{staff.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Staff Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Shifts</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Days</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Hours</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Hourly Rate</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Salary (Month)</th>
                  </tr>
                </thead>
                <tbody>
                  {staffHours.map((member) => {
                    const color = getStaffColor(member.colorIndex);
                    
                    return (
                      <tr
                        key={member.id}
                        className="border-b border-border hover:bg-secondary/50 transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-sm">{member.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-sm">
                          {member.shiftCount}
                        </td>
                        <td className="py-3 px-2 text-center text-sm">
                          {member.daysWorked}
                        </td>
                        <td className="py-3 px-2 text-center text-sm font-medium text-primary">
                          {member.totalHours.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-right text-sm text-muted-foreground">
                          {member.employmentType === "part-time" 
                            ? `₫${(member.hourlyRate || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}`
                            : "-"
                          }
                        </td>
                        <td className="py-3 px-2 text-right text-sm font-bold text-accent">
                          ₫{member.salary.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
