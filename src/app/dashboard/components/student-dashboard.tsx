import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unstable_cache } from "next/cache";
import { CALENDAR_CACHE_TAG } from "@/app/api/calendar/[userId]/route";
import { db } from "@/lib/db";
import { supervisions, usersToSupervisions } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Users,
  Clock,
  ArrowRightLeft,
  Calendar as CalendarIcon,
  ChevronRight
} from "lucide-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { getUserAvailability } from "@/app/actions/availability";
import { AvailabilityManager } from "./availability-manager";
import { CalendarSyncButton } from "./calendar-sync-button";
import { SwapRequestDialog } from "./swap-request-dialog";


// --- Data Fetching ---
async function getStudentSupervisions(userId: string) {
  const now = new Date();
  const result = await db.query.supervisions.findMany({
    where: (supervisions, { exists }) =>
      and(
        gte(supervisions.endsAt, now),
        exists(
          db.select()
            .from(usersToSupervisions)
            .where(
              and(
                eq(usersToSupervisions.supervisionId, supervisions.id),
                eq(usersToSupervisions.userId, userId)
              )
            )
        )),
    with: {
      students: { with: { user: true } },
    },
    orderBy: (supervisions, { asc }) => [asc(supervisions.startsAt)],
  });

  return result.map(s => ({
    ...s,
    students: s.students.map(rel => rel.user),
  }));
}

const getCachedStudentSupervisions = unstable_cache(
  async (userId: string) => getStudentSupervisions(userId),
  ['student-supervisions'],
  {
    tags: [CALENDAR_CACHE_TAG],
    revalidate: 120 // 2 minutes
  }
);

// --- Components ---

function SupervisionRow({ supervision, currentUserId }: { supervision: any, currentUserId: string }) {
  const otherStudents = supervision.students.filter((s: any) => s.id !== currentUserId);

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-xl hover:shadow-md transition-all gap-4">
      <div className="flex items-start gap-4">
        {/* Time Column */}
        <div className="flex flex-col items-center justify-center min-w-20 py-2 bg-muted/50 rounded-lg text-secondary-foreground">
          <span className="text-sm font-bold">{format(supervision.startsAt, "h:mm")}</span>
          <span className="text-[10px] uppercase opacity-60">{format(supervision.startsAt, "a")}</span>
        </div>

        {/* Info Column */}
        <div className="space-y-1">
          <h3 className="font-semibold leading-none group-hover:text-primary transition-colors">
            {supervision.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(supervision.startsAt, "h:mm a")} - {format(supervision.endsAt, "h:mm a")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {supervision.location}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6">
        {/* Partners */}
        <div className="flex -space-x-2">
          {otherStudents.map((student: any) => (
            <Avatar key={student.id} className="w-7 h-7 border-2 border-background">
              <AvatarImage src={student.image || ""} />
              <AvatarFallback className="text-[10px]">{student.full_name[0]}</AvatarFallback>
            </Avatar>
          ))}
          {otherStudents.length === 0 && (
            <span className="text-[10px] text-muted-foreground italic px-2">1-on-1</span>
          )}
        </div>

        {/* Action */}
        <SwapRequestDialog
          supervisionId={supervision.id}
          supervisionTitle={supervision.title}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

export default async function StudentDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const [supervisions, availability] = await Promise.all([
    getCachedStudentSupervisions(session.user.id),
    getUserAvailability(session.user.id)
  ]);

  const now = new Date();

  // Grouping logic: Create an object where keys are date strings
  const groupedSupervisions = supervisions.reduce((acc: any, supervision) => {
    const dateKey = startOfDay(supervision.startsAt).toISOString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(supervision);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSupervisions).sort();

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <Badge className="mb-2" variant="outline">Student Portal</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Your Schedule</h1>
          <p className="text-muted-foreground">Manage your sessions and swap requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarSyncButton userId={session.user.id} />
          <AvailabilityManager userId={session.user.id} initialData={availability} />
        </div>
      </header>

      <div className="space-y-8">
        {sortedDates.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl">
            <CalendarIcon className="mx-auto w-10 h-10 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No sessions found for the current term.</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => (
            <div key={dateStr} className="space-y-3">
              <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {format(new Date(dateStr), "EEEE, d MMMM")}
                {isSameDay(new Date(dateStr), now) && (
                  <Badge variant="secondary" className="text-[10px] h-4">Today</Badge>
                )}
              </h2>
              <div className="grid gap-2">
                {groupedSupervisions[dateStr].map((s: any) => (
                  <SupervisionRow key={s.id} supervision={s} currentUserId={session.user.id} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}