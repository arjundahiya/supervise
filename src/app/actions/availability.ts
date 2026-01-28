"use server";

import { db } from "@/lib/db";
import { availabilities } from "@/lib/db/schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";
import { revalidatePath } from "next/cache";

/**
 * Fetch all availability slots for a specific date
 */
export async function getAvailabilityForDate(date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const busySlots = await db
    .select({
      userId: availabilities.userId,
      type: availabilities.type,
      startsAt: availabilities.startsAt,
      endsAt: availabilities.endsAt,
    })
    .from(availabilities)
    .where(
      and(
        gte(availabilities.startsAt, dayStart),
        lte(availabilities.startsAt, dayEnd)
      )
    );

  return busySlots;
}

/**
 * Fetch all future availability slots for a specific user
 */
export async function getUserAvailability(userId: string) {
  return await db
    .select()
    .from(availabilities)
    .where(
      and(
        eq(availabilities.userId, userId),
        gte(availabilities.startsAt, new Date())
      )
    )
    .orderBy(asc(availabilities.startsAt));
}

/**
 * Add a new busy slot
 */
export async function addBusySlot(userId: string, startsAt: Date, endsAt: Date) {
  try {
    await db.insert(availabilities).values({
      userId,
      type: "PERSONAL", // Note: This uses the string value defined in your Enum
      startsAt,
      endsAt,
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Drizzle Error:", error);
    return { success: false, error: "Failed to add busy slot" };
  }
}

/**
 * Delete a slot
 */
export async function deleteAvailability(slotId: string) {
  try {
    await db
      .delete(availabilities)
      .where(eq(availabilities.id, slotId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Drizzle Error:", error);
    return { success: false, error: "Failed to delete slot" };
  }
}