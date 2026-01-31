"use server";

import { db } from "@/lib/db"; // Your Drizzle + Neon client
import { users, supervisions, usersToSupervisions } from "@/lib/db/schema";
import { eq, inArray, asc, and, or, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { addWeeks, addMinutes } from "date-fns";
import { CALENDAR_CACHE_TAG } from "@/app/api/calendar/[userId]/route";

/**
 * Fetch all assignable users
 */
export async function getStudentsForSelection() {
  const result = await db
    .select({
      id: users.id,
      full_name: users.full_name,
      email_address: users.email_address,
    })
    .from(users)
    .where(inArray(users.role, ["STUDENT", "ADMIN"]))
    .orderBy(asc(users.full_name));

  return result.map((u) => ({
    id: u.id,
    full_name: u.full_name || "Unknown Name",
    email_address: u.email_address,
  }));
}

/**
 * Create a new supervision (with recursion/repeats)
 */
export async function createSupervision(formData: {
  title: string;
  supervisorName: string;
  location: string;
  description: string;
  startsAt: Date;
  durationMinutes: number;
  repeatUntil?: Date;
  studentIds: string[];
}) {
  try {
    const fullDescription = `Supervisor: ${formData.supervisorName}\n\n${formData.description}`;
    const endLimit = formData.repeatUntil || formData.startsAt;
    
    // 1. Prepare all Supervision rows first
    const supervisionRows = [];
    let currentStart = formData.startsAt;

    while (currentStart <= endLimit && supervisionRows.length < 52) {
      const currentEnd = addMinutes(currentStart, formData.durationMinutes);
      
      supervisionRows.push({
        title: formData.title,
        location: formData.location,
        description: fullDescription,
        startsAt: new Date(currentStart),
        endsAt: currentEnd,
      });

      currentStart = addWeeks(currentStart, 1);
    }

    // 2. Insert all supervisions in one batch and get their IDs back
    const insertedSupervisions = await db
      .insert(supervisions)
      .values(supervisionRows)
      .returning({ id: supervisions.id });

    // 3. Prepare the Junction Table rows (linking students to every session)
    if (formData.studentIds.length > 0 && insertedSupervisions.length > 0) {
      const junctionRows = insertedSupervisions.flatMap((s) =>
        formData.studentIds.map((userId) => ({
          supervisionId: s.id,
          userId: userId,
        }))
      );

      // 4. Insert all student links in one batch
      await db.insert(usersToSupervisions).values(junctionRows);
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidateTag(CALENDAR_CACHE_TAG, { expire: 0 });
    return { success: true, count: insertedSupervisions.length };
  } catch (error) {
    console.error("Failed to create supervision:", error);
    return { success: false, error: "Failed to create supervision" };
  }
}

/**
 * Delete supervision
 */
export async function deleteSupervision(id: string) {
  try {
    // Note: If you have "ON DELETE CASCADE" in your DB schema for the 
    // junction table, deleting the supervision will auto-delete relations.
    await db.delete(supervisions).where(eq(supervisions.id, id));
    
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidateTag(CALENDAR_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

/**
 * Update supervision
 */
export async function updateSupervision(
  id: string,
  data: {
    title: string;
    supervisorName: string;
    location: string;
    description: string;
    startsAt: Date;
    durationMinutes: number;
    studentIds: string[];
  }
) {
  try {
    const fullDescription = `Supervisor: ${data.supervisorName}\n\n${data.description}`;
    const endsAt = addMinutes(data.startsAt, data.durationMinutes);

    // 1. Update the main supervision details
    await db
      .update(supervisions)
      .set({
        title: data.title,
        location: data.location,
        description: fullDescription,
        startsAt: data.startsAt,
        endsAt: endsAt,
        updatedAt: new Date(), // Manually update the timestamp
      })
      .where(eq(supervisions.id, id));

    // 2. Clear out the current student assignments for this session
    await db
      .delete(usersToSupervisions)
      .where(eq(usersToSupervisions.supervisionId, id));

    // 3. Batch insert the new set of student assignments
    if (data.studentIds.length > 0) {
      await db.insert(usersToSupervisions).values(
        data.studentIds.map((sid) => ({
          supervisionId: id,
          userId: sid,
        }))
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidateTag(CALENDAR_CACHE_TAG, { expire: 0 });
    
    return { success: true };
  } catch (error) {
    console.error("Update failed:", error);
    return { success: false, error: "Failed to update supervision" };
  }
}

/**
 * Check if students have supervision conflicts at a given time
 * Returns map of userId -> conflicting supervision details
 */

export async function checkSupervisionConflicts(
  studentIds: string[],
  startTime: Date,
  endTime: Date,
  excludeSupervisionId?: string
) {
  if (studentIds.length === 0) {
    return {};
  }

  // Find all supervisions for these students that overlap with the given time
  const conflicts: Record<string, any> = {};

  for (const studentId of studentIds) {
    // Get all supervisions this student is enrolled in
    const studentSupervisions = await db
      .select({
        id: supervisions.id,
        title: supervisions.title,
        startsAt: supervisions.startsAt,
        endsAt: supervisions.endsAt,
        location: supervisions.location,
      })
      .from(supervisions)
      .innerJoin(
        usersToSupervisions,
        eq(usersToSupervisions.supervisionId, supervisions.id)
      )
      .where(
        and(
          eq(usersToSupervisions.userId, studentId),
          // Check for time overlap: (start1 < end2) AND (start2 < end1)
          sql`${supervisions.startsAt} < ${endTime}`,
          sql`${supervisions.endsAt} > ${startTime}`,
          // Optionally exclude a specific supervision (for edit mode)
          excludeSupervisionId
            ? sql`${supervisions.id} != ${excludeSupervisionId}`
            : sql`1=1`
        )
      );

    if (studentSupervisions.length > 0) {
      conflicts[studentId] = studentSupervisions;
    }
  }

  return conflicts;
}

/**
 * Get all supervisions for a specific date to help with conflict visualization
 */
export async function getSupervisionsForDate(date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const daySupervisions = await db.query.supervisions.findMany({
    where: and(
      sql`${supervisions.startsAt} >= ${dayStart}`,
      sql`${supervisions.startsAt} <= ${dayEnd}`
    ),
    with: {
      students: {
        with: {
          user: {
            columns: {
              id: true,
              full_name: true,
            }
          }
        }
      }
    },
    orderBy: (supervisions, { asc }) => [asc(supervisions.startsAt)]
  });

  return daySupervisions;
}