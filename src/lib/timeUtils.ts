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
    "hsl(var(--staff-7))",
    "hsl(var(--staff-8))",
    "hsl(var(--staff-9))",
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
  // Sophisticated gradient-based heatmap colors
  if (count === 0) return "bg-gradient-to-br from-red-50 to-red-100/80 border-red-200/50";
  if (count === 1) return "bg-gradient-to-br from-amber-50 to-orange-100/80 border-orange-200/50";
  if (count === 2) return "bg-gradient-to-br from-emerald-50 to-green-100/80 border-green-200/50";
  if (count === 3) return "bg-gradient-to-br from-teal-50 to-teal-100/80 border-teal-200/50";
  return "bg-gradient-to-br from-blue-50 to-indigo-100/80 border-blue-200/50";
}
