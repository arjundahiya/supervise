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
import { Calendar as CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { format, set, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { updateSupervision, deleteSupervision, getStudentsForSelection } from "@/app/actions/supervisions";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Define the shape of the supervision prop
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
  // Extract pure description (remove "Supervisor: ..." hack if present)
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
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Load all students only when dialog opens (for adding new ones)
  useEffect(() => {
    if (open && allStudents.length === 0) {
      setIsLoadingStudents(true);
      getStudentsForSelection()
        .then(setAllStudents)
        .finally(() => setIsLoadingStudents(false));
    }
  }, [open]);

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

            {/* Students */}
            <div className="space-y-2 border rounded-md p-3">
                <Label>Enrolled Students ({selectedStudents.length})</Label>
                <div className="h-30 overflow-y-auto space-y-1 mt-2">
                    {isLoadingStudents ? <Loader2 className="animate-spin h-4 w-4" /> : 
                     allStudents.map(student => (
                        <div key={student.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`edit-${student.id}`} 
                                checked={selectedStudents.includes(student.id)}
                                onCheckedChange={(checked) => {
                                    checked 
                                      ? setSelectedStudents([...selectedStudents, student.id])
                                      : setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                                }}
                            />
                            <Label htmlFor={`edit-${student.id}`}>{student.full_name}</Label>
                        </div>
                    ))}
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