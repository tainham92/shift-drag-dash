import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Staff } from "@/types/shift";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, LogOut, Phone, Mail, MapPin, Banknote } from "lucide-react";
import { StaffDialog } from "@/components/StaffDialog";
import { getStaffColor } from "@/lib/timeUtils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Auth } from "@/components/Auth";

export default function Employee() {
  const navigate = useNavigate();
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
      employmentType: s.employment_type as "full-time" | "part-time",
      joinedDate: s.joined_date,
      dateOfBirth: s.date_of_birth,
      nationalId: s.national_id,
      education: s.education,
      avatarUrl: s.avatar_url,
      phone: s.phone,
      email: s.email,
      position: s.position
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
      employmentType: data.employment_type as "full-time" | "part-time",
      joinedDate: data.joined_date,
      dateOfBirth: data.date_of_birth,
      nationalId: data.national_id,
      education: data.education,
      avatarUrl: data.avatar_url,
      phone: data.phone,
      email: data.email,
      position: data.position
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
                ₫{staff.length > 0 
                  ? (staff.reduce((sum, s) => sum + s.hourlyRate, 0) / staff.length).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
                  : "0"}
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
                ₫{staff.reduce((sum, s) => sum + s.hourlyRate, 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Grid */}
        {staff.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No employees added yet.</p>
              <Button
                onClick={() => setStaffDialogOpen(true)}
                variant="outline"
                className="mt-4"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Your First Employee
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => {
              const color = getStaffColor(member.colorIndex);
              
              return (
                <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                        Active
                      </Badge>
                      <Badge variant="outline">
                        {member.employmentType === "full-time" ? "Full-time" : "Part-time"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      {member.avatarUrl ? (
                        <img 
                          src={member.avatarUrl} 
                          alt={member.name}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar className="h-14 w-14" style={{ backgroundColor: color }}>
                          <AvatarFallback className="text-white font-medium text-lg">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.position || "—"}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Phone</span>
                      <span className="ml-auto text-primary text-right break-all">
                        {member.phone || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">E-mail</span>
                      <span className="ml-auto text-primary text-right break-all">
                        {member.email || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Banknote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">Hourly Rate</span>
                      <span className="ml-auto text-primary font-semibold">
                        ₫{member.hourlyRate.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}/hr
                      </span>
                    </div>
                  </CardContent>
                  <div className="px-6 pb-6">
                    <Button
                      onClick={() => navigate(`/employee/${member.id}`)}
                      variant="secondary"
                      className="w-full"
                    >
                      View Employee Profile
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <StaffDialog
        open={staffDialogOpen}
        onOpenChange={setStaffDialogOpen}
        onSave={handleAddStaff}
      />
    </div>
  );
}
