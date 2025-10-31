export interface Staff {
  id: string;
  name: string;
  colorIndex: number;
  hourlyRate: number;
}

export interface Shift {
  id: string;
  staffId: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface TimeSlot {
  time: string;
  display: string;
}
