export interface Staff {
  id: string;
  name: string;
  colorIndex: number;
  hourlyRate: number;
  employmentType: "full-time" | "part-time";
  dateOfBirth?: string;
  nationalId?: string;
  joinedDate: string;
  education?: string;
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
