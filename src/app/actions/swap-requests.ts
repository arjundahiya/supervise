"use server";

import { db } from "@/lib/db";
import { swapRequests, supervisions, usersToSupervisions, availabilities } from "@/lib/db/schema";
import { eq, and, or, desc, sql, gte } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { Resend } from 'resend';
import { CALENDAR_CACHE_TAG } from "@/app/api/calendar/[userId]/route";

/**
 * Get all swap requests for a user (both sent and received)
 */
export async function getSwapRequestsForUser(userId: string) {
  const requests = await db.query.swapRequests.findMany({
    where: or(
      eq(swapRequests.requesterId, userId),
      eq(swapRequests.targetId, userId)
    ),
    with: {
      supervision: true,
      requester: {
        columns: {
          id: true,
          full_name: true,
          email_address: true,
          image: true,
        }
      },
      target: {
        columns: {
          id: true,
          full_name: true,
          email_address: true,
          image: true,
        }
      }
    },
    orderBy: [desc(swapRequests.createdAt)]
  });

  return requests;
}

/**
 * Get pending swap requests count for notifications
 */
export async function getPendingSwapCount(userId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(swapRequests)
    .where(
      and(
        eq(swapRequests.targetId, userId),
        eq(swapRequests.status, "PENDING")
      )
    );

  return result[0]?.count || 0;
}

/**
 * Get possible swap targets for a supervision
 * (students in other sessions of the same supervision series)
 */
export async function getPossibleSwapTargets(
  supervisionId: string,
  currentUserId: string
) {
  // First get the current supervision details
  const currentSupervision = await db.query.supervisions.findFirst({
    where: eq(supervisions.id, supervisionId),
  });

  if (!currentSupervision) {
    return { success: false, error: "Supervision not found" };
  }

  const now = new Date();

  const sameSeriesSupervisions = await db.query.supervisions.findMany({
    where: and(
      eq(supervisions.title, currentSupervision.title),
      sql`${supervisions.id} != ${supervisionId}`,
      gte(supervisions.startsAt, now)
    ),
    with: {
      students: {
        with: {
          user: {
            columns: {
              id: true,
              full_name: true,
              email_address: true,
              image: true,
            }
          }
        }
      }
    },
    orderBy: [sql`${supervisions.startsAt} ASC`]
  });

  // Check for availability conflicts for each potential swap
  const potentialTargetsWithConflicts = await Promise.all(
    sameSeriesSupervisions.flatMap(supervision =>
      supervision.students
        .filter(s => s.user.id !== currentUserId)
        .map(async (s) => {
          // Check if target would have availability conflicts during current user's supervision time
          const targetConflicts = await db.query.availabilities.findMany({
            where: and(
              eq(availabilities.userId, s.user.id),
              sql`${availabilities.startsAt} < ${currentSupervision.endsAt}`,
              sql`${availabilities.endsAt} > ${currentSupervision.startsAt}`
            )
          });

          // Check if current user would have availability conflicts during target's supervision time
          const currentUserConflicts = await db.query.availabilities.findMany({
            where: and(
              eq(availabilities.userId, currentUserId),
              sql`${availabilities.startsAt} < ${supervision.endsAt}`,
              sql`${availabilities.endsAt} > ${supervision.startsAt}`
            )
          });

          return {
            ...s.user,
            supervisionId: supervision.id,
            supervisionTitle: supervision.title,
            supervisionTime: supervision.startsAt,
            supervisionLocation: supervision.location,
            hasConflict: targetConflicts.length > 0 || currentUserConflicts.length > 0,
            conflictReason: targetConflicts.length > 0 
              ? 'Target is busy during your current supervision time' 
              : currentUserConflicts.length > 0 
              ? 'You are busy during their supervision time' 
              : null,
          };
        })
    )
  );

  const resolvedTargets = await Promise.all(potentialTargetsWithConflicts);
  
  return { 
    success: true, 
    availableTargets: resolvedTargets.filter(t => !t.hasConflict),
    unavailableTargets: resolvedTargets.filter(t => t.hasConflict)
  };
}

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Create a new swap request
 */
