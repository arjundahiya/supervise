"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function CalendarSyncButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const [httpUrl, setHttpUrl] = useState("");
  const [webcalUrl, setWebcalUrl] = useState("");

  // Calculate URLs on client-side to ensure correct host/domain
  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      const protocol = window.location.protocol;
      
      // The HTTP URL (for copying)
      setHttpUrl(`${protocol}//${host}/api/calendar/${userId}`);
      
      // The Webcal URL (for clicking) - forces 'webcal://' scheme
      setWebcalUrl(`webcal://${host}/api/calendar/${userId}`);
    }
  }, [userId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(httpUrl);
    setCopied(true);
    toast.success("Calendar URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Calendar className="w-4 h-4" />
          Sync Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sync Schedule</DialogTitle>
          <DialogDescription>
            Add your supervisions to your personal calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* OPTION 1: ONE-CLICK SUBSCRIBE (Apple/Outlook) */}
            <div className="space-y-2">
                <Label className="text-base font-semibold">Automatic Setup</Label>
                <p className="text-xs text-muted-foreground mb-2">
                    Best for Apple Calendar, Outlook, and mobile devices.
                </p>
                <Button className="w-full gap-2" asChild>
                    <a href={webcalUrl}>
                        <ExternalLink className="w-4 h-4" /> 
                        Open in Calendar App
                    </a>
                </Button>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
            </div>

            {/* OPTION 2: MANUAL COPY (Google Calendar) */}
            <div className="space-y-2">
                <Label className="text-base font-semibold">Manual Setup</Label>
                <p className="text-xs text-muted-foreground mb-2">
                    Copy this link and paste it into Google Calendar (Add &gt; From URL).
                </p>
                <div className="flex gap-2">
                    <Input value={httpUrl} readOnly className="bg-muted text-muted-foreground font-mono text-xs" />
                    <Button size="icon" variant="outline" onClick={copyToClipboard}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}