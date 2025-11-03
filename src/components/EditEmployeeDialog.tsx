import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import { Staff } from "@/types/shift";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Staff;
  onUpdate: () => void;
}

export const EditEmployeeDialog = ({ open, onOpenChange, employee, onUpdate }: EditEmployeeDialogProps) => {
  const [name, setName] = useState(employee.name);
  const [dateOfBirth, setDateOfBirth] = useState(employee.dateOfBirth || "");
  const [nationalId, setNationalId] = useState(employee.nationalId || "");
  const [joinedDate, setJoinedDate] = useState(employee.joinedDate);
  const [education, setEducation] = useState(employee.education || "");
  const [rate, setRate] = useState(
    employee.employmentType === "full-time" 
      ? (employee.monthlySalary?.toString() || "")
      : (employee.hourlyRate?.toString() || "")
  );
  const [employmentType, setEmploymentType] = useState<"full-time" | "part-time">(employee.employmentType);
  const [phone, setPhone] = useState(employee.phone || "");
  const [email, setEmail] = useState(employee.email || "");
  const [position, setPosition] = useState(employee.position || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(employee.avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(employee.name);
    setDateOfBirth(employee.dateOfBirth || "");
    setNationalId(employee.nationalId || "");
    setJoinedDate(employee.joinedDate);
    setEducation(employee.education || "");
    setRate(
      employee.employmentType === "full-time"
        ? (employee.monthlySalary?.toString() || "")
        : (employee.hourlyRate?.toString() || "")
    );
    setEmploymentType(employee.employmentType);
    setPhone(employee.phone || "");
    setEmail(employee.email || "");
    setPosition(employee.position || "");
    setAvatarPreview(employee.avatarUrl || "");
    setAvatarFile(null);
  }, [employee, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return employee.avatarUrl || null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${employee.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload avatar");
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name || !rate) {
      toast.error(`Name and ${employmentType === "full-time" ? "monthly salary" : "hourly rate"} are required`);
      return;
    }

    setUploading(true);

    try {
      let avatarUrl = employee.avatarUrl;
      
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      const updateData: any = {
        name,
        date_of_birth: dateOfBirth || null,
        national_id: nationalId || null,
        joined_date: joinedDate,
        education: education || null,
        employment_type: employmentType,
        phone: phone || null,
        email: email || null,
        position: position || null,
        avatar_url: avatarUrl
      };

      if (employmentType === "full-time") {
        updateData.monthly_salary = parseFloat(rate);
        updateData.hourly_rate = null;
      } else {
        updateData.hourly_rate = parseFloat(rate);
        updateData.monthly_salary = null;
      }

      const { error } = await supabase
        .from("staff")
        .update(updateData)
        .eq("id", employee.id);

      if (error) {
        toast.error("Failed to update employee");
        return;
      }

      toast.success("Employee updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt={name} />
                ) : (
                  <AvatarFallback>{getInitials(name)}</AvatarFallback>
                )}
              </Avatar>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">Click camera icon to upload avatar</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Account Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment-type">Employment Type *</Label>
              <Select value={employmentType} onValueChange={(value: "full-time" | "part-time") => setEmploymentType(value)}>
                <SelectTrigger id="employment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">
                {employmentType === "full-time" ? "Monthly Salary (VND) *" : "Hourly Rate (VND) *"}
              </Label>
              <Input
                id="rate"
                type="number"
                step="1000"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={employmentType === "full-time" ? "10000000" : "150000"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., +48 790 25 7765"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., employee@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="national-id">National ID</Label>
              <Input
                id="national-id"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="joined">Joined Date *</Label>
              <Input
                id="joined"
                type="date"
                value={joinedDate}
                onChange={(e) => setJoinedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g., Bachelor's in Business"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={uploading}>
            {uploading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
