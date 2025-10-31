import { useState } from "react";
import { Staff, Shift } from "@/types/shift";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateHours, getStaffColor } from "@/lib/timeUtils";

const INITIAL_STAFF: Staff[] = [
  { id: "1", name: "Staff 1", colorIndex: 0, hourlyRate: 15 },
  { id: "2", name: "Staff 2", colorIndex: 1, hourlyRate: 16 },
  { id: "3", name: "Staff 3", colorIndex: 2, hourlyRate: 15.5 },
  { id: "4", name: "Staff 4", colorIndex: 3, hourlyRate: 17 },
  { id: "5", name: "Staff 5", colorIndex: 4, hourlyRate: 15 },
  { id: "6", name: "Staff 6", colorIndex: 5, hourlyRate: 16.5 },
];

export default function Dashboard() {
  const [staff] = useState<Staff[]>(INITIAL_STAFF);
  const [shifts] = useState<Shift[]>([]);

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
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
    </div>
  );
}
