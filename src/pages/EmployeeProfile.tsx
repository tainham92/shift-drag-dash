import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CreditCard, GraduationCap, Briefcase, DollarSign, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Staff } from "@/types/shift";
import { getStaffColor } from "@/lib/timeUtils";
import { format } from "date-fns";
import { EditEmployeeDialog } from "@/components/EditEmployeeDialog";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchEmployee();
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
    };

    setEmployee(employeeData);
    setLoading(false);
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

      <EditEmployeeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        employee={employee}
        onUpdate={fetchEmployee}
      />
    </div>
  );
}
