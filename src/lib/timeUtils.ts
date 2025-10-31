export const TIME_SLOTS = [
  "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00"
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getWeekDates(startDate: Date) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function getWeekRange(startDate: Date) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function getDayOfWeek(date: Date) {
  return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

export function calculateHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
}

export function getStaffColor(colorIndex: number): string {
  const colors = [
    "hsl(var(--staff-1))",
    "hsl(var(--staff-2))",
    "hsl(var(--staff-3))",
    "hsl(var(--staff-4))",
    "hsl(var(--staff-5))",
    "hsl(var(--staff-6))",
  ];
  return colors[colorIndex % colors.length];
}

export function getTimeSlotIndex(time: string): number {
  return TIME_SLOTS.indexOf(time);
}

export function getNextTimeSlot(time: string): string {
  const index = getTimeSlotIndex(time);
  if (index === -1 || index >= TIME_SLOTS.length - 1) return time;
  return TIME_SLOTS[index + 1];
}

export function generateRecurringDates(
  startDate: Date,
  endDate: Date,
  selectedDays: string[]
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = getDayOfWeek(current);
    if (selectedDays.includes(dayOfWeek)) {
      dates.push(current.toISOString().split("T")[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export function isShiftActiveAtTime(
  shift: { startTime: string; endTime: string },
  timeSlot: string
): boolean {
  const slotIndex = getTimeSlotIndex(timeSlot);
  const startIndex = getTimeSlotIndex(shift.startTime);
  const endIndex = getTimeSlotIndex(shift.endTime);
  
  if (slotIndex === -1 || startIndex === -1 || endIndex === -1) return false;
  
  return slotIndex >= startIndex && slotIndex < endIndex;
}

export function calculateCoverageForTimeSlot(
  shifts: Array<{ staffId: string; startTime: string; endTime: string; type: string; day: string }>,
  timeSlot: string,
  date: Date
): string[] {
  const dateString = date.toISOString().split("T")[0];
  const dayName = getDayOfWeek(date);
  
  return shifts
    .filter(shift => {
      const matchesDate = shift.day === dateString || shift.day === dayName;
      const isWorkingShift = shift.type === "regular" || shift.type === "flexible";
      const isActive = isShiftActiveAtTime(shift, timeSlot);
      
      return matchesDate && isWorkingShift && isActive;
    })
    .map(shift => shift.staffId);
}

export function getCoverageIntensityColor(count: number): string {
  if (count === 0) return "bg-red-100 text-red-900 border-red-200";
  if (count === 1) return "bg-red-50 text-red-800 border-red-100";
  if (count === 2) return "bg-green-50 text-green-800 border-green-100";
  return "bg-green-100 text-green-900 border-green-200";
}
