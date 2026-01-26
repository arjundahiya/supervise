// src/app/admin/dashboard/page.tsx
import { auth } from "@/lib/auth"; 
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Users, Clock, BookOpen, TrendingUp, Filter } from "lucide-react";
import { format } from "date-fns";
import { CreateSupervisionButton } from "./create-supervision-button"; 
import { ManageSupervisionDialog } from "./manage-supervision-dialog";

// --- Real Data Fetching ---
async function getAdminData() {
  const supervisions = await prisma.supervision.findMany({
    include: {
      students: {
        // Change: Fetch details, not just ID, so the Edit form works
        select: { 
            id: true, 
            full_name: true,  // Adjust to your actual DB column name (e.g. name or full_name)
            email_address: true 
        } 
      }
    },
    orderBy: {
      startsAt: 'asc'
    }
  });
  
  // Mapping stays mostly the same
  return supervisions.map(s => ({
    ...s,
    studentCount: s.students.length,
    supervisorName: s.description?.split('\n')[0].startsWith('Supervisor:') 
      ? s.description.split('\n')[0].replace('Supervisor: ', '') 
      : "Staff Member"
  }));
}

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  // Security check (uncomment when roles are fully set up)
  // if (session?.user.role !== "ADMIN") redirect("/");

  const supervisions = await getAdminData();
  const now = new Date();
  
  // Logic to split lists
  const upcoming = supervisions.filter(s => s.endsAt >= now);
  const past = supervisions.filter(s => s.endsAt < now).sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

  // Stats
  const totalStudents = supervisions.reduce((acc, s) => acc + s.studentCount, 0);
  // Calculate unique staff based on our "Description hack" or just count total sessions
  const activeStaff = new Set(supervisions.map(s => s.supervisorName)).size;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supervision Manager</h1>
          <p className="text-muted-foreground mt-1">
            Overview of all academic sessions and logistics.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
            <CreateSupervisionButton />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Supervisions" value={supervisions.length} icon={TrendingUp} description="Active sessions" />
        <StatsCard title="Total Students" value={totalStudents} icon={Users} description="Enrolled in sessions" />
        <StatsCard title="Upcoming" value={upcoming.length} icon={Clock} description="This week" />
        <StatsCard title="Active Staff" value={activeStaff} icon={BookOpen} description="Supervisors" />
      </div>

      {/* Upcoming Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Upcoming Schedule
          <Badge variant="secondary" className="ml-2">{upcoming.length}</Badge>
        </h2>
        
        {upcoming.length === 0 ? (
             <div className="text-muted-foreground text-sm italic py-8">No upcoming supervisions scheduled.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((supervision) => (
              <AdminSupervisionCard key={supervision.id} supervision={supervision} />
            ))}
          </div>
        )}
      </section>

      {/* Past Section */}
      {past.length > 0 && (
        <section className="space-y-4 pt-8 border-t">
          <h2 className="text-xl font-semibold text-muted-foreground">Recent History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {past.map((supervision) => (
              <AdminSupervisionCard key={supervision.id} supervision={supervision} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// --- Sub-components ---

function StatsCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function AdminSupervisionCard({ supervision, isPast }: { supervision: any, isPast?: boolean }) {
  return (
    <Card className={`flex flex-col h-full ${isPast ? "bg-muted/40" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold leading-tight">
              {supervision.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <span className="font-medium text-foreground">{supervision.supervisorName}</span>
            </CardDescription>
          </div>
          <Badge variant={isPast ? "outline" : "default"}>
             {isPast ? "Done" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3 text-sm grid gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" /> 
            {supervision.location}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
             <CalendarDays className="w-4 h-4" />
             {format(supervision.startsAt, "EEE, d MMM")} • {format(supervision.startsAt, "h:mm a")}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
             <Users className="w-4 h-4" />
             {supervision.studentCount} Students assigned
        </div>
      </CardContent>
      <div className="p-4 pt-0 mt-auto">
        <ManageSupervisionDialog supervision={supervision} />
      </div>
    </Card>
  )
}