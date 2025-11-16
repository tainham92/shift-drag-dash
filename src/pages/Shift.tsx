import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Clock, Pencil, Filter, ArrowUpDown, CheckSquare, Square, X, Check, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { ShiftDialog } from "@/components/ShiftDialog";
import { StaffDialog } from "@/components/StaffDialog";
import type { Shift as ShiftType, Staff, ShiftType as ShiftTypeEnum } from "@/types/shift";
import { Auth } from "@/components/Auth";
import { getStaffColor, generateRecurringDates, TIME_SLOTS } from "@/lib/timeUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableStaffAccordionItemProps {
  member: Staff;
  groupedShifts: Record<string, ShiftType[]>;
  handleAddShift: (staffId: string) => void;
  children: React.ReactNode;
}

function SortableStaffAccordionItem({
  member,
  groupedShifts,
  handleAddShift,
  children,
}: SortableStaffAccordionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <AccordionItem
      key={member.id}
      value={member.id}
      ref={setNodeRef}
      style={style}
      className="border-b"
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getStaffColor(member.colorIndex) }}
            />
            <h3 className="font-semibold">{member.name}</h3>
            <span className="text-sm text-muted-foreground">
              ({groupedShifts[member.id]?.length || 0} shifts)
            </span>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleAddShift(member.id);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Shift
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

