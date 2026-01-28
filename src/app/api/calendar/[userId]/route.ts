import { db } from "@/lib/db";
import { supervisions, usersToSupervisions } from "@/lib/db/schema";
import { eq, and, gte, exists } from "drizzle-orm";
import { createEvents, EventAttributes } from "ics";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const generateIcs = (events: EventAttributes[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    createEvents(events, (error, value) => {
      if (error) return reject(error);
      resolve(value);
    });
  });
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // 1. Fetch Supervisions where the student is present
    // Logic: find supervisions where a row exists in usersToSupervisions for this user
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const userSupervisions = await db
      .select()
      .from(supervisions)
      .where(
        and(
          gte(supervisions.startsAt, oneMonthAgo),
          exists(
            db
              .select()
              .from(usersToSupervisions)
              .where(
                and(
                  eq(usersToSupervisions.supervisionId, supervisions.id),
                  eq(usersToSupervisions.userId, userId)
                )
              )
          )
        )
      );

    // 2. Handle empty calendar case
    if (!userSupervisions || userSupervisions.length === 0) {
      const emptyCal = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My App//EN\nEND:VCALENDAR";
      return new NextResponse(emptyCal, {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `inline; filename="supervisions.ics"`,
        }
      });
    }

    // 3. Format for ICS
    const events: EventAttributes[] = userSupervisions.map((s) => {
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
        location: s.location || "TBD",
        status: "CONFIRMED",
        busyStatus: "BUSY",
        organizer: { name: "Stooge", email: "hjs83@cam.ac.uk" },
      };
    });

    // 4. Generate content
    const calendarContent = await generateIcs(events);

    return new NextResponse(calendarContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="supervisions.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    console.error("Route Handler Error:", error);
    return new NextResponse("Error generating calendar feed", { status: 500 });
  }
}