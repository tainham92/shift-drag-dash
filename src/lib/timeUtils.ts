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
