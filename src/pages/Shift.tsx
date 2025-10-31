import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { ShiftDialog } from "@/components/ShiftDialog";
import { StaffDialog } from "@/components/StaffDialog";
import type { Shift as ShiftType, Staff, ShiftType as ShiftTypeEnum } from "@/types/shift";
import { Auth } from "@/components/Auth";
import { getStaffColor } from "@/lib/timeUtils";

export default function Shift() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

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
    setShiftDialogOpen(true);
  };

  const handleSaveShift = async (
    type: ShiftTypeEnum,
    startTime: string,
    endTime: string
  ) => {
    if (!selectedStaffId || !user) return;

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
            <div className="space-y-4">
              {staff.map((member) => (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getStaffColor(member.colorIndex) }}
                      />
                      <h3 className="font-semibold">{member.name}</h3>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddShift(member.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Shift
                    </Button>
                  </div>

                  {groupedShifts[member.id]?.length > 0 ? (
                    <div className="space-y-2">
                      {groupedShifts[member.id].map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between bg-secondary/50 rounded p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium capitalize">
                              {shift.type}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {shift.day}
                            </span>
                            {shift.type === "regular" && (
                              <span className="text-sm">
                                {shift.startTime} - {shift.endTime}
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No shifts assigned
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ShiftDialog
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        onSave={handleSaveShift}
      />
    </div>
  );
}
