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
    let currentStart = formData.startsAt;
    const endLimit = formData.repeatUntil || formData.startsAt;
    
    // Using a transaction to ensure all weeks and relations are created together
    await db.transaction(async (tx) => {
      let count = 0;

      while (currentStart <= endLimit && count < 52) {
        const currentEnd = addMinutes(currentStart, formData.durationMinutes);

        // 1. Insert the supervision session
        const [newSupervision] = await tx
          .insert(supervisions)
          .values({
            title: formData.title,
            location: formData.location,
            description: fullDescription,
            startsAt: currentStart,
            endsAt: currentEnd,
          })
          .returning({ id: supervisions.id });

        // 2. Insert the many-to-many relations (Junction Table)
        if (formData.studentIds.length > 0) {
          await tx.insert(usersToSupervisions).values(
            formData.studentIds.map((userId) => ({
              supervisionId: newSupervision.id,
              userId: userId,
            }))
          );
        }

        currentStart = addWeeks(currentStart, 1);
        count++;
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to create supervision:", error);
    return { success: false, error: "Failed to create" };
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

    await db.transaction(async (tx) => {
      // 1. Update the main record
      await tx
        .update(supervisions)
        .set({
          title: data.title,
          location: data.location,
          description: fullDescription,
          startsAt: data.startsAt,
          endsAt: endsAt,
        })
        .where(eq(supervisions.id, id));

      // 2. Sync Many-to-Many: Delete old relations and insert new ones
      await tx
        .delete(usersToSupervisions)
        .where(eq(usersToSupervisions.supervisionId, id));

      if (data.studentIds.length > 0) {
        await tx.insert(usersToSupervisions).values(
          data.studentIds.map((sid) => ({
            supervisionId: id,
            userId: sid,
          }))
        );
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update" };
  }
}