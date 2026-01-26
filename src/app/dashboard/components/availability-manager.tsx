"use client";

import { useState } from "react";
import { format, set, addMinutes } from "date-fns";
import { Calendar as CalendarIcon, Trash2, Plus, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { addBusySlot, deleteAvailability } from "@/app/actions/availability";

// UI Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area"; // Optional, or use div with overflow

interface AvailabilityManagerProps {
    userId: string;
    initialData: any[]; // The slots fetched from the server
}

export function AvailabilityManager({ userId, initialData }: AvailabilityManagerProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [startTime, setStartTime] = useState("09:00");
    const [duration, setDuration] = useState("60");

    const handleAdd = async () => {
        if (!date || !startTime) return;
        setIsSubmitting(true);

        const [hours, minutes] = startTime.split(":").map(Number);
        const startsAt = set(date, { hours, minutes });
        const endsAt = addMinutes(startsAt, parseInt(duration));

        const result = await addBusySlot(userId, startsAt, endsAt);

        setIsSubmitting(false);
        if (result.success) {
            router.refresh(); // Refresh to show new slot in the list below
        } else {
            alert("Failed to save.");
        }
    };

    const handleDelete = async (id: string) => {
        // Optimistic UI update could go here, but router.refresh is safer
        await deleteAvailability(id);
        router.refresh();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Update Availability</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Availability</DialogTitle>
                    <DialogDescription>
                        Block off times when you cannot attend supervisions.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 1. ADD NEW SLOT FORM */}
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add New Block
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                            <Input className="col-span-1" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            <div className="col-span-1">
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="60">1 Hour</SelectItem>
                                        <SelectItem value="120">2 Hours</SelectItem>
                                        <SelectItem value="180">3 Hours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button onClick={handleAdd} disabled={isSubmitting} size="sm" className="w-full">
                            {isSubmitting ? "Adding..." : "Block Time"}
                        </Button>
                    </div>

                    {/* 2. EXISTING SLOTS LIST */}
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Your Blocked Times</h4>
                        <div className="h-[200px] overflow-y-auto pr-2 space-y-2 border rounded-md p-2">
                            {initialData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                                    No blocked times recorded.
                                </div>
                            ) : (
                                initialData.map((slot) => (
                                    <div key={slot.id} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            <div>
                                                <p className="font-medium">{format(new Date(slot.startsAt), "MMM d")}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(slot.startsAt), "HH:mm")} - {format(new Date(slot.endsAt), "HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(slot.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}