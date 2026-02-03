"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Loader2, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { getPossibleSwapTargets, createSwapRequest } from "@/app/actions/swap-requests";
import { toast } from "sonner";

interface SwapRequestDialogProps {
  supervisionId: string;
  supervisionTitle: string;
  currentUserId: string;
}

export function SwapRequestDialog({ 
  supervisionId, 
  supervisionTitle, 
  currentUserId 
}: SwapRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validTargets, setValidTargets] = useState<any[]>([]);
  const [invalidTargets, setInvalidTargets] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadTargets();
    }
  }, [open]);

  const loadTargets = async () => {
    setIsLoading(true);
    const result = await getPossibleSwapTargets(supervisionId, currentUserId);
    
    if (result.success && result.availableTargets && result.unavailableTargets) {
      setValidTargets(result.availableTargets);
      setInvalidTargets(result.unavailableTargets);
    } else {
      toast.error("Failed to load swap options");
    }
    setIsLoading(false);
  };

  const handleRequestSwap = async (targetId: string, targetEmail: string) => {
    setIsSubmitting(true);
    const result = await createSwapRequest(supervisionId, currentUserId, targetId, targetEmail);
    
    if (result.success) {
      toast.success("Swap request sent!");
      setOpen(false);
    } else {
      toast.error(result.error || "Failed to send request");
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Swap
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Request Supervision Swap</DialogTitle>
          <DialogDescription>
            Swap with students in other time slots for "{supervisionTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (validTargets.length === 0 && invalidTargets.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No other students enrolled in this supervision series.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-100 overflow-y-auto pr-2">
              {validTargets.map((target) => (
                <div 
                  key={`${target.id}-${target.supervisionId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={target.image || ""} />
                      <AvatarFallback className="text-xs">
                        {target.full_name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium text-sm leading-none">{target.full_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {format(new Date(target.supervisionTime), "EEE, d MMM 'at' h:mm a")}
                        </Badge>
                        {target.supervisionLocation && (
                          <span className="text-[10px] text-muted-foreground">
                            @ {target.supervisionLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleRequestSwap(target.id, target.email_address)}
                    disabled={isSubmitting}
                  >
                    Request
                  </Button>
                </div>
              ))}
              {invalidTargets.map((target) => (
                <div 
                  key={`${target.id}-${target.supervisionId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={target.image || ""} />
                      <AvatarFallback className="text-xs">
                        {target.full_name.split(" ").map((n: string) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium text-sm leading-none">{target.full_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {format(new Date(target.supervisionTime), "EEE, d MMM 'at' h:mm a")}
                        </Badge>
                        {target.supervisionLocation && (
                          <span className="text-[10px] text-muted-foreground">
                            @ {target.supervisionLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    variant="outline"
                    disabled={true}
                  >
                    Conflicts
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}