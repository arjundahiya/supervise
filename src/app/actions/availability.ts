"use server";

import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
export async function getAvailabilityForDate(date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const busySlots = await prisma.availability.findMany({
    where: {
      startsAt: {
        gte: dayStart,
        lte: dayEnd
      }
    },
    select: {
      userId: true,
      type: true, // Fetch type (PERSONAL or GLOBAL)
      startsAt: true,
      endsAt: true
    }
  });

  return busySlots;
}

/**
 * Fetch all future availability slots for a specific user
 */
export async function getUserAvailability(userId: string) {
  return await prisma.availability.findMany({
    where: {
      userId: userId,
      startsAt: {
        gte: new Date() // Only show future/current slots
      }
    },
    orderBy: {
      startsAt: 'asc'
    }
  });
}

/**
 * Add a new busy slot
 */
export async function addBusySlot(userId: string, startsAt: Date, endsAt: Date) {
  try {
    await prisma.availability.create({
      data: {
        userId,
        type: "PERSONAL",
        startsAt,
        endsAt
      }
    });
    revalidatePath("/dashboard"); // Refresh the student page
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to add busy slot" };
  }
}

/**
 * Delete a slot
 */
export async function deleteAvailability(slotId: string) {
  try {
    await prisma.availability.delete({
      where: { id: slotId }
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete slot" };
  }
}