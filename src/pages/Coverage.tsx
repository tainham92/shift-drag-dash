import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronDown, LogOut, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TIME_SLOTS, calculateCoverageForTimeSlot, getCoverageIntensityColor, getStaffColor } from "@/lib/timeUtils";
import { Staff, Shift } from "@/types/shift";
import { toast } from "sonner";

export default function Coverage() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [date, loading]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
      return;
    }
    setLoading(false);
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [staffData, shiftsData] = await Promise.all([
      supabase.from("staff").select("*").eq("user_id", user.id),
      supabase.from("shifts").select("*").eq("user_id", user.id),
    ]);

    if (staffData.data) {
      setStaff(staffData.data.map(s => ({
        id: s.id,
        name: s.name,
        colorIndex: s.color_index,
        hourlyRate: s.hourly_rate,
      })));
    }
    
    if (shiftsData.data) {
      setShifts(shiftsData.data.map(s => ({
        id: s.id,
        staffId: s.staff_id,
        day: s.day,
        startTime: s.start_time,
        endTime: s.end_time,
        type: s.type as "regular" | "flexible" | "leave" | "week-off",
      })));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const setToday = () => setDate(new Date());
  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDate(yesterday);
  };
  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow);
  };

  const getCoverageStats = () => {
    const coverageBySlot = TIME_SLOTS.map(slot => {
      const staffIds = calculateCoverageForTimeSlot(shifts, slot, date);
      return { time: slot, count: staffIds.length };
    });

    const peakCoverage = coverageBySlot.reduce((max, curr) => 
      curr.count > max.count ? curr : max, coverageBySlot[0]);
    
    const lowestCoverage = coverageBySlot.reduce((min, curr) => 
      curr.count < min.count ? curr : min, coverageBySlot[0]);
    
    const avgCoverage = (coverageBySlot.reduce((sum, curr) => sum + curr.count, 0) / coverageBySlot.length).toFixed(1);
    
    const uniqueStaff = new Set(
      shifts
        .filter(s => {
          const dateString = date.toISOString().split("T")[0];
          const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
          return (s.day === dateString || s.day === dayName) && (s.type === "regular" || s.type === "flexible");
        })
        .map(s => s.staffId)
    ).size;

    return { peakCoverage, lowestCoverage, avgCoverage, uniqueStaff };
  };

  const getStaffForTimeSlot = (timeSlot: string) => {
    const staffIds = calculateCoverageForTimeSlot(shifts, timeSlot, date);
    return staff.filter(s => staffIds.includes(s.id));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = getCoverageStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Staff Coverage Timeline</h1>
            <p className="text-sm text-muted-foreground">View staff coverage by hour</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date to view staff coverage</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={setYesterday}>Yesterday</Button>
              <Button variant="secondary" onClick={setToday}>Today</Button>
              <Button variant="secondary" onClick={setTomorrow}>Tomorrow</Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Peak Coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.peakCoverage.count} staff</div>
              <p className="text-xs text-muted-foreground">at {stats.peakCoverage.time}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Lowest Coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowestCoverage.count} staff</div>
              <p className="text-xs text-muted-foreground">at {stats.lowestCoverage.time}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCoverage} staff</div>
              <p className="text-xs text-muted-foreground">throughout the day</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueStaff}</div>
              <p className="text-xs text-muted-foreground">working this day</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Coverage Timeline</CardTitle>
            <CardDescription>Staff working at each time slot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {TIME_SLOTS.map((timeSlot) => {
              const staffAtTime = getStaffForTimeSlot(timeSlot);
              const coverageClass = getCoverageIntensityColor(staffAtTime.length);

              return (
                <Collapsible key={timeSlot}>
                  <div className={cn("border rounded-lg p-4", coverageClass)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-semibold text-lg min-w-[60px]">{timeSlot}</span>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {staffAtTime.length} staff
                        </Badge>
                      </div>
                      
                      {staffAtTime.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>

                    {staffAtTime.length > 0 && (
                      <CollapsibleContent className="mt-4">
                        <div className="flex flex-wrap gap-3">
                          {staffAtTime.map((s) => (
                            <div key={s.id} className="flex items-center gap-2 bg-background/50 rounded-md px-3 py-2">
                              <Avatar className="h-8 w-8" style={{ backgroundColor: getStaffColor(s.colorIndex) }}>
                                <AvatarFallback className="text-white text-xs">
                                  {getInitials(s.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{s.name}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    )}
                  </div>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
