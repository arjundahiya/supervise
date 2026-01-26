"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { addWeeks, addMinutes } from "date-fns";

/**
 * Fetch all assignable users (Students AND Admins)
 */
export async function getStudentsForSelection() {
  const users = await prisma.users.findMany({
    where: {
      role: {
        in: ["STUDENT", "ADMIN"] // Fetch both roles
      },
    },
    select: {
      id: true,
      full_name: true,  // Adjust if your column is 'full_name'
      email_address: true, // Adjust if your column is 'email_address'
    },
    orderBy: {
      full_name: "asc",
    },
  });
  
  // Normalize data shape for the frontend
  return users.map(u => ({
    id: u.id,
    full_name: u.full_name || "Unknown Name", 
    email_address: u.email_address
  }));
}

/**
 * Create a new supervision
 */
export async function createSupervision(formData: {
  title: string;
  supervisorName: string;
  location: string;
  description: string;
  startsAt: Date;
  durationMinutes: number; // New field
  repeatUntil?: Date;      // New optional field
  studentIds: string[];
}) {
  try {
    const fullDescription = `Supervisor: ${formData.supervisorName}\n\n${formData.description}`;
    
    // We will collect all the "create" promises here
    const operations = [];

    let currentStart = formData.startsAt;
    // If no repeat date is set, we treat it as the same as the start date (run once)
    const endLimit = formData.repeatUntil || formData.startsAt;

    // Loop: Keep adding weeks while the current start date is before or on the limit
    while (currentStart <= endLimit) {
      
      const currentEnd = addMinutes(currentStart, formData.durationMinutes);

      operations.push(
        prisma.supervision.create({
          data: {
            title: formData.title,
            location: formData.location,
            description: fullDescription,
            startsAt: currentStart,
            endsAt: currentEnd,
            students: {
              connect: formData.studentIds.map((id) => ({ id })),
            },
          },
        })
      );

      // Prepare for next iteration
      currentStart = addWeeks(currentStart, 1);
      
      // Safety break: Just in case someone sets a date 100 years in the future
      if (operations.length > 52) break; 
    }

    // Run all creations in a transaction so they succeed or fail together
    await prisma.$transaction(operations);

    revalidatePath("/admin");
    revalidateTag("supervisions", "max");
    return { success: true, count: operations.length };
  } catch (error) {
    console.error("Failed to create supervision:", error);
    return { success: false, error: "Failed to create supervision" };
  }
}

export async function deleteSupervision(id: string) {
  try {
    await prisma.supervision.delete({
      where: { id },
    });
    revalidatePath("/admin");
    revalidateTag("supervisions", "max");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

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

    await prisma.supervision.update({
      where: { id },
      data: {
        title: data.title,
        location: data.location,
        description: fullDescription,
        startsAt: data.startsAt,
        endsAt: endsAt,
        students: {
          set: [], // Disconnect everyone first (easiest way to sync)
          connect: data.studentIds.map((sid) => ({ id: sid })),
        },
      },
    });

    revalidatePath("/admin");
    revalidateTag("supervisions", "max");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update" };
  }
}