import { Shift, Staff, ShiftType } from "@/types/shift";
import { getStaffColor, calculateHours, getWeekDates, getDayOfWeek } from "@/lib/timeUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, GripVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ScheduleGridProps {
  shifts: Shift[];
  staff: Staff[];
  weekStartDate: Date;
  onAddShift: (staffId: string, date: Date) => void;
  onShiftClick: (shift: Shift) => void;
  onStaffReorder: (reorderedStaff: Staff[]) => void;
}

const ShiftCard = ({ shift, staff, onShiftClick }: { shift: Shift; staff: Staff; onShiftClick: (shift: Shift) => void }) => {
  const color = getStaffColor(staff.colorIndex);
  const hours = calculateHours(shift.startTime, shift.endTime);

  if (shift.type === "week-off") {
    return (
      <div className="text-xs text-muted-foreground py-2">
        Week off
      </div>
    );
  }

  if (shift.type === "leave") {
    return (
      <Card 
        className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 cursor-pointer hover:shadow-sm transition-shadow"
        onClick={() => onShiftClick(shift)}
      >
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3 h-3 text-yellow-600 dark:text-yellow-500" />
          <span className="font-medium text-yellow-700 dark:text-yellow-400">On leave</span>
        </div>
      </Card>
    );
  }

  if (shift.type === "flexible") {
    return (
      <Card 
        className="p-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 cursor-pointer hover:shadow-sm transition-shadow"
        onClick={() => onShiftClick(shift)}
      >
        <div className="text-xs">
          <div className="font-medium text-blue-700 dark:text-blue-400">Flexible</div>
          <div className="text-blue-600 dark:text-blue-500 text-[10px] mt-0.5">
            {hours.toFixed(2)} hrs.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-2 border-l-2 cursor-pointer hover:shadow-sm transition-shadow"
      style={{ borderLeftColor: color }}
      onClick={() => onShiftClick(shift)}
    >
      <div className="text-xs">
        <div className="font-medium text-foreground">
          {shift.startTime} - {shift.endTime}
        </div>
        <div className="text-muted-foreground text-[10px] mt-0.5">
          {hours.toFixed(2)} hrs.
        </div>
      </div>
    </Card>
  );
};

interface SortableStaffRowProps {
  staffMember: Staff;
  weekDates: Date[];
  shifts: Shift[];
  onAddShift: (staffId: string, date: Date) => void;
  onShiftClick: (shift: Shift) => void;
}

const SortableStaffRow = ({ 
  staffMember, 
  weekDates, 
  shifts,
  onAddShift,
  onShiftClick 
}: SortableStaffRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: staffMember.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const color = getStaffColor(staffMember.colorIndex);

  const getShiftsForStaffAndDay = (staffId: string, date: Date) => {
    const dayName = getDayOfWeek(date);
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return shifts.filter(s => s.staffId === staffId && (s.day === dayName || s.day === dateString));
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[200px_repeat(7,minmax(140px,1fr))] border-b border-border hover:bg-muted/30 transition-colors"
    >
      {/* Staff name cell with drag handle */}
      <div className="p-4 border-r border-border flex items-center gap-3">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
        <Avatar className="h-8 w-8" style={{ backgroundColor: color }}>
          <AvatarFallback className="text-white text-xs font-medium">
            {getInitials(staffMember.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate">{staffMember.name}</span>
      </div>

      {/* Day cells */}
      {weekDates.map((date, idx) => {
        const dayShifts = getShiftsForStaffAndDay(staffMember.id, date);
        
        return (
          <div
            key={idx}
            className="p-3 border-r last:border-r-0 border-border min-h-[80px] space-y-2"
          >
            {dayShifts.length > 0 ? (
              dayShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  staff={staffMember}
                  onShiftClick={onShiftClick}
                />
              ))
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-primary hover:bg-primary/10"
                onClick={() => onAddShift(staffMember.id, date)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const ScheduleGrid = ({ 
  shifts, 
  staff, 
  weekStartDate,
  onAddShift,
  onShiftClick,
  onStaffReorder
}: ScheduleGridProps) => {
  const weekDates = getWeekDates(weekStartDate);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = staff.findIndex((s) => s.id === active.id);
      const newIndex = staff.findIndex((s) => s.id === over.id);

      const reorderedStaff = arrayMove(staff, oldIndex, newIndex);
      onStaffReorder(reorderedStaff);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-auto">
        <div className="inline-block min-w-full">
          {/* Header with dates */}
          <div className="grid grid-cols-[200px_repeat(7,minmax(140px,1fr))] border-b border-border bg-card">
            <div className="p-4 font-semibold text-sm border-r border-border">
              Employee Name
            </div>
            {weekDates.map((date, idx) => (
              <div
                key={idx}
                className="p-4 text-center border-r last:border-r-0 border-border"
              >
                <div className="text-2xl font-bold text-foreground">
                  {date.getDate()}
                </div>
                <div className="text-xs text-muted-foreground uppercase mt-1">
                  {getDayOfWeek(date)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </div>
              </div>
            ))}
          </div>

          {/* Staff rows with drag and drop */}
          <SortableContext
            items={staff.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {staff.map((staffMember) => (
              <SortableStaffRow
                key={staffMember.id}
                staffMember={staffMember}
                weekDates={weekDates}
                shifts={shifts}
                onAddShift={onAddShift}
                onShiftClick={onShiftClick}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
};
