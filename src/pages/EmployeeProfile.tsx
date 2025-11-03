import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CreditCard, GraduationCap, Briefcase, DollarSign, Pencil, Phone, Mail, Briefcase as Position, Plus } from "lucide-react";
import { toast } from "sonner";
import { Staff, Shift as ShiftType, ShiftType as ShiftTypeEnum } from "@/types/shift";
import { getStaffColor } from "@/lib/timeUtils";
import { format } from "date-fns";
import { EditEmployeeDialog } from "@/components/EditEmployeeDialog";
import { EmployeeShiftsTable } from "@/components/EmployeeShiftsTable";
import { ShiftDialog } from "@/components/ShiftDialog";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Staff | null>(null);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchEmployee();
      fetchShifts();
    }
  }, [id]);

  const fetchEmployee = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load employee");
      navigate("/employee");
      return;
    }

    const employeeData: Staff = {
      id: data.id,
      name: data.name,
      colorIndex: data.color_index,
      hourlyRate: data.hourly_rate,
      employmentType: data.employment_type as "full-time" | "part-time",
      dateOfBirth: data.date_of_birth,
      nationalId: data.national_id,
      joinedDate: data.joined_date,
      education: data.education,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      email: data.email,
      position: data.position,
    };

    setEmployee(employeeData);
    setLoading(false);
  };

  const fetchShifts = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("staff_id", id)
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

  const handleAddShift = () => {
    setEditingShift(null);
    setShiftDialogOpen(true);
  };

  const handleEditShift = (shift: ShiftType) => {
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
    if (!id || !user) return;

    // If editing an existing shift and converting to recurring
    if (shiftId && isRecurring && dateRange && selectedDays && selectedDays.length > 0) {
      // Delete the original shift
      await supabase.from("shifts").delete().eq("id", shiftId);

      // Create all recurring shifts
      const { generateRecurringDates } = await import("@/lib/timeUtils");
      const dates = generateRecurringDates(
        dateRange.startDate,
        dateRange.endDate,
        selectedDays
      );

      const shiftsToInsert = dates.map((date) => ({
        user_id: user.id,
        staff_id: id,
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

    // Creating new shift(s)
    if (isRecurring && dateRange && selectedDays && selectedDays.length > 0) {
      const { generateRecurringDates } = await import("@/lib/timeUtils");
      const dates = generateRecurringDates(
        dateRange.startDate,
        dateRange.endDate,
        selectedDays
      );

      const shiftsToInsert = dates.map((date) => ({
        user_id: user.id,
        staff_id: id,
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
      // Single shift
      const shiftDay = dateRange?.startDate 
        ? dateRange.startDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("shifts").insert({
        user_id: user.id,
        staff_id: id,
        type,
        start_time: startTime,
        end_time: endTime,
        day: shiftDay,
      });

      if (error) {
        toast.error("Failed to add shift");
        return;
      }

      toast.success("Shift added successfully");
    }

    fetchShifts();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/employee")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold flex-1">Employee Profile</h1>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar
                className="h-24 w-24"
                style={{ backgroundColor: employee.avatarUrl ? undefined : getStaffColor(employee.colorIndex) }}
              >
                {employee.avatarUrl ? (
                  <AvatarImage src={employee.avatarUrl} alt={employee.name} />
                ) : (
                  <AvatarFallback className="text-white text-2xl">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <CardTitle className="text-2xl">{employee.name}</CardTitle>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize">
                {employee.employmentType}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.position && (
              <div className="flex items-start gap-3">
                <Position className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Position
                  </p>
                  <p className="text-base">{employee.position}</p>
                </div>
              </div>
            )}

            {employee.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-base">{employee.phone}</p>
                </div>
              </div>
            )}

            {employee.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-base">{employee.email}</p>
                </div>
              </div>
            )}

            {employee.dateOfBirth && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date of Birth
                  </p>
                  <p className="text-base">
                    {format(new Date(employee.dateOfBirth), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}

            {employee.nationalId && (
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    National ID
                  </p>
                  <p className="text-base">{employee.nationalId}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Joined
                </p>
                <p className="text-base">
                  {format(new Date(employee.joinedDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {employee.education && (
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Education
                  </p>
                  <p className="text-base">{employee.education}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Hourly Rate
                </p>
                <p className="text-base">${employee.hourlyRate.toFixed(2)}/hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shifts Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Shifts</CardTitle>
            <Button onClick={handleAddShift} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Shift
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EmployeeShiftsTable 
            shifts={shifts} 
            onRefresh={fetchShifts}
            onEditShift={handleEditShift}
          />
        </CardContent>
      </Card>

      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        employee={employee}
        onUpdate={fetchEmployee}
      />

      <ShiftDialog
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        onSave={handleSaveShift}
        editShift={editingShift}
      />
    </div>
  );
}
