"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Ensure you have this component, or use a Checkbox
import { Plus, Calendar as CalendarIcon, Search, Loader2, Repeat, AlertCircle } from "lucide-react";
import { areIntervalsOverlapping, format, set, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { createSupervision, getStudentsForSelection } from "@/app/actions/supervisions";
import { getAvailabilityForDate } from "@/app/actions/availability";
import { useRouter } from "next/navigation";

export function CreateSupervisionButton() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  // Form State
  const [title, setTitle] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  // Date/Time State
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("60"); // Default 60 mins
  
  // Repetition State
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatUntil, setRepeatUntil] = useState<Date | undefined>(undefined);

  // Student State
  const [students, setStudents] = useState<any[]>([]); 
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dailyAvailability, setDailyAvailability] = useState<any[]>([]); // NEW
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoadingStudents(true);
      getStudentsForSelection()
        .then(setStudents)
        .catch(console.error)
        .finally(() => setIsLoadingStudents(false));
    }
  }, [open]);

  useEffect(() => {
    if (date) {
      getAvailabilityForDate(date)
        .then(setDailyAvailability)
        .catch((err) => console.error("Failed to load availability", err));
    } else {
      setDailyAvailability([]);
    }
  }, [date]);

  const checkConflict = (studentId: string) => {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    const sessionStart = set(date, { hours, minutes });
    const sessionEnd = addMinutes(sessionStart, parseInt(duration) || 60);

    // Find overlapping slots
    const conflict = dailyAvailability.find(slot => {
      const isTimeOverlapping = areIntervalsOverlapping(
        { start: sessionStart, end: sessionEnd },
        { start: new Date(slot.startsAt), end: new Date(slot.endsAt) }
      );

      // Conflict if: Time overlaps AND (Slot belongs to student OR Slot is GLOBAL)
      return isTimeOverlapping && (slot.userId === studentId || slot.type === "GLOBAL");
    });

    return conflict;
  };

  const handleSubmit = async () => {
    if (!title || !date || !supervisor) {
      alert("Please fill in Title, Supervisor, and Date.");
      return;
    }
    
    // Validate Repeat Logic
    if (isRecurring && !repeatUntil) {
       alert("Please select an end date for the repetition.");
       return;
    }

    setIsSubmitting(true);

    const [hours, minutes] = time.split(":").map(Number);
    // Combine selected date with selected time
    const startsAt = set(date, { hours, minutes });
    
    // If recurring, ensure repeatUntil also has the correct time (for consistency, though logic mostly uses date part)
    const effectiveRepeatUntil = isRecurring && repeatUntil 
        ? set(repeatUntil, { hours: 23, minutes: 59 }) // Set to end of that day to catch the session
        : undefined;

    const result = await createSupervision({
      title,
      supervisorName: supervisor,
      location,
      description,
      startsAt,
      durationMinutes: parseInt(duration),
      repeatUntil: effectiveRepeatUntil,
      studentIds: selectedStudents
    });

    setIsSubmitting(false);

    if (result.success) {
      setOpen(false);
      // Reset form
      setTitle("");
      setSupervisor("");
      setLocation("");
      setDescription("");
      setSelectedStudents([]);
      setIsRecurring(false);
      setRepeatUntil(undefined);
      router.refresh(); 
    } else {
      alert("Failed to create supervision.");
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Create Supervision
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Supervision</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Module / Title</Label>
                    <Input placeholder="IA Maths" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Supervisor</Label>
                    <Input placeholder="Dr. Name" value={supervisor} onChange={e => setSupervisor(e.target.value)} />
                </div>
            </div>

            {/* Row 2 */}
            <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="Room number or College" value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            {/* Row 3: Date, Time, Duration */}
            <div className="grid grid-cols-4 gap-4">
                 <div className="space-y-2 col-span-4 md:col-span-3">
                    <Label>Date & Time</Label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant={"outline"} 
                                    className={cn("flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Input 
                          type="time" 
                          className="w-30" 
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                            <SelectValue placeholder="Length" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30 mins</SelectItem>
                            <SelectItem value="45">45 mins</SelectItem>
                            <SelectItem value="60">1 Hour</SelectItem>
                            <SelectItem value="90">1.5 Hours</SelectItem>
                            <SelectItem value="120">2 Hours</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Repetition Toggle */}
            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="recurring" className="cursor-pointer">Repeat Weekly</Label>
                    </div>
                    <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>
                
                {isRecurring && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label>Repeat Until</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant={"outline"} 
                                    className={cn("w-full justify-start text-left font-normal", !repeatUntil && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {repeatUntil ? format(repeatUntil, "PPP") : <span>Select end date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar 
                                    mode="single" 
                                    selected={repeatUntil} 
                                    onSelect={setRepeatUntil} 
                                    disabled={(date) => date < new Date()} // Prevent past dates
                                    initialFocus 
                                />
                            </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                            This will create a session every week until the selected date.
                        </p>
                    </div>
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label>Description / Notes</Label>
                <Textarea 
                  placeholder="Required reading, topics to cover..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                />
            </div>

            {/* Student Selector (Same as before) */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-between items-center">
                    <Label>Assign Students</Label>
                    <span className="text-xs text-muted-foreground">{selectedStudents.length} selected</span>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8 bg-background" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                
                <div className="h-37.5 overflow-y-auto space-y-1 pr-1">
                    {isLoadingStudents ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5" /></div>
                    ) : (
                        filteredStudents.map(student => {
                            // CHECK CONFLICT
                            const conflict = checkConflict(student.id);
                            
                            return (
                                <div 
                                    key={student.id} 
                                    className={cn(
                                        "flex items-center space-x-2 p-2 rounded transition-colors border",
                                        // RED BACKGROUND IF CONFLICT
                                        conflict 
                                            ? "bg-red-50 border-red-200 hover:bg-red-100" 
                                            : "border-transparent hover:bg-muted/50"
                                    )}
                                >
                                    <Checkbox 
                                        id={student.id} 
                                        checked={selectedStudents.includes(student.id)}
                                        onCheckedChange={(checked) => {
                                            if(conflict && checked) {
                                                if(!confirm(`Warning: ${student.full_name} is busy at this time. Assign anyway?`)) return;
                                            }
                                            checked 
                                              ? setSelectedStudents([...selectedStudents, student.id])
                                              : setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                                        }}
                                    />
                                    <div className="flex-1 flex justify-between items-center">
                                        <Label htmlFor={student.id} className="cursor-pointer font-normal">
                                            {student.full_name}
                                        </Label>
                                        
                                        {/* CONFLICT INDICATOR */}
                                        {conflict && (
                                            <div className="flex items-center text-red-600 text-xs font-medium gap-1" title="User has availability blocked">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>
                                                    {conflict.type === 'GLOBAL' ? 'Holiday' : 'Busy'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Generating Schedule..." : "Create Session"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}