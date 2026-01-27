import prisma from "@/lib/prisma";
import { createEvents, EventAttributes } from "ics";
import { NextRequest, NextResponse } from "next/server";

// Ensure the calendar is always fresh when requested
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // 1. Fetch Supervisions for this user
  const supervisions = await prisma.supervision.findMany({
    where: {
      students: {
        some: { id: userId },
      },
      // Fetch everything from 1 month ago onwards
      startsAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) 
      }
    },
    include: {
      students: { select: { full_name: true } }
    }
  });

  // 2. Handle empty calendar case
  if (!supervisions || supervisions.length === 0) {
    return new NextResponse(
      "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My App//EN\nEND:VCALENDAR", 
      {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="supervisions.ics"`,
            "Cache-Control": "no-store, max-age=0",
        }
      }
    );
  }

  // 3. Format for ICS
  const events: EventAttributes[] = supervisions.map((s) => {
    const start = new Date(s.startsAt);
    const end = new Date(s.endsAt);

    return {
      uid: `supervision-${s.id}@supervise`,
      start: [
        start.getFullYear(), 
        start.getMonth() + 1, 
        start.getDate(), 
        start.getHours(), 
        start.getMinutes()
      ],
      end: [
        end.getFullYear(), 
        end.getMonth() + 1, 
        end.getDate(), 
        end.getHours(), 
        end.getMinutes()
      ],
      title: `Supervision: ${s.title}`,
      description: s.description || "No description provided",
      location: s.location,
      status: "CONFIRMED",
      busyStatus: "BUSY",
      organizer: { name: "Stooge", email: "hjs83@cam.ac.uk" },
      dtstamp: [
        new Date().getUTCFullYear(),
        new Date().getUTCMonth() + 1,
        new Date().getUTCDate(),
        new Date().getUTCHours(),
        new Date().getUTCMinutes(),
      ],
    };
  });

  // 4. Generate content wrapped in a Typed Promise
  return new Promise<Response>((resolve) => {
    createEvents(events, (error, value) => {
      if (error) {
        console.error("ICS Generation Error:", error);
        // Resolve with a 500 error response instead of rejecting
        resolve(new NextResponse("Error generating calendar", { status: 500 }));
        return;
      }

      resolve(
        new NextResponse(value, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": `attachment; filename="supervisions.ics"`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })
      );
    });
  });
}