export default function Shift() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const [editingGroupIds, setEditingGroupIds] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [editingField, setEditingField] = useState<{groupId: string, field: 'time' | 'startDate' | 'endDate'} | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchShifts();
      fetchStaff();
    }
  }, [user]);

  const fetchShifts = async () => {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .order("day", { ascending: true });

    if (error) {
      toast.error("Failed to fetch shifts");
      return;
    }

    const mappedShifts = (data || []).map((shift) => ({
      id: shift.id,
      staffId: shift.staff_id,
      day: shift.day,
      startTime: shift.start_time,
      endTime: shift.end_time,
      type: shift.type as ShiftTypeEnum,
      recurringGroupId: shift.recurring_group_id,
    }));

    setShifts(mappedShifts);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to fetch staff");
      return;
    }

    const mappedStaff = (data || []).map((member) => ({
      id: member.id,
      name: member.name,
      colorIndex: member.color_index,
      hourlyRate: member.hourly_rate,
      employmentType: member.employment_type as "full-time" | "part-time",
      joinedDate: member.joined_date,
      dateOfBirth: member.date_of_birth,
      nationalId: member.national_id,
      education: member.education,
      avatarUrl: member.avatar_url,
      displayOrder: member.display_order
    }));

    setStaff(mappedStaff);
  };

  const handleAddShift = (staffId: string) => {
    setSelectedStaffId(staffId);
    setEditingShift(null);
    setEditingGroupIds([]);
    setShiftDialogOpen(true);
  };

  const handleEditShift = (shift: ShiftType, groupShiftIds?: string[]) => {
    setSelectedStaffId(shift.staffId);
    setEditingShift(shift);
    setEditingGroupIds(groupShiftIds || []);
    setShiftDialogOpen(true);
  };

  const handleSaveShift = async (
    startTime: string,
    endTime: string,
    type: ShiftTypeEnum,
    isRecurring?: boolean,
    dateRange?: { startDate: Date; endDate: Date },
    selectedDays?: string[],
    shiftId?: string,
    editScope?: "single" | "all"
  ) => {
    if (!selectedStaffId || !user) return;

    // If editing a single occurrence of a recurring shift
    if (shiftId && editScope === "single" && editingShift?.recurringGroupId) {
      const { error } = await supabase
        .from("shifts")
        .update({
          type,
          start_time: startTime,
          end_time: endTime,
          recurring_group_id: null, // Break it from the group
        })
        .eq("id", shiftId);

      if (error) {
        toast.error("Failed to update shift");
        return;
      }

      toast.success("Shift updated for this day only");
      fetchShifts();
      return;
    }

    // If editing all occurrences of a recurring shift
    if (shiftId && editScope === "all" && editingShift?.recurringGroupId) {
      const { error } = await supabase
        .from("shifts")
        .update({
          type,
          start_time: startTime,
          end_time: endTime,
        })
        .eq("recurring_group_id", editingShift.recurringGroupId);

      if (error) {
        toast.error("Failed to update recurring shifts");
        return;
      }

      toast.success("All recurring shifts updated");
      fetchShifts();
      return;
    }

    // If editing a group of shifts (when editingGroupIds is set)
    if (editingGroupIds.length > 0 && isRecurring && dateRange && selectedDays && selectedDays.length > 0) {
      // Delete all shifts in the group
      await supabase.from("shifts").delete().in("id", editingGroupIds);

      // Create all new recurring shifts
      const dates = generateRecurringDates(
        dateRange.startDate,
        dateRange.endDate,
        selectedDays
      );

      // Generate a group ID for this recurring shift series  
      const recurringGroupId = crypto.randomUUID();

      const shiftsToInsert = dates.map((date) => ({
        user_id: user.id,
        staff_id: selectedStaffId,
        type,
        start_time: startTime,
        end_time: endTime,
        day: date,
        recurring_group_id: recurringGroupId,
      }));

      const { error } = await supabase.from("shifts").insert(shiftsToInsert);

      if (error) {
        toast.error("Failed to update recurring shifts");
        return;
      }

      toast.success(`Updated to ${dates.length} recurring shifts`);
      fetchShifts();
      setEditingGroupIds([]);
      return;
    }

    // If editing an existing shift and converting to recurring
    if (shiftId && isRecurring && dateRange && selectedDays && selectedDays.length > 0) {
      // Delete the original shift
      await supabase.from("shifts").delete().eq("id", shiftId);

      // Create all recurring shifts
      const dates = generateRecurringDates(
        dateRange.startDate,
        dateRange.endDate,
        selectedDays
      );

      // Generate a group ID for this recurring shift series
      const recurringGroupId = crypto.randomUUID();

      const shiftsToInsert = dates.map((date) => ({
        user_id: user.id,
        staff_id: selectedStaffId,
        type,
        start_time: startTime,
        end_time: endTime,
        day: date,
        recurring_group_id: recurringGroupId,
      }));

      const { error } = await supabase.from("shifts").insert(shiftsToInsert);

      if (error) {
        toast.error("Failed to create recurring shifts");
        return;
      }

      toast.success(`Created ${dates.length} recurring shifts`);
      fetchShifts();
      return;
    }

    // If editing an existing shift (non-recurring)
    if (shiftId) {
      const { error } = await supabase
        .from("shifts")
        .update({
          type,
          start_time: startTime,
          end_time: endTime,
        })
        .eq("id", shiftId);

      if (error) {
        toast.error("Failed to update shift");
        return;
      }

      toast.success("Shift updated successfully");
      fetchShifts();
      return;
    }

    if (isRecurring && dateRange && selectedDays && selectedDays.length > 0) {
      const dates = generateRecurringDates(
        dateRange.startDate,
        dateRange.endDate,
        selectedDays
      );

      // Generate a group ID for this recurring shift series
      const recurringGroupId = crypto.randomUUID();

      const shiftsToInsert = dates.map((date) => ({
        user_id: user.id,
        staff_id: selectedStaffId,
        type,
        start_time: startTime,
        end_time: endTime,
        day: date,
        recurring_group_id: recurringGroupId,
      }));

      const { error } = await supabase.from("shifts").insert(shiftsToInsert);

      if (error) {
        toast.error("Failed to add recurring shifts");
        return;
      }

      toast.success(`Added ${dates.length} recurring shifts`);
    } else {
      const { error } = await supabase.from("shifts").insert({
        user_id: user.id,
        staff_id: selectedStaffId,
        type,
        start_time: startTime,
        end_time: endTime,
        day: new Date().toISOString().split("T")[0],
      });

      if (error) {
        toast.error("Failed to add shift");
        return;
      }

      toast.success("Shift added successfully");
    }

    fetchShifts();
  };

  const handleDeleteShift = async (shiftId: string) => {
    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("id", shiftId);

    if (error) {
      toast.error("Failed to delete shift");
      return;
    }

    toast.success("Shift deleted");
    fetchShifts();
  };

  const groupShiftsByStaff = () => {
    const grouped: Record<string, ShiftType[]> = {};
    shifts.forEach((shift) => {
      if (!grouped[shift.staffId]) {
        grouped[shift.staffId] = [];
      }
      grouped[shift.staffId].push(shift);
    });
    return grouped;
  };

  const getStaffById = (staffId: string) => {
    return staff.find((s) => s.id === staffId);
  };

  const handleSelectShift = (shiftId: string) => {
    const newSelected = new Set(selectedShifts);
    if (newSelected.has(shiftId)) {
      newSelected.delete(shiftId);
    } else {
      newSelected.add(shiftId);
    }
    setSelectedShifts(newSelected);
  };

  const handleSelectAllStaffShifts = (staffShifts: ShiftType[]) => {
    const staffShiftIds = staffShifts.map(s => s.id);
    const allSelected = staffShiftIds.every(id => selectedShifts.has(id));
    
    const newSelected = new Set(selectedShifts);
    if (allSelected) {
      staffShiftIds.forEach(id => newSelected.delete(id));
    } else {
      staffShiftIds.forEach(id => newSelected.add(id));
    }
    setSelectedShifts(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedShifts.size === 0) return;

    const { error } = await supabase
      .from("shifts")
      .delete()
      .in("id", Array.from(selectedShifts));

    if (error) {
      toast.error("Failed to delete shifts");
      return;
    }

    toast.success(`Deleted ${selectedShifts.size} shift(s)`);
    setSelectedShifts(new Set());
    fetchShifts();
  };

  const groupShiftsByTime = (staffShifts: ShiftType[]) => {
    const groups: Array<{
      type: ShiftTypeEnum;
      startTime: string;
      endTime: string;
      days: Array<{ day: string; dayName: string; shiftId: string }>;
      startDate: string;
      endDate: string;
      shiftIds: string[];
    }> = [];

    staffShifts.forEach(shift => {
      // Check if shift.day is a date string (YYYY-MM-DD) or a day name
      const isDateString = /^\d{4}-\d{2}-\d{2}$/.test(shift.day);
      let dayName: string;
      
      if (isDateString) {
        const date = new Date(shift.day + 'T00:00:00');
        dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      } else {
        // It's already a day name
        dayName = shift.day.toLowerCase();
      }
      
      const existingGroup = groups.find(
        g => g.type === shift.type && 
             g.startTime === shift.startTime && 
             g.endTime === shift.endTime
      );

      if (existingGroup) {
        existingGroup.days.push({ day: shift.day, dayName, shiftId: shift.id });
        existingGroup.shiftIds.push(shift.id);
        // Update date range only if it's a valid date string
        if (isDateString) {
          if (shift.day < existingGroup.startDate || !existingGroup.startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            existingGroup.startDate = shift.day;
          }
          if (shift.day > existingGroup.endDate || !existingGroup.endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            existingGroup.endDate = shift.day;
          }
        }
      } else {
        groups.push({
          type: shift.type,
          startTime: shift.startTime,
          endTime: shift.endTime,
          days: [{ day: shift.day, dayName, shiftId: shift.id }],
          startDate: isDateString ? shift.day : '',
          endDate: isDateString ? shift.day : '',
          shiftIds: [shift.id]
        });
      }
    });

    // Sort days within each group
    groups.forEach(group => {
      group.days.sort((a, b) => {
        const aIsDate = /^\d{4}-\d{2}-\d{2}$/.test(a.day);
        const bIsDate = /^\d{4}-\d{2}-\d{2}$/.test(b.day);
        if (aIsDate && bIsDate) {
          return a.day.localeCompare(b.day);
        }
        return a.dayName.localeCompare(b.dayName);
      });
    });

    return groups;
  };

  const filterAndSortShifts = (staffShifts: ShiftType[]) => {
    let filtered = staffShifts;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(shift => shift.type === filterType);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.day.localeCompare(b.day);
        case "date-desc":
          return b.day.localeCompare(a.day);
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = staff.findIndex((s) => s.id === active.id);
    const newIndex = staff.findIndex((s) => s.id === over.id);

    const newStaffOrder = arrayMove(staff, oldIndex, newIndex);
    setStaff(newStaffOrder);

    // Update display_order in database
    const updates = newStaffOrder.map((member, index) => ({
      id: member.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from("staff")
        .update({ display_order: update.display_order })
        .eq("id", update.id);
    }

    toast.success("Staff order updated");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const groupedShifts = groupShiftsByStaff();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Shift Management</h1>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Shifts</CardTitle>
              <div className="flex items-center gap-3">
                {selectedShifts.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedShifts.size} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Selected
                    </Button>
                  </div>
                )}
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="week-off">Week Off</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={staff.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <Accordion type="single" collapsible className="w-full">
                  {staff.map((member) => (
                    <SortableStaffAccordionItem
                      key={member.id}
                      member={member}
                      groupedShifts={groupedShifts}
                      handleAddShift={handleAddShift}
                    >
                      {groupedShifts[member.id]?.length > 0 ? (
                        <div className="border rounded-md">
                          <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                              <tr>
                                <th className="w-10 p-2">
                                  <Checkbox
                                    checked={
                                      filterAndSortShifts(groupedShifts[member.id]).length > 0 &&
                                      filterAndSortShifts(groupedShifts[member.id]).every(s => selectedShifts.has(s.id))
                                    }
                                    onCheckedChange={() => handleSelectAllStaffShifts(filterAndSortShifts(groupedShifts[member.id]))}
                                  />
                                </th>
                                <th className="text-left p-2 font-medium">Type</th>
                                <th className="text-left p-2 font-medium">time</th>
                                <th className="text-left p-2 font-medium">days</th>
                                <th className="text-left p-2 font-medium">start date</th>
                                <th className="text-left p-2 font-medium">end date</th>
                                <th className="text-right p-2 font-medium">Actions</th>
                              </tr>
                            </thead>
                             <tbody>
                             {groupShiftsByTime(filterAndSortShifts(groupedShifts[member.id])).map((group, idx) => {
                              const allSelected = group.shiftIds.every(id => selectedShifts.has(id));
                              const uniqueDayNames = [...new Set(group.days.map(d => d.dayName))].join(', ');
                              
                              return (
                                <tr 
                                  key={group.shiftIds.join('-')} 
                                  className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                                >
                                  <td className="p-2">
                                    <Checkbox
                                      checked={allSelected}
                                      onCheckedChange={() => {
                                        const newSelected = new Set(selectedShifts);
                                        if (allSelected) {
                                          group.shiftIds.forEach(id => newSelected.delete(id));
                                        } else {
                                          group.shiftIds.forEach(id => newSelected.add(id));
                                        }
                                        setSelectedShifts(newSelected);
                                      }}
                                    />
                                  </td>
                                  <td className="p-2">{group.type} shift</td>
                                   <td className="p-2">
                                     {group.type === "regular" || group.type === "flexible" ? (
                                       editingField?.groupId === group.shiftIds.join('-') && editingField?.field === 'time' ? (
                                         <div className="flex items-center gap-2">
                                           <Select
                                             defaultValue={group.startTime}
                                             onValueChange={async (newStartTime) => {
                                               const { error } = await supabase
                                                 .from("shifts")
                                                 .update({ start_time: newStartTime })
                                                 .in("id", group.shiftIds);
                                               
                                               if (!error) {
                                                 fetchShifts();
                                               }
                                             }}
                                           >
                                             <SelectTrigger className="w-[100px] h-8">
                                               <SelectValue />
                                             </SelectTrigger>
                                             <SelectContent>
                                               {TIME_SLOTS.map((time) => (
                                                 <SelectItem key={time} value={time}>
                                                   {time}
                                                 </SelectItem>
                                               ))}
                                             </SelectContent>
                                           </Select>
                                           <span>-</span>
                                           <Select
                                             defaultValue={group.endTime}
                                             onValueChange={async (newEndTime) => {
                                               const { error } = await supabase
                                                 .from("shifts")
                                                 .update({ end_time: newEndTime })
                                                 .in("id", group.shiftIds);
                                               
                                               if (!error) {
                                                 fetchShifts();
                                               }
                                             }}
                                           >
                                             <SelectTrigger className="w-[100px] h-8">
                                               <SelectValue />
                                             </SelectTrigger>
                                             <SelectContent>
                                               {TIME_SLOTS.map((time) => (
                                                 <SelectItem key={time} value={time}>
                                                   {time}
                                                 </SelectItem>
                                               ))}
                                             </SelectContent>
                                           </Select>
                                           <Button
                                             size="sm"
                                             variant="ghost"
                                             className="h-7 w-7 p-0"
                                             onClick={() => setEditingField(null)}
                                           >
                                             <Check className="h-3.5 w-3.5" />
                                           </Button>
                                         </div>
                                       ) : (
                                         <button
                                           onClick={() => setEditingField({ groupId: group.shiftIds.join('-'), field: 'time' })}
                                           className="hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                         >
                                           {group.startTime} - {group.endTime}
                                         </button>
                                       )
                                     ) : (
                                       "-"
                                     )}
                                   </td>
                                   <td className="p-2">
                                     <div className="flex flex-wrap gap-1.5 items-center">
                                       {[...new Set(group.days.map(d => d.dayName))].map((dayName) => {
                                         const dayShifts = group.days.filter(d => d.dayName === dayName);
                                         return (
                                           <Badge 
                                             key={dayName} 
                                             variant="secondary"
                                             className="gap-1 pr-1"
                                           >
                                             {dayName}
                                             <button
                                               onClick={async (e) => {
                                                 e.stopPropagation();
                                                 const shiftIds = dayShifts.map(d => d.shiftId);
                                                 const { error } = await supabase
                                                   .from("shifts")
                                                   .delete()
                                                   .in("id", shiftIds);
                                                 
                                                 if (error) {
                                                   toast.error("Failed to remove day");
                                                   return;
                                                 }
                                                 
                                                 toast.success(`Removed ${dayName}`);
                                                 fetchShifts();
                                               }}
                                               className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors"
                                             >
                                               <X className="h-3 w-3" />
                                             </button>
                                           </Badge>
                                         );
                                       })}
                                       {(() => {
                                         const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                         const existingDays = [...new Set(group.days.map(d => d.dayName))];
                                         const remainingDays = allDays.filter(day => !existingDays.includes(day));
                                         
                                         if (remainingDays.length === 0) return null;
                                         
                                         return (
                                           <DropdownMenu>
                                             <DropdownMenuTrigger asChild>
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 className="h-6 w-6 p-0 rounded-full"
                                                 onClick={(e) => e.stopPropagation()}
                                               >
                                                 <Plus className="h-3.5 w-3.5" />
                                               </Button>
                                             </DropdownMenuTrigger>
                                             <DropdownMenuContent className="z-50 bg-popover" align="start">
                                               {remainingDays.map((dayName) => (
                                                 <DropdownMenuItem
                                                   key={dayName}
                                                   onClick={async (e) => {
                                                     e.stopPropagation();
                                                     const firstShift = shifts.find(s => s.id === group.shiftIds[0]);
                                                     if (!firstShift || !user) return;
                                                     
                                                     // Find a date that matches this day name within the group's date range
                                                     const startDate = new Date(group.startDate);
                                                     const endDate = new Date(group.endDate);
                                                     const dates = [];
                                                     
                                                     for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                                                       const currentDayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                                                       if (currentDayName === dayName) {
                                                         dates.push(new Date(d).toISOString().split("T")[0]);
                                                       }
                                                     }
                                                     
                                                     if (dates.length === 0) {
                                                       toast.error("No dates found for this day in the current range");
                                                       return;
                                                     }
                                                     
                                                     const shiftsToInsert = dates.map(date => ({
                                                       user_id: user.id,
                                                       staff_id: firstShift.staffId,
                                                       type: group.type,
                                                       start_time: group.startTime,
                                                       end_time: group.endTime,
                                                       day: date,
                                                     }));
                                                     
                                                     const { error } = await supabase.from("shifts").insert(shiftsToInsert);
                                                     
                                                     if (error) {
                                                       toast.error("Failed to add day");
                                                       return;
                                                     }
                                                     
                                                     toast.success(`Added ${dayName}`);
                                                     fetchShifts();
                                                   }}
                                                   className="capitalize cursor-pointer"
                                                 >
                                                   {dayName}
                                                 </DropdownMenuItem>
                                               ))}
                                             </DropdownMenuContent>
                                           </DropdownMenu>
                                         );
                                       })()}
                                     </div>
                                   </td>
                                   <td className="p-2">
                                      {editingField?.groupId === group.shiftIds.join('-') && editingField?.field === 'startDate' ? (
                                        <div className="flex items-center gap-2">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button variant="outline" size="sm" className="h-8 justify-start">
                                                <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                                                {group.startDate ? format(new Date(group.startDate + 'T00:00:00'), "PP") : "Select date"}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                              <Calendar
                                                mode="single"
                                                selected={group.startDate ? new Date(group.startDate + 'T00:00:00') : undefined}
                                                onSelect={async (date) => {
                                                  if (!date) return;
                                                  const newDate = date.toISOString().split("T")[0];
                                                  const oldDate = group.startDate;
                                                  
                                                  // Update all shifts with this start date
                                                  const shiftsToUpdate = group.days.filter(d => d.day === oldDate);
                                                  const { error } = await supabase
                                                    .from("shifts")
                                                    .update({ day: newDate })
                                                    .in("id", shiftsToUpdate.map(s => s.shiftId));
                                                  
                                                  if (!error) {
                                                    toast.success("Start date updated");
                                                    fetchShifts();
                                                    setEditingField(null);
                                                  } else {
                                                    toast.error("Failed to update start date");
                                                  }
                                                }}
                                                initialFocus
                                                className="pointer-events-auto"
                                              />
                                            </PopoverContent>
                                          </Popover>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setEditingField(null)}
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setEditingField({ groupId: group.shiftIds.join('-'), field: 'startDate' })}
                                          className="hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                        >
                                          {group.startDate ? format(new Date(group.startDate + 'T00:00:00'), "yyyy-MM-dd") : "-"}
                                        </button>
                                      )}
                                    </td>
                                   <td className="p-2">
                                      {editingField?.groupId === group.shiftIds.join('-') && editingField?.field === 'endDate' ? (
                                        <div className="flex items-center gap-2">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button variant="outline" size="sm" className="h-8 justify-start">
                                                <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                                                {group.endDate ? format(new Date(group.endDate + 'T00:00:00'), "PP") : "Select date"}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                              <Calendar
                                                mode="single"
                                                selected={group.endDate ? new Date(group.endDate + 'T00:00:00') : undefined}
                                                onSelect={async (date) => {
                                                  if (!date) return;
                                                  const newDate = date.toISOString().split("T")[0];
                                                  const oldDate = group.endDate;
                                                  
                                                  // Update all shifts with this end date
                                                  const shiftsToUpdate = group.days.filter(d => d.day === oldDate);
                                                  const { error } = await supabase
                                                    .from("shifts")
                                                    .update({ day: newDate })
                                                    .in("id", shiftsToUpdate.map(s => s.shiftId));
                                                  
                                                  if (!error) {
                                                    toast.success("End date updated");
                                                    fetchShifts();
                                                    setEditingField(null);
                                                  } else {
                                                    toast.error("Failed to update end date");
                                                  }
                                                }}
                                                initialFocus
                                                className="pointer-events-auto"
                                              />
                                            </PopoverContent>
                                          </Popover>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setEditingField(null)}
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setEditingField({ groupId: group.shiftIds.join('-'), field: 'endDate' })}
                                          className="hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                                        >
                                          {group.endDate ? format(new Date(group.endDate + 'T00:00:00'), "yyyy-MM-dd") : "-"}
                                        </button>
                                      )}
                                    </td>
                                  <td className="p-2 text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         className="h-7 w-7 p-0"
                                         onClick={() => {
                                           const firstShift = shifts.find(s => s.id === group.shiftIds[0]);
                                           if (firstShift) handleEditShift(firstShift, group.shiftIds);
                                         }}
                                       >
                                         <Pencil className="h-3.5 w-3.5" />
                                       </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={async () => {
                                          const { error } = await supabase
                                            .from("shifts")
                                            .delete()
                                            .in("id", group.shiftIds);
                                          
                                          if (error) {
                                            toast.error("Failed to delete shifts");
                                            return;
                                          }
                                          
                                          toast.success(`Deleted ${group.shiftIds.length} shift(s)`);
                                          fetchShifts();
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground pt-2">
                          {filterType !== "all" ? "No shifts match the current filter" : "No shifts assigned"}
                        </p>
                      )}
                    </SortableStaffAccordionItem>
                  ))}
                </Accordion>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>

      <ShiftDialog
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        onSave={handleSaveShift}
        editShift={editingShift}
        editingGroupShifts={editingGroupIds.length > 0 ? shifts.filter(s => editingGroupIds.includes(s.id)) : undefined}
        isPartOfRecurringGroup={editingShift?.recurringGroupId != null}
      />
    </div>
  );
}