export async function createSwapRequest(
  supervisionId: string,
  requesterId: string,
  targetId: string,
  targetEmail: string
) {
  try {
    // Check if a swap request already exists
    const existing = await db.query.swapRequests.findFirst({
      where: and(
        eq(swapRequests.supervisionId, supervisionId),
        eq(swapRequests.requesterId, requesterId),
        eq(swapRequests.targetId, targetId),
        eq(swapRequests.status, "PENDING")
      )
    });

    if (existing) {
      return { success: false, error: "Swap request already exists" };
    }

    await db.insert(swapRequests).values({
      supervisionId,
      requesterId,
      targetId,
      status: "PENDING",
    });

    revalidatePath("/dashboard");

    resend.emails.send({
      from: 'no-reply@supervise.arjun.run',
      to: targetEmail,
      subject: 'Swap Request',
      html: '<p>Somebody has requested to swap supervisions with you. <a href="https://supervise-navy.vercel.app/">Login to Supervise</a> to accept or reject this.'
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create swap request:", error);
    return { success: false, error: "Failed to create swap request" };
  }
}

/**
 * Accept a swap request (swaps the students between supervisions)
 */
export async function acceptSwapRequest(requestId: string, targetId: string) {
  try {
    // Get the swap request with full details
    const request = await db.query.swapRequests.findFirst({
      where: eq(swapRequests.id, requestId),
      with: {
        supervision: true,
        requester: true,
      }
    });

    if (!request) {
      return { success: false, error: "Swap request not found" };
    }

    if (request.targetId !== targetId) {
      return { success: false, error: "Unauthorized" };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: "Request already processed" };
    }

    // Find the target's supervision for this same series (by title)
    const targetSupervisions = await db.query.usersToSupervisions.findMany({
      where: eq(usersToSupervisions.userId, targetId),
      with: { supervision: true }
    });

    // Find the supervision with the same title as the requested one
    const targetSupervision = targetSupervisions.find(ts =>
      ts.supervision.title === request.supervision.title
    );

    if (!targetSupervision) {
      return { success: false, error: "Target is not enrolled in this supervision series" };
    }

    // Prevent self-swapping (swapping into the same session)
    if (targetSupervision.supervision.id === request.supervisionId) {
      return { success: false, error: "Cannot swap into the same session" };
    }

    // Perform the swap in a transaction-like manner
    // 1. Remove requester from original supervision
    await db
      .delete(usersToSupervisions)
      .where(
        and(
          eq(usersToSupervisions.userId, request.requesterId),
          eq(usersToSupervisions.supervisionId, request.supervisionId)
        )
      );

    // 2. Remove target from their supervision
    await db
      .delete(usersToSupervisions)
      .where(
        and(
          eq(usersToSupervisions.userId, targetId),
          eq(usersToSupervisions.supervisionId, targetSupervision.supervision.id)
        )
      );

    // 3. Add requester to target's supervision
    await db.insert(usersToSupervisions).values({
      userId: request.requesterId,
      supervisionId: targetSupervision.supervision.id,
    });

    // 4. Add target to requester's original supervision
    await db.insert(usersToSupervisions).values({
      userId: targetId,
      supervisionId: request.supervisionId,
    });

    // 5. Update swap request status
    await db
      .update(swapRequests)
      .set({
        status: "ACCEPTED",
        respondedAt: new Date(),
      })
      .where(eq(swapRequests.id, requestId));

    revalidatePath("/dashboard");
    revalidateTag(CALENDAR_CACHE_TAG, { expire: 0 });
    return { success: true };
  } catch (error) {
    console.error("Failed to accept swap:", error);
    return { success: false, error: "Failed to complete swap" };
  }
}

/**
 * Reject a swap request
 */
export async function rejectSwapRequest(requestId: string, targetId: string) {
  try {
    const request = await db.query.swapRequests.findFirst({
      where: eq(swapRequests.id, requestId),
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.targetId !== targetId) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(swapRequests)
      .set({
        status: "REJECTED",
        respondedAt: new Date(),
      })
      .where(eq(swapRequests.id, requestId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject swap:", error);
    return { success: false, error: "Failed to reject request" };
  }
}

/**
 * Cancel a swap request (by the requester)
 */
export async function cancelSwapRequest(requestId: string, requesterId: string) {
  try {
    const request = await db.query.swapRequests.findFirst({
      where: eq(swapRequests.id, requestId),
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    if (request.requesterId !== requesterId) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(swapRequests)
      .set({
        status: "CANCELLED",
        respondedAt: new Date(),
      })
      .where(eq(swapRequests.id, requestId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel swap:", error);
    return { success: false, error: "Failed to cancel request" };
  }
}