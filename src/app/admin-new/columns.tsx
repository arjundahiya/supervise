"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format, isPast } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ManageSupervisionDialog } from "../admin/components/manage-supervision-dialog";

export type Supervision = {
  id: string;
  title: string;
  supervisorName: string;
  location: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  studentCount: number;
  students: Array<{
    id: string;
    full_name: string;
    email_address: string;
    image?: string;
  }>;
};

export const columns: ColumnDef<Supervision>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Module
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("title")}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.supervisorName}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "startsAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date & Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("startsAt") as Date;
      const endDate = row.original.endsAt;
      return (
        <div>
          <div className="text-sm">{format(date, "EEE, d MMM yyyy")}</div>
          <div className="text-xs text-muted-foreground">
            {format(date, "h:mm a")} - {format(endDate, "h:mm a")}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      return <div className="text-sm">{row.getValue("location")}</div>;
    },
  },
  {
    id: "students",
    header: "Students",
    cell: ({ row }) => {
      const students = row.original.students;
      const displayCount = 3;
      const remaining = students.length - displayCount;

      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{students.length}</span>
          {students.length > 0 && (
            <div className="flex -space-x-2">
              {students.slice(0, displayCount).map((student) => (
                <Avatar key={student.id} className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px]">
                    {student.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              ))}
              {remaining > 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                  +{remaining}
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const isPastSession = isPast(row.original.endsAt);
      return isPastSession ? (
        <Badge variant="outline">Completed</Badge>
      ) : (
        <Badge>Upcoming</Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supervision = row.original;

      return (
        <div className="text-right">
          <ManageSupervisionDialog supervision={supervision} />
        </div>
      );
    },
  },
];