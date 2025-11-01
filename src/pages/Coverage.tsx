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
import { CalendarIcon, ChevronDown, LogOut, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { TIME_SLOTS, calculateCoverageForTimeSlot, getCoverageIntensityColor, getStaffColor, getWeekDates, DAYS, getDayOfWeek } from "@/lib/timeUtils";
import { Staff, Shift } from "@/types/shift";
import { toast } from "sonner";

const TIMEFRAMES = [
  { label: "Morning", start: "8:30", end: "11:30" },
  { label: "Afternoon", start: "11:30", end: "16:00" },
  { label: "Evening", start: "16:00", end: "21:00" },
];

export default function Coverage() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
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
  }, [weekStart, loading]);

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
        startTime: normalizeTime(s.start_time),
        endTime: normalizeTime(s.end_time),
        type: s.type as "regular" | "flexible" | "leave" | "week-off",
      })));
    }
  };

  const normalizeTime = (time: string): string => {
    // Convert "09:00" to "9:00" to match TIME_SLOTS format
    const [hours, minutes] = time.split(":");
    return `${parseInt(hours)}:${minutes}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const setThisWeek = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const setPreviousWeek = () => setWeekStart(prev => subWeeks(prev, 1));
  const setNextWeek = () => setWeekStart(prev => addWeeks(prev, 1));

  const weekDates = getWeekDates(weekStart);

  const getStaffForTimeframe = (timeframe: typeof TIMEFRAMES[0], date: Date) => {
    const startIdx = TIME_SLOTS.indexOf(timeframe.start);
    const endIdx = TIME_SLOTS.indexOf(timeframe.end);
    
    if (startIdx === -1 || endIdx === -1) return [];
    
    const staffSet = new Set<string>();
    
    for (let i = startIdx; i < endIdx; i++) {
      const timeSlot = TIME_SLOTS[i];
      const staffIds = calculateCoverageForTimeSlot(shifts, timeSlot, date);
      staffIds.forEach(id => staffSet.add(id));
    }
    
    return staff.filter(s => staffSet.has(s.id));
  };

  const getCoverageStats = () => {
    let totalCoverage = 0;
    let maxCoverage = 0;
    let minCoverage = Infinity;
    let maxTime = "";
    let minTime = "";
    let count = 0;

    weekDates.forEach(date => {
      TIMEFRAMES.forEach(timeframe => {
        const staffCount = getStaffForTimeframe(timeframe, date).length;
        totalCoverage += staffCount;
        count++;
        
        if (staffCount > maxCoverage) {
          maxCoverage = staffCount;
          maxTime = `${format(date, "EEE")} ${timeframe.label}`;
        }
        if (staffCount < minCoverage) {
          minCoverage = staffCount;
          minTime = `${format(date, "EEE")} ${timeframe.label}`;
        }
      });
    });

    const avgCoverage = (totalCoverage / count).toFixed(1);
    
    const uniqueStaff = new Set(
      shifts
        .filter(s => {
          const shiftMatchesWeek = weekDates.some(date => {
            const dateString = date.toISOString().split("T")[0];
            const dayName = DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
            return (s.day === dateString || s.day === dayName) && (s.type === "regular" || s.type === "flexible");
          });
          return shiftMatchesWeek;
        })
        .map(s => s.staffId)
    ).size;

    return { 
      peakCoverage: { count: maxCoverage, time: maxTime },
      lowestCoverage: { count: minCoverage === Infinity ? 0 : minCoverage, time: minTime },
      avgCoverage,
      uniqueStaff 
    };
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Staff Coverage Timeline</h1>
          <Button onClick={handleLogout} variant="ghost">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
        {/* Week Selection and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-base">Select Week</CardTitle>
              <CardDescription className="text-xs">Choose a week to view staff coverage</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal text-xs")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={weekStart}
                    onSelect={(newDate) => newDate && setWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardDescription className="text-xs">Peak Coverage</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl font-bold">{stats.peakCoverage.count} staff</div>
                <p className="text-[10px] text-muted-foreground">at {stats.peakCoverage.time}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardDescription className="text-xs">Lowest Coverage</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl font-bold">{stats.lowestCoverage.count} staff</div>
                <p className="text-[10px] text-muted-foreground">at {stats.lowestCoverage.time}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-3">
                <CardDescription className="text-xs">Total Staff</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl font-bold">{stats.uniqueStaff}</div>
                <p className="text-[10px] text-muted-foreground">working this week</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Week Coverage Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Coverage Grid</CardTitle>
            <CardDescription>Staff working in each timeframe throughout the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-3 bg-muted font-semibold text-left min-w-[120px]">Time</th>
                    {weekDates.map((date, idx) => (
                      <th key={idx} className="border p-3 bg-muted font-semibold text-center min-w-[100px]">
                        <div>{DAYS[idx]}</div>
                        <div className="text-xs font-normal text-muted-foreground">{format(date, "MMM d")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIMEFRAMES.map((timeframe) => (
                    <tr key={timeframe.label}>
                      <td className="border p-3 font-medium">
                        <div>{timeframe.label}</div>
                        <div className="text-xs text-muted-foreground">{timeframe.start} - {timeframe.end}</div>
                      </td>
                      {weekDates.map((date, idx) => {
                        const staffInTimeframe = getStaffForTimeframe(timeframe, date);
                        const coverageClass = getCoverageIntensityColor(staffInTimeframe.length);

                        return (
                          <td key={idx} className="border p-0">
                            <div className={cn("p-3 h-full min-h-[120px]", coverageClass)}>
                              {staffInTimeframe.length > 0 ? (
                                <div className="space-y-2">
                                  {staffInTimeframe.map((s) => (
                                    <div key={s.id} className="flex items-center gap-2 bg-background/50 rounded-md px-2 py-1.5">
                                      <Avatar className="h-6 w-6" style={{ backgroundColor: getStaffColor(s.colorIndex) }}>
                                        <AvatarFallback className="text-white text-[10px]">
                                          {getInitials(s.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-medium truncate">{s.name}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Badge variant="secondary" className="gap-1">
                                    <Users className="h-3 w-3" />
                                    0
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
