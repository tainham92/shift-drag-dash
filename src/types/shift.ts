export interface Staff {
  id: string;
  name: string;
  colorIndex: number;
  hourlyRate?: number;
  monthlySalary?: number;
  employmentType: "full-time" | "part-time";
  dateOfBirth?: string;
  nationalId?: string;
  joinedDate?: string;
  education?: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
  position?: string;
  displayOrder?: number;
  team?: string;
  isActive?: boolean;
}

export type ShiftType = "regular" | "flexible" | "leave" | "week-off";

export interface Shift {
  id: string;
  staffId: string;
  day: string;
  startTime: string;
  endTime: string;
  type: ShiftType;
}

export interface TimeSlot {
  time: string;
  display: string;
}
