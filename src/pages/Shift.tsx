import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Clock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ShiftDialog } from "@/components/ShiftDialog";
import { StaffDialog } from "@/components/StaffDialog";
import type { Shift as ShiftType, Staff, ShiftType as ShiftTypeEnum } from "@/types/shift";
import { Auth } from "@/components/Auth";
import { getStaffColor, generateRecurringDates } from "@/lib/timeUtils";

export default function Shift() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);

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
    }));

    setShifts(mappedShifts);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Failed to fetch staff");
      return;
    }

    const mappedStaff = (data || []).map((member) => ({
      id: member.id,
      name: member.name,
      colorIndex: member.color_index,
      hourlyRate: member.hourly_rate,
    }));

    setStaff(mappedStaff);
  };

  const handleAddShift = (staffId: string) => {
    setSelectedStaffId(staffId);
    setEditingShift(null);
    setShiftDialogOpen(true);
  };

  const handleEditShift = (shift: ShiftType) => {
    setSelectedStaffId(shift.staffId);
    setEditingShift(shift);
    setShiftDialogOpen(true);
  };

  const handleSaveShift = async (
    startTime: string,
    endTime: string,
    type: ShiftTypeEnum,
    isRecurring?: boolean,
    dateRange?: { startDate: Date; endDate: Date },
    selectedDays?: string[],
    shiftId?: string
  ) => {
    if (!selectedStaffId || !user) return;

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

      const shiftsToInsert = dates.map((date) => ({
        user_id: user.id,
        staff_id: selectedStaffId,
        type,
        start_time: startTime,
        end_time: endTime,
        day: date,
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

      const shiftsToInsert = dates.map((date) => ({
        user_id: user.id,
        staff_id: selectedStaffId,
        type,
        start_time: startTime,
        end_time: endTime,
        day: date,
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
            <CardTitle>All Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {staff.map((member) => (
                <AccordionItem key={member.id} value={member.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
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
                  <AccordionContent>
                    {groupedShifts[member.id]?.length > 0 ? (
                      <div className="border rounded-md">
                        <table className="w-full text-sm">
                          <thead className="border-b bg-muted/50">
                            <tr>
                              <th className="text-left p-2 font-medium">Type</th>
                              <th className="text-left p-2 font-medium">Date</th>
                              <th className="text-left p-2 font-medium">Time</th>
                              <th className="text-right p-2 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupedShifts[member.id].map((shift, idx) => (
                              <tr 
                                key={shift.id} 
                                className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                              >
                                <td className="p-2 capitalize">{shift.type}</td>
                                <td className="p-2 text-muted-foreground">{shift.day}</td>
                                <td className="p-2">
                                  {shift.type === "regular" 
                                    ? `${shift.startTime} - ${shift.endTime}`
                                    : "-"
                                  }
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleEditShift(shift)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleDeleteShift(shift.id)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pt-2">
                        No shifts assigned
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <ShiftDialog
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        onSave={handleSaveShift}
        editShift={editingShift}
      />
    </div>
  );
}
