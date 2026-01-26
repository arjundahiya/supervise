export const dynamic = 'force-dynamic';

import prisma from "@/lib/prisma";
import { createEvents, EventAttributes } from "ics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> } // Updated for Next.js 16 params
) {
  const { userId } = await params;

  // 1. Fetch Supervisions for this user
  const supervisions = await prisma.supervision.findMany({
    where: {
      students: {
        some: { id: userId },
      },
      // Only fetch future events or recent past? 
      // Usually good to fetch everything from 1 month ago onwards
      startsAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) 
      }
    },
    include: {
      students: { select: { full_name: true } }
    }
  });

  if (!supervisions || supervisions.length === 0) {
    // Return empty calendar if no events
    return new NextResponse("BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My App//EN\nEND:VCALENDAR", {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="supervisions.ics"`,
        }
    });
  }

  // 2. Format for ICS
  const events: EventAttributes[] = supervisions.map((s) => {
    // ICS expects start/end as [year, month, day, hour, minute]
    // Note: Month is 1-indexed in ICS, but 0-indexed in JS Date? 
    // Actually ICS library handles Date objects or arrays. Arrays are safer.
    const start = new Date(s.startsAt);
    const end = new Date(s.endsAt);

    return {
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      title: `Supervision: ${s.title}`,
      description: s.description || "No description provided",
      location: s.location,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      organizer: { name: "Stooge", email: "hjs83@cam.ac.uk" },
      // Optional: List attendees (privacy warning: this exposes names in the calendar file)
      // attendees: s.students.map(stu => ({ name: stu.full_name })) 
    };
  });

  // 3. Generate content
  return new Promise((resolve) => {
    createEvents(events, (error, value) => {
      if (error) {
        console.error(error);
        resolve(new NextResponse("Error generating calendar", { status: 500 }));
        return;
      }

      resolve(
        new NextResponse(value, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="supervisions.ics"`,
            // Cache control is important so Google checks back
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        })
      );
    });
  });
}