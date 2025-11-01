import { useState, useEffect } from "react";
import { Staff } from "@/types/shift";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Pencil, Trash2, LogOut } from "lucide-react";
import { StaffDialog } from "@/components/StaffDialog";
import { getStaffColor } from "@/lib/timeUtils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Auth } from "@/components/Auth";

export default function Employee() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStaff();
    }
  }, [user]);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load staff");
      return;
    }

    const staffData: Staff[] = (data || []).map(s => ({
      id: s.id,
      name: s.name,
      colorIndex: s.color_index,
      hourlyRate: s.hourly_rate,
      employmentType: s.employment_type as "full-time" | "part-time"
    }));

    setStaff(staffData);
  };

  const handleAddStaff = async (newStaff: Omit<Staff, "id">) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("staff")
      .insert({
        user_id: user.id,
        name: newStaff.name,
        color_index: newStaff.colorIndex,
        hourly_rate: newStaff.hourlyRate,
        employment_type: newStaff.employmentType
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add staff");
      return;
    }

    const staff: Staff = {
      id: data.id,
      name: data.name,
      colorIndex: data.color_index,
      hourlyRate: data.hourly_rate,
      employmentType: data.employment_type as "full-time" | "part-time"
    };

    setStaff(prev => [...prev, staff]);
    toast.success(`${staff.name} added to staff`);
  };

  const handleDeleteStaff = async (staffId: string) => {
    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("id", staffId);

    if (error) {
      toast.error("Failed to delete staff");
      return;
    }

    setStaff(prev => prev.filter(s => s.id !== staffId));
    toast.success("Staff member deleted");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
            <p className="text-muted-foreground mt-1">Manage your staff members</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setStaffDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{staff.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Hourly Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">
                ${staff.length > 0 
                  ? (staff.reduce((sum, s) => sum + s.hourlyRate, 0) / staff.length).toFixed(2)
                  : "0.00"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payroll (per hour)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                ${staff.reduce((sum, s) => sum + s.hourlyRate, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No employees added yet.</p>
                <Button
                  onClick={() => setStaffDialogOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Your First Employee
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {staff.map((member) => {
                  const color = getStaffColor(member.colorIndex);
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12" style={{ backgroundColor: color }}>
                          <AvatarFallback className="text-white font-medium">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-lg">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${member.hourlyRate.toFixed(2)}/hour
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStaff(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <StaffDialog
        open={staffDialogOpen}
        onOpenChange={setStaffDialogOpen}
        onSave={handleAddStaff}
      />
    </div>
  );
}
