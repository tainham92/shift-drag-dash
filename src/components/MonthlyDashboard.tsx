import { Staff, Shift } from "@/types/shift";
import { calculateHours, getStaffColor, getDayOfWeek } from "@/lib/timeUtils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MonthlyDashboardProps {
  shifts: Shift[];
  staff: Staff[];
  currentMonth: Date;
  onAddShift?: (staffId: string, date: Date) => void;
}

export const MonthlyDashboard = ({ shifts, staff, currentMonth, onAddShift }: MonthlyDashboardProps) => {
  const staffHours = staff.map((member) => {
    const memberShifts = shifts.filter((shift) => shift.staffId === member.id);
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

  // Get all days in the current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  const monthDays = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const getShiftsForStaffAndDay = (staffId: string, date: Date) => {
    const dayName = getDayOfWeek(date);
    return shifts.filter(s => s.staffId === staffId && s.day === dayName);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Group days into weeks for better layout
  const getWeeksInMonth = () => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    monthDays.forEach((day, index) => {
      if (index === 0) {
        // Pad the first week with empty days
        const dayOfWeek = day.getDay();
        const paddingDays = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
        for (let i = 0; i < paddingDays; i++) {
          currentWeek.push(null as any);
        }
      }
      
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    // Pad the last week if needed
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as any);
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const weeks = getWeeksInMonth();

  return (
    <div className="space-y-6">
      {/* Monthly Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>{monthName} Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            {/* Calendar Header - Days of Week */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/50">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-semibold border-r last:border-r-0 border-border">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body - Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0 border-border min-h-[120px]">
                {week.map((day, dayIndex) => (
                  <div 
                    key={dayIndex} 
                    className={`border-r last:border-r-0 border-border p-2 ${!day ? 'bg-muted/20' : ''}`}
                  >
                    {day && (
                      <>
                        <div className="text-right text-sm font-semibold mb-2 text-muted-foreground">
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {staff.map((staffMember) => {
                            const dayShifts = getShiftsForStaffAndDay(staffMember.id, day);
                            const color = getStaffColor(staffMember.colorIndex);
                            
                            if (dayShifts.length > 0) {
                              return dayShifts.map((shift, index) => (
                                <div 
                                  key={`${staffMember.id}-${index}`}
                                  className="flex items-center justify-between gap-1 p-1.5 rounded text-xs"
                                  style={{ backgroundColor: `${color}20`, borderLeft: `2px solid ${color}` }}
                                >
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <Avatar className="h-4 w-4 flex-shrink-0" style={{ backgroundColor: color }}>
                                      <AvatarFallback className="text-white text-[8px]">
                                        {getInitials(staffMember.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-foreground font-medium">
                                      {staffMember.name.split(" ")[0]}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                    {shift.type === "leave" ? (
                                      "Leave"
                                    ) : shift.type === "week-off" ? (
                                      "Off"
                                    ) : (
                                      `${shift.startTime}-${shift.endTime}`
                                    )}
                                  </span>
                                </div>
                              ));
                            }
                            return null;
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hours ({monthName})
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
            <p className="text-3xl font-bold text-accent">${totalSalary.toFixed(2)}</p>
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
                        ${member.hourlyRate}/hr · {member.shiftCount} shifts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-primary">
                      {member.totalHours.toFixed(1)} hrs
                    </p>
                    <p className="text-xs font-medium text-accent">
                      ${member.salary.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
