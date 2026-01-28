"use server";

import { db } from "@/lib/db"; // Your Drizzle + Neon client
import { users, supervisions, usersToSupervisions } from "@/lib/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { addWeeks, addMinutes } from "date-fns";

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
    
    return { success: true };
  } catch (error) {
    console.error("Update failed:", error);
    return { success: false, error: "Failed to update supervision" };
  }
}