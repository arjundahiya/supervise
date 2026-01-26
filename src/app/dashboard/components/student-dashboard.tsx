import { auth } from "@/lib/auth"; // Adjust path to your auth client/server config
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Clock, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";
import { getUserAvailability } from "@/app/actions/availability";
import { AvailabilityManager } from "./availability-manager";
import { CalendarSyncButton } from "./calendar-sync-button";

// --- Types ---
// We define a type that matches the Prisma output with relations
type SupervisionWithStudents = Awaited<ReturnType<typeof getStudentSupervisions>>[number];

// --- Data Fetching ---
async function getStudentSupervisions(userId: string) {
  return await prisma.supervision.findMany({
    where: {
      students: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      students: {
        select: {
          id: true,
          full_name: true,
          image: true,
          email_address: true,
        },
      },
      // Optional: Check if there is already a pending swap for UI state
      swapRequests: {
        where: { requesterId: userId, status: "PENDING" },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });
}

// --- Components ---

/**
 * A helper component to render a single supervision card
 */
function SupervisionCard({ 
  supervision, 
  currentUserId 
}: { 
  supervision: SupervisionWithStudents, 
  currentUserId: string 
}) {
  const isPast = new Date(supervision.endsAt) < new Date();
  
  // Filter out the current user from the list to show "others"
  const otherStudents = supervision.students.filter(s => s.id !== currentUserId);

  return (
    <Card className={`flex flex-col h-full ${isPast ? "opacity-60 bg-muted/50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold leading-tight">
              {supervision.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {supervision.location}
            </CardDescription>
          </div>
          {isPast ? (
            <Badge variant="secondary">Completed</Badge>
          ) : (
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
              Upcoming
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        <div className="grid gap-4">
          {/* Time Details */}
          <div className="flex items-center gap-3 text-sm border-l-2 border-primary/20 pl-3">
            <div className="grid gap-0.5">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                {format(supervision.startsAt, "EEEE, d MMMM")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {format(supervision.startsAt, "h:mm a")} - {format(supervision.endsAt, "h:mm a")}
              </div>
            </div>
          </div>

          {/* Description (if exists) */}
          {supervision.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {supervision.description}
            </p>
          )}

          {/* Peers Section */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Users className="w-3 h-3" />
              <span>Supervision Partners</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {otherStudents.length > 0 ? (
                otherStudents.map((student) => (
                  <div key={student.id} className="flex items-center gap-2 bg-secondary/50 rounded-full pr-3 pl-1 py-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={student.image || ""} />
                      <AvatarFallback className="text-[10px]">
                        {student.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate max-w-[100px]">
                      {student.full_name}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Private supervision (1-on-1)
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/20">
        {/* Placeholder for Swap Action */}
        {!isPast && (
          <Button variant="outline" size="sm" className="w-full gap-2 group">
             <ArrowRightLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
             Request Swap
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// --- Main Page Component ---
export default async function StudentDashboard() {
  // 1. Authenticate User
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/");
  }

  // 2. Fetch Data
  const supervisionsData = getStudentSupervisions(session.user.id);
  const availabilityData = getUserAvailability(session.user.id);
  const [supervisions, availability] = await Promise.all([supervisionsData, availabilityData]);

  // 3. Separate Upcoming and Past for better UX
  const now = new Date();
  const upcoming = supervisions.filter(s => s.endsAt >= now);
  const past = supervisions.filter(s => s.endsAt < now);

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Supervisions</h1>
          <p className="text-muted-foreground mt-1">
            View your upcoming schedule and manage supervision swaps.
          </p>
        </div>
        <div className="flex gap-2">
          <CalendarSyncButton userId={session.user.id} />
            <AvailabilityManager 
                userId={session.user.id} 
                initialData={availability} 
            />
        </div>
      </div>

      {/* Upcoming Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Upcoming Sessions
          <Badge variant="outline" className="ml-2">{upcoming.length}</Badge>
        </h2>
        
        {upcoming.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-muted/10 border-dashed">
            <h3 className="text-lg font-medium">No upcoming supervisions</h3>
            <p className="text-muted-foreground">You are all caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((supervision) => (
              <SupervisionCard 
                key={supervision.id} 
                supervision={supervision} 
                currentUserId={session.user.id} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Section (Collapsible or just listed below) */}
      {past.length > 0 && (
        <section className="space-y-4 pt-8 border-t">
          <h2 className="text-xl font-semibold text-muted-foreground">Past Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
            {past.map((supervision) => (
              <SupervisionCard 
                key={supervision.id} 
                supervision={supervision} 
                currentUserId={session.user.id} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}