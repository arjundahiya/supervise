import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Users, Clock } from "lucide-react";
import { CreateSupervisionButton } from "../admin/components/create-supervision-button";
import { DataTable } from "./data-table";
import { columns } from "./columns";

// --- Real Data Fetching with Drizzle ---
async function getAdminData() {
  const result = await db.query.supervisions.findMany({
    with: {
      students: {
        with: {
          user: {
            columns: {
              id: true,
              full_name: true,
              email_address: true,
            },
          },
        },
      },
    },
    orderBy: (supervisions, { asc }) => [asc(supervisions.startsAt)],
  });

  // Transform the Drizzle "Junction" structure back to a flat array for the UI
  return result.map((s) => {
    const flattenedStudents = s.students.map((rel) => rel.user);

    return {
      ...s,
      students: flattenedStudents,
      studentCount: flattenedStudents.length,
      supervisorName: s.description?.split("\n")[0].startsWith("Supervisor:")
        ? s.description.split("\n")[0].replace("Supervisor: ", "")
        : "Staff Member",
    };
  });
}

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Security check
  // if (session?.user.role !== "ADMIN") redirect("/");

  const supervisions = await getAdminData();
  const now = new Date();

  const upcoming = supervisions.filter((s) => s.endsAt >= now);
  const past = supervisions
    .filter((s) => s.endsAt < now)
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

  const totalStudents = supervisions.reduce((acc, s) => acc + s.studentCount, 0);
  const activeStaff = new Set(supervisions.map((s) => s.supervisorName)).size;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Supervision Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of all academic sessions and logistics.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateSupervisionButton />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Supervisions"
          value={supervisions.length}
          icon={TrendingUp}
          description="Active sessions"
        />
        <StatsCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          description="Enrolled in sessions"
        />
        <StatsCard
          title="Upcoming"
          value={upcoming.length}
          icon={Clock}
          description="This week"
        />
        <StatsCard
          title="Active Staff"
          value={activeStaff}
          icon={BookOpen}
          description="Supervisors"
        />
      </div>

      {/* Data Table Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Supervisions</CardTitle>
              <CardDescription>
                Manage and organize supervision sessions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{upcoming.length} Upcoming</Badge>
              <Badge variant="outline">{past.length} Past</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={supervisions} />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Sub-components (Stay exactly the same) ---

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