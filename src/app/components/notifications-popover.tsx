"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, ArrowRightLeft, Clock } from "lucide-react";
import { format } from "date-fns";
import { acceptSwapRequest, rejectSwapRequest } from "@/app/actions/swap-requests";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationsPopoverProps {
  swapRequests: any[];
  userId: string;
}

export function NotificationsPopover({ swapRequests, userId }: NotificationsPopoverProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Filter for pending requests where user is the target
  const pendingRequests = swapRequests.filter(
    req => req.targetId === userId && req.status === "PENDING"
  );

  // All other requests (sent, accepted, rejected)
  const otherRequests = swapRequests.filter(
    req => req.status !== "PENDING" || req.requesterId === userId
  );

  const handleAccept = async (requestId: string) => {
    setIsProcessing(requestId);
    const result = await acceptSwapRequest(requestId, userId);
    
    if (result.success) {
      toast.success("Swap accepted! Your schedules have been updated.");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to accept swap");
    }
    setIsProcessing(null);
  };

  const handleReject = async (requestId: string) => {
    setIsProcessing(requestId);
    const result = await rejectSwapRequest(requestId, userId);
    
    if (result.success) {
      toast.success("Swap request rejected");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to reject swap");
    }
    setIsProcessing(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: "default", label: "Pending" },
      ACCEPTED: { variant: "default", label: "Accepted" },
      REJECTED: { variant: "outline", label: "Rejected" },
      CANCELLED: { variant: "outline", label: "Cancelled" },
    };
    
    const config = variants[status] || variants.PENDING;
    return <Badge variant={config.variant} className="text-[10px] h-4">{config.label}</Badge>;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="w-5 h-5" />
          {pendingRequests.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {pendingRequests.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              You have {pendingRequests.length} pending swap request{pendingRequests.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {swapRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <>
              {/* Pending Requests (Actionable) */}
              {pendingRequests.length > 0 && (
                <div className="border-b">
                  <div className="px-4 py-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Pending Requests</p>
                  </div>
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-4 border-b last:border-b-0 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 mt-0.5">
                          <AvatarImage src={request.requester.image || ""} />
                          <AvatarFallback className="text-xs">
                            {request.requester.full_name.split(" ").map((n: string) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">{request.requester.full_name}</span>
                            {' '}wants to swap supervisions
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ArrowRightLeft className="w-3 h-3" />
                            {request.supervision.title}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.createdAt), "MMM d 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-1.5"
                          onClick={() => handleAccept(request.id)}
                          disabled={isProcessing !== null}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 gap-1.5"
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing !== null}
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Other Requests (Read-only) */}
              {otherRequests.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Recent Activity</p>
                  </div>
                  {otherRequests.slice(0, 5).map((request) => {
                    const isRequester = request.requesterId === userId;
                    const otherPerson = isRequester ? request.target : request.requester;
                    
                    return (
                      <div key={request.id} className="p-4 border-b last:border-b-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={otherPerson.image || ""} />
                            <AvatarFallback className="text-xs">
                              {otherPerson.full_name.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm leading-tight">
                                {isRequester ? (
                                  <>You requested to swap with <span className="font-medium">{otherPerson.full_name}</span></>
                                ) : (
                                  <><span className="font-medium">{otherPerson.full_name}</span> requested to swap</>
                                )}
                              </p>
                              {getStatusBadge(request.status)}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {format(new Date(request.createdAt), "MMM d 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}