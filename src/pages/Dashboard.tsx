import { useState } from "react";
import { MonthlyDashboard } from "@/components/MonthlyDashboard";
import { Staff, Shift } from "@/types/shift";

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
  const [currentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View hours worked and calculate salaries
          </p>
        </div>

        <MonthlyDashboard shifts={shifts} staff={staff} currentMonth={currentMonth} />
      </div>
    </div>
  );
}
