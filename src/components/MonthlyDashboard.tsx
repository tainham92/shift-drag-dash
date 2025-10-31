import { Staff, Shift } from "@/types/shift";
import { calculateHours, getStaffColor, getDayIndex } from "@/lib/timeUtils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface MonthlyDashboardProps {
  shifts: Shift[];
  staff: Staff[];
}

export const MonthlyDashboard = ({ shifts, staff }: MonthlyDashboardProps) => {
  const staffHours = staff.map((member) => {
    const memberShifts = shifts.filter((shift) => shift.staffId === member.id);
    const totalHours = memberShifts.reduce((sum, shift) => {
      const hours = calculateHours(shift.startTime, shift.endTime);
      const startDayIndex = getDayIndex(shift.startDay);
      const endDayIndex = getDayIndex(shift.endDay);
      const days = endDayIndex - startDayIndex + 1;
      return sum + (hours * days);
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hours
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

      <Card>
        <CardHeader>
          <CardTitle>Staff Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffHours.map((member) => {
              const colors = [
                "hsl(var(--staff-1))",
                "hsl(var(--staff-2))",
                "hsl(var(--staff-3))",
                "hsl(var(--staff-4))",
                "hsl(var(--staff-5))",
                "hsl(var(--staff-6))",
              ];
              const color = colors[member.colorIndex % colors.length];
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${member.hourlyRate}/hr · {member.shiftCount} shifts
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {member.totalHours.toFixed(1)} hrs
                    </p>
                    <p className="text-sm font-medium text-accent">
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
