"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Loader2, Trash2, AlertCircle, Clock } from "lucide-react";
import { format, set, differenceInMinutes, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { updateSupervision, deleteSupervision, getStudentsForSelection, checkSupervisionConflicts } from "@/app/actions/supervisions";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ManageSupervisionProps {
  supervision: {
    id: string;
    title: string;
    location: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
    supervisorName: string;
    students: { id: string; full_name?: string; email_address?: string }[];
  }
}

export function ManageSupervisionDialog({ supervision }: ManageSupervisionProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Parse initial state
  const initialDuration = differenceInMinutes(supervision.endsAt, supervision.startsAt).toString();
  const cleanDescription = supervision.description?.replace(/Supervisor: .*\n\n/, '') || "";

  const [title, setTitle] = useState(supervision.title);
  const [supervisor, setSupervisor] = useState(supervision.supervisorName);
  const [location, setLocation] = useState(supervision.location);
  const [description, setDescription] = useState(cleanDescription);
  const [date, setDate] = useState<Date | undefined>(supervision.startsAt);
  const [time, setTime] = useState(format(supervision.startsAt, "HH:mm"));
  const [duration, setDuration] = useState(initialDuration);
  
  // Student Selection
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(supervision.students.map(s => s.id));
  const [supervisionConflicts, setSupervisionConflicts] = useState<Record<string, any[]>>({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Load all students only when dialog opens
  useEffect(() => {
    if (open && allStudents.length === 0) {
      setIsLoadingStudents(true);
      getStudentsForSelection()
        .then(setAllStudents)
        .finally(() => setIsLoadingStudents(false));
    }
  }, [open]);

  // Check for supervision conflicts whenever relevant fields change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!date || !time || allStudents.length === 0) {
        setSupervisionConflicts({});
        return;
      }

      setIsCheckingConflicts(true);
      
      const [hours, minutes] = time.split(":").map(Number);
      const sessionStart = set(date, { hours, minutes });
      const sessionEnd = addMinutes(sessionStart, parseInt(duration) || 60);

      // Exclude current supervision from conflict check
      const conflicts = await checkSupervisionConflicts(
        allStudents.map(s => s.id),
        sessionStart,
        sessionEnd,
        supervision.id // Exclude this supervision
      );

      setSupervisionConflicts(conflicts);
      setIsCheckingConflicts(false);
    };

    checkConflicts();
  }, [date, time, duration, allStudents, supervision.id]);

  const checkSupervisionConflict = (studentId: string) => {
    return supervisionConflicts[studentId] || null;
  };

  const getConflictInfo = (studentId: string) => {
    const supConflicts = checkSupervisionConflict(studentId);
    if (supConflicts && supConflicts.length > 0) {
      return {
        type: 'SUPERVISION' as const,
        data: supConflicts[0],
        count: supConflicts.length
      };
    }
    return null;
  };

  const handleSave = async () => {
    if (!date) return;
    setIsSubmitting(true);
    
    const [hours, minutes] = time.split(":").map(Number);
    const startsAt = set(date, { hours, minutes });

    const result = await updateSupervision(supervision.id, {
      title,
      supervisorName: supervisor,
      location,
      description,
      startsAt,
      durationMinutes: parseInt(duration),
      studentIds: selectedStudents
    });

    setIsSubmitting(false);
    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert("Failed to update.");
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const result = await deleteSupervision(supervision.id);
    setIsSubmitting(false);
    if (result.success) {
      setOpen(false);
      router.refresh();
    } else {
      alert("Failed to delete.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">Manage Details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Supervision</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
           {/* Basic Fields */}
           <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Module</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Supervisor</Label>
                    <Input value={supervisor} onChange={e => setSupervisor(e.target.value)} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} />
            </div>

            {/* Date/Time */}
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Date & Time</Label>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Input type="time" className="w-22.5" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30 mins</SelectItem>
                            <SelectItem value="45">45 mins</SelectItem>
                            <SelectItem value="60">1 Hour</SelectItem>
                            <SelectItem value="90">1.5 Hours</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

             {/* Description */}
            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Students with Conflict Detection */}
            <div className="space-y-2 border rounded-md p-3">
                <div className="flex justify-between items-center">
                    <Label>Enrolled Students ({selectedStudents.length})</Label>
                    {isCheckingConflicts && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>
                <div className="h-30 overflow-y-auto space-y-1 mt-2">
                    {isLoadingStudents ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                        allStudents.map(student => {
                            const conflict = getConflictInfo(student.id);
                            
                            return (
                                <div 
                                    key={student.id} 
                                    className={cn(
                                        "flex items-center space-x-2 p-2 rounded transition-colors border",
                                        conflict 
                                            ? "bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/50" 
                                            : "border-transparent hover:bg-muted/50"
                                    )}
                                >
                                    <Checkbox 
                                        id={`edit-${student.id}`} 
                                        checked={selectedStudents.includes(student.id)}
                                        onCheckedChange={(checked) => {
                                            if(conflict && checked) {
                                                const conflictMsg = `${student.full_name} already has a supervision at this time (${conflict.data.title}). Assign anyway?`;
                                                if(!confirm(conflictMsg)) return;
                                            }
                                            checked 
                                              ? setSelectedStudents([...selectedStudents, student.id])
                                              : setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                                        }}
                                    />
                                    <div className="flex-1 flex justify-between items-center">
                                        <Label htmlFor={`edit-${student.id}`} className="cursor-pointer font-normal">
                                            {student.full_name}
                                        </Label>
                                        
                                        {conflict && (
                                            <div className="flex items-center text-red-600 dark:text-red-400 text-xs font-medium gap-1"
                                                 title={`Already has: ${conflict.data.title}`}>
                                                <Clock className="w-3 h-3" />
                                                <span>Has Supervision</span>
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

        <DialogFooter className="flex justify-between items-center sm:justify-between">
           {/* Delete Button with Confirmation */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button" disabled={isSubmitting}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this supervision session.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                   {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}