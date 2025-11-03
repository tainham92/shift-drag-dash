import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Staff, Shift } from "@/types/shift";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateHours, getStaffColor } from "@/lib/timeUtils";

export default function Dashboard() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

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
      supabase.from("staff").select("*").eq("user_id", user.id),
      supabase.from("shifts").select("*").eq("user_id", user.id),
    ]);

    if (staffData.data) {
      setStaff(staffData.data.map(s => ({
        id: s.id,
        name: s.name,
        colorIndex: s.color_index,
        hourlyRate: s.hourly_rate,
        employmentType: s.employment_type as "full-time" | "part-time",
        joinedDate: s.joined_date,
        dateOfBirth: s.date_of_birth,
        nationalId: s.national_id,
        education: s.education,
        avatarUrl: s.avatar_url,
        phone: s.phone,
        email: s.email,
        position: s.position
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

  const staffHours = staff.map((member) => {
    const memberShifts = shifts.filter(
      (shift) => shift.staffId === member.id && (shift.type === "regular" || shift.type === "flexible")
    );
    const totalHours = memberShifts.reduce((sum, shift) => {
      return sum + calculateHours(shift.startTime, shift.endTime);
    }, 0);
    const salary = totalHours * member.hourlyRate;

    return {
      ...member,
      totalHours,
      salary,
      shiftCount: memberShifts.length,
    };
  });

  const totalSalary = staffHours.reduce((sum, s) => sum + s.salary, 0);
  const totalHours = staffHours.reduce((sum, s) => sum + s.totalHours, 0);
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View hours worked and calculate salaries
          </p>
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
            <div className="space-y-2">
              {staffHours.map((member) => {
                const color = getStaffColor(member.colorIndex);
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <p className="font-semibold text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ₫{member.hourlyRate.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}/hr · {member.shiftCount} shifts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-primary">
                        {member.totalHours.toFixed(1)} hrs
                      </p>
                      <p className="text-xs font-medium text-accent">
                        ₫{member.salary.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